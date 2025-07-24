import tensorflow as tf
import cv2
import numpy as np
import pytesseract
from PIL import Image
import re
import json
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch

class DocumentProcessor:
    def __init__(self):
        """Initialize the document processor with pre-trained models."""
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Initialize document classifier
        self.document_classifier = pipeline(
            "text-classification",
            model="microsoft/DialoGPT-medium",
            device=0 if torch.cuda.is_available() else -1
        )
        
        # Initialize fraud detection model
        self.fraud_detector = self._load_fraud_model()
        
        # Document type patterns
        self.document_patterns = {
            'aadhar': {
                'patterns': [
                    r'\d{4}\s\d{4}\s\d{4}',  # Aadhar number pattern
                    r'Government of India',
                    r'Date of Birth',
                    r'UIDAI'
                ],
                'required_fields': ['name', 'dob', 'gender', 'address']
            },
            'pan': {
                'patterns': [
                    r'[A-Z]{5}\d{4}[A-Z]',  # PAN number pattern
                    r'Permanent Account Number',
                    r'Income Tax Department',
                    r'Father\'s Name'
                ],
                'required_fields': ['name', 'father_name', 'dob']
            },
            'voter_id': {
                'patterns': [
                    r'[A-Z]{3}\d{7}',  # Voter ID pattern
                    r'Election Commission',
                    r'EPIC No',
                    r'Constituency'
                ],
                'required_fields': ['name', 'father_name', 'address']
            },
            'driving_license': {
                'patterns': [
                    r'[A-Z]{2}\d{2}\s\d{11}',  # DL number pattern
                    r'DRIVING LICENCE',
                    r'Valid Till',
                    r'DOB'
                ],
                'required_fields': ['name', 'dob', 'address', 'license_number']
            }
        }

    def _load_fraud_model(self):
        """Load or create fraud detection model."""
        try:
            model = tf.keras.models.load_model('models/fraud_detector.h5')
            return model
        except:
            # Create a simple fraud detection model if not found
            model = tf.keras.Sequential([
                tf.keras.layers.Dense(128, activation='relu', input_shape=(100,)),
                tf.keras.layers.Dropout(0.3),
                tf.keras.layers.Dense(64, activation='relu'),
                tf.keras.layers.Dropout(0.3),
                tf.keras.layers.Dense(32, activation='relu'),
                tf.keras.layers.Dense(1, activation='sigmoid')
            ])
            model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
            return model

    def extract_text_ocr(self, image_data):
        """Extract text from image using OCR."""
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Preprocess image for better OCR
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply image preprocessing
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            enhanced = clahe.apply(gray)
            
            # Apply Gaussian blur and threshold
            blurred = cv2.GaussianBlur(enhanced, (5, 5), 0)
            _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Extract text using Tesseract
            custom_config = r'--oem 3 --psm 6 -l eng+hin'
            text = pytesseract.image_to_string(thresh, config=custom_config)
            
            return {
                'extracted_text': text,
                'confidence': self._calculate_ocr_confidence(text),
                'preprocessing_applied': True
            }
        except Exception as e:
            return {
                'extracted_text': '',
                'confidence': 0,
                'error': str(e)
            }

    def _calculate_ocr_confidence(self, text):
        """Calculate OCR confidence based on text quality."""
        if not text.strip():
            return 0
        
        # Simple heuristic: more words and numbers indicate better extraction
        words = len(text.split())
        numbers = len(re.findall(r'\d+', text))
        special_chars = len(re.findall(r'[^\w\s]', text))
        
        confidence = min(100, (words * 5 + numbers * 3 - special_chars) / len(text) * 100)
        return max(0, confidence)

    def classify_document_type(self, text, claimed_type=None):
        """Classify document type based on extracted text."""
        scores = {}
        
        for doc_type, config in self.document_patterns.items():
            score = 0
            
            # Check for pattern matches
            for pattern in config['patterns']:
                matches = len(re.findall(pattern, text, re.IGNORECASE))
                score += matches * 10
            
            # Check for required fields presence
            for field in config['required_fields']:
                field_patterns = {
                    'name': r'Name\s*:?\s*([A-Za-z\s]+)',
                    'dob': r'DOB|Date of Birth\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
                    'father_name': r'Father[\'s]*\s*Name\s*:?\s*([A-Za-z\s]+)',
                    'address': r'Address\s*:?\s*([A-Za-z0-9\s,.-]+)',
                    'license_number': r'DL\s*No|License\s*No\s*:?\s*([A-Z0-9\s]+)'
                }
                
                if field in field_patterns:
                    if re.search(field_patterns[field], text, re.IGNORECASE):
                        score += 5
            
            scores[doc_type] = score
        
        # Get the highest scoring document type
        predicted_type = max(scores, key=scores.get) if scores else 'unknown'
        confidence = scores.get(predicted_type, 0) / 100  # Normalize to 0-1
        
        return {
            'predicted_type': predicted_type,
            'confidence': min(1.0, confidence),
            'scores': scores,
            'matches_claimed': predicted_type == claimed_type if claimed_type else None
        }

    def extract_structured_data(self, text, document_type):
        """Extract structured data based on document type."""
        data = {}
        
        if document_type not in self.document_patterns:
            return data
        
        # Define extraction patterns for each field
        extraction_patterns = {
            'name': r'Name\s*:?\s*([A-Za-z\s]+?)(?:\n|Date|DOB|Father)',
            'father_name': r'Father[\'s]*\s*Name\s*:?\s*([A-Za-z\s]+?)(?:\n|Date|DOB)',
            'dob': r'DOB|Date of Birth\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
            'gender': r'Gender\s*:?\s*(Male|Female|M|F)',
            'address': r'Address\s*:?\s*([A-Za-z0-9\s,.-]+?)(?:\n|PIN|Pincode)',
            'aadhar_number': r'(\d{4}\s\d{4}\s\d{4})',
            'pan_number': r'([A-Z]{5}\d{4}[A-Z])',
            'voter_id_number': r'([A-Z]{3}\d{7})',
            'license_number': r'DL\s*No|License\s*No\s*:?\s*([A-Z0-9\s]+)'
        }
        
        for field, pattern in extraction_patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                data[field] = match.group(1).strip()
        
        return data

    def detect_fraud(self, image_data, text_data, document_type):
        """Detect potential fraud in the document."""
        fraud_indicators = []
        risk_score = 0
        
        try:
            # Convert image for analysis
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Check image quality metrics
            quality_metrics = self._analyze_image_quality(image)
            
            # Check for digital manipulation
            manipulation_score = self._detect_manipulation(image)
            
            # Check text consistency
            consistency_score = self._check_text_consistency(text_data, document_type)
            
            # Calculate overall risk score
            risk_score = (
                quality_metrics['risk'] * 0.3 +
                manipulation_score * 0.4 +
                consistency_score * 0.3
            )
            
            # Generate fraud indicators
            if quality_metrics['risk'] > 0.7:
                fraud_indicators.append("Poor image quality detected")
            
            if manipulation_score > 0.6:
                fraud_indicators.append("Potential digital manipulation detected")
            
            if consistency_score > 0.5:
                fraud_indicators.append("Text inconsistencies found")
            
            return {
                'risk_score': risk_score,
                'fraud_indicators': fraud_indicators,
                'is_potentially_fraudulent': risk_score > 0.6,
                'quality_metrics': quality_metrics,
                'manipulation_score': manipulation_score,
                'consistency_score': consistency_score
            }
            
        except Exception as e:
            return {
                'risk_score': 0.5,
                'fraud_indicators': [f"Error in fraud detection: {str(e)}"],
                'is_potentially_fraudulent': False,
                'error': str(e)
            }

    def _analyze_image_quality(self, image):
        """Analyze image quality metrics."""
        # Calculate blur detection using Laplacian variance
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Calculate brightness and contrast
        brightness = np.mean(gray)
        contrast = np.std(gray)
        
        # Normalize scores
        blur_risk = 1.0 if blur_score < 100 else max(0, (500 - blur_score) / 400)
        brightness_risk = abs(brightness - 127) / 127  # Ideal brightness is around 127
        contrast_risk = 1.0 if contrast < 30 else max(0, (100 - contrast) / 70)
        
        overall_risk = (blur_risk + brightness_risk + contrast_risk) / 3
        
        return {
            'blur_score': blur_score,
            'brightness': brightness,
            'contrast': contrast,
            'risk': overall_risk
        }

    def _detect_manipulation(self, image):
        """Detect potential digital manipulation."""
        # Simple manipulation detection using error level analysis
        # This is a simplified version - in production, use more sophisticated methods
        
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Calculate gradient magnitude
        grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        magnitude = np.sqrt(grad_x**2 + grad_y**2)
        
        # Check for unusual edge patterns that might indicate manipulation
        edge_variance = np.var(magnitude)
        mean_gradient = np.mean(magnitude)
        
        # Normalize manipulation score (simplified heuristic)
        manipulation_score = min(1.0, edge_variance / (mean_gradient * 1000))
        
        return manipulation_score

    def _check_text_consistency(self, text_data, document_type):
        """Check for text inconsistencies that might indicate fraud."""
        inconsistencies = 0
        total_checks = 0
        
        # Check date format consistency
        dates = re.findall(r'\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}', text_data)
        if dates:
            total_checks += 1
            formats = set(re.findall(r'[\/\-]', date) for date in dates)
            if len(formats) > 1:  # Multiple date formats used
                inconsistencies += 1
        
        # Check for duplicate information
        words = text_data.lower().split()
        if len(words) != len(set(words)):  # Duplicate words might indicate copy-paste fraud
            total_checks += 1
            duplicate_ratio = 1 - len(set(words)) / len(words)
            if duplicate_ratio > 0.3:
                inconsistencies += 1
        
        # Check number consistency (Aadhar, PAN, etc.)
        if document_type == 'aadhar':
            aadhar_numbers = re.findall(r'\d{4}\s\d{4}\s\d{4}', text_data)
            if len(aadhar_numbers) > 1:
                total_checks += 1
                if len(set(aadhar_numbers)) > 1:  # Multiple different Aadhar numbers
                    inconsistencies += 1
        
        consistency_score = inconsistencies / max(1, total_checks)
        return consistency_score

    def process_document(self, image_data, document_type=None):
        """Main method to process a document comprehensively."""
        try:
            # Extract text
            ocr_result = self.extract_text_ocr(image_data)
            extracted_text = ocr_result['extracted_text']
            
            # Classify document type
            classification_result = self.classify_document_type(extracted_text, document_type)
            
            # Extract structured data
            structured_data = self.extract_structured_data(
                extracted_text, 
                classification_result['predicted_type']
            )
            
            # Detect fraud
            fraud_result = self.detect_fraud(image_data, extracted_text, classification_result['predicted_type'])
            
            # Generate summary
            summary = self._generate_summary(
                classification_result, 
                structured_data, 
                fraud_result, 
                ocr_result
            )
            
            return {
                'ocr_result': ocr_result,
                'classification': classification_result,
                'structured_data': structured_data,
                'fraud_detection': fraud_result,
                'summary': summary,
                'processing_status': 'success'
            }
            
        except Exception as e:
            return {
                'processing_status': 'error',
                'error': str(e),
                'summary': {
                    'confidence': 0,
                    'is_valid': False,
                    'issues': [f"Processing error: {str(e)}"]
                }
            }

    def _generate_summary(self, classification, structured_data, fraud_result, ocr_result):
        """Generate a comprehensive summary of the document analysis."""
        issues = []
        warnings = []
        
        # Check classification confidence
        if classification['confidence'] < 0.7:
            issues.append("Low document type classification confidence")
        
        # Check OCR quality
        if ocr_result['confidence'] < 50:
            warnings.append("Poor text extraction quality")
        
        # Check fraud indicators
        if fraud_result['is_potentially_fraudulent']:
            issues.extend(fraud_result['fraud_indicators'])
        
        # Check required data extraction
        missing_fields = []
        if classification['predicted_type'] in self.document_patterns:
            required_fields = self.document_patterns[classification['predicted_type']]['required_fields']
            for field in required_fields:
                if field not in structured_data or not structured_data[field]:
                    missing_fields.append(field)
        
        if missing_fields:
            warnings.append(f"Missing required fields: {', '.join(missing_fields)}")
        
        # Calculate overall confidence
        overall_confidence = (
            classification['confidence'] * 0.4 +
            (ocr_result['confidence'] / 100) * 0.3 +
            (1 - fraud_result['risk_score']) * 0.3
        )
        
        is_valid = (
            overall_confidence > 0.6 and
            not fraud_result['is_potentially_fraudulent'] and
            len(issues) == 0
        )
        
        return {
            'confidence': overall_confidence,
            'is_valid': is_valid,
            'document_type': classification['predicted_type'],
            'extracted_fields': len(structured_data),
            'issues': issues,
            'warnings': warnings,
            'fraud_risk_score': fraud_result['risk_score'],
            'recommendation': self._get_recommendation(overall_confidence, issues)
        }

    def _get_recommendation(self, confidence, issues):
        """Get processing recommendation based on analysis."""
        if len(issues) > 0:
            return "REJECT - Serious issues detected"
        elif confidence > 0.8:
            return "APPROVE - High confidence"
        elif confidence > 0.6:
            return "REVIEW - Manual verification recommended"
        else:
            return "REJECT - Low confidence"

# Example usage and API endpoint
if __name__ == "__main__":
    processor = DocumentProcessor()
    
    # Test with sample image
    with open("test_document.jpg", "rb") as f:
        image_data = f.read()
    
    result = processor.process_document(image_data, "aadhar")
    print(json.dumps(result, indent=2))
