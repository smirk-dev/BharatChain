import os
import cv2
import numpy as np
import pytesseract
import easyocr
from PIL import Image
import logging
from typing import Dict, List, Any
import json
import re
from datetime import datetime

# Safe PyMuPDF import with fallback
try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

# Safe imports with fallbacks - moved to lazy loading
HAS_TRANSFORMERS = False
HAS_SENTENCE_TRANSFORMERS = False

try:
    import magic
    HAS_MAGIC = True
except ImportError:
    HAS_MAGIC = False

logger = logging.getLogger(__name__)

class DocumentProcessor:
    def __init__(self):
        """Initialize the document processor with AI models"""
        self.models_loaded = False
        self.load_models()
    
    def load_models(self):
        """Load all required AI models with fallbacks"""
        try:
            logger.info("Loading AI models for document processing...")
            
            # Initialize OCR readers with warning suppression
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                try:
                    self.easyocr_reader = easyocr.Reader(['en', 'hi'])  # English and Hindi
                    logger.info("EasyOCR loaded successfully")
                except Exception as e:
                    logger.warning(f"EasyOCR failed to load: {e}")
                    self.easyocr_reader = None
            
            # Try to load AI models only if transformers is available
            try:
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    import torch
                    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
                global HAS_TRANSFORMERS
                HAS_TRANSFORMERS = True
                
                # Load document classification model
                self.doc_classifier = pipeline(
                    "text-classification",
                    model="microsoft/DialoGPT-medium",
                    return_all_scores=True
                )
                
                # Load sentiment analysis model
                self.sentiment_analyzer = pipeline(
                    "sentiment-analysis",
                    model="cardiffnlp/twitter-roberta-base-sentiment-latest"
                )
                logger.info("Transformer models loaded successfully")
            except Exception as e:
                logger.info("Transformer models not available, using basic text analysis")
                self.doc_classifier = None
                self.sentiment_analyzer = None
                HAS_TRANSFORMERS = False
            
            # Try to load text similarity model if available
            # Temporarily disabled due to TensorFlow dependency issues
            # try:
            #     with warnings.catch_warnings():
            #         warnings.simplefilter("ignore")
            #         from sentence_transformers import SentenceTransformer
            #     global HAS_SENTENCE_TRANSFORMERS
            #     HAS_SENTENCE_TRANSFORMERS = True
            #     self.similarity_model = SentenceTransformer('all-MiniLM-L6-v2')
            #     logger.info("Sentence transformer loaded successfully")
            # except Exception as e:
            #     logger.info("Sentence transformer not available, using basic similarity")
            #     self.similarity_model = None
            #     HAS_SENTENCE_TRANSFORMERS = False
            
            # For now, disable sentence transformers completely
            logger.info("Sentence transformer disabled to avoid TensorFlow conflicts")
            self.similarity_model = None
            HAS_SENTENCE_TRANSFORMERS = False
            
            # Document type patterns
            self.document_patterns = {
                'aadhaar': [r'\d{4}\s\d{4}\s\d{4}', r'aadhaar', r'आधार'],
                'pan': [r'[A-Z]{5}\d{4}[A-Z]{1}', r'permanent account number', r'pan card'],
                'passport': [r'[A-Z]\d{7}', r'passport', r'republic of india'],
                'driving_license': [r'[A-Z]{2}\d{13}', r'driving', r'license', r'transport'],
                'voter_id': [r'[A-Z]{3}\d{7}', r'voter', r'election', r'eci'],
                'birth_certificate': [r'birth certificate', r'date of birth', r'registrar'],
                'income_certificate': [r'income certificate', r'annual income', r'salary'],
                'caste_certificate': [r'caste certificate', r'category', r'sc|st|obc'],
                'domicile': [r'domicile', r'residence', r'permanent resident']
            }
            
            self.models_loaded = True
            logger.info("Document processor initialized with available dependencies")
            
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")
            self.models_loaded = False
    
    def analyze_document(self, filepath: str) -> Dict[str, Any]:
        """Main document analysis function"""
        try:
            # Detect file type
            file_type = self.detect_file_type(filepath)
            
            # Extract text based on file type
            if file_type == 'pdf':
                text = self.extract_text_from_pdf(filepath)
                images = self.extract_images_from_pdf(filepath)
            elif file_type in ['image', 'jpg', 'jpeg', 'png', 'bmp', 'tiff']:
                text = self.extract_text_from_image(filepath)
                images = [filepath]
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
            
            # Perform comprehensive analysis
            analysis = {
                'file_info': {
                    'type': file_type,
                    'size': os.path.getsize(filepath),
                    'processed_at': datetime.now().isoformat()
                },
                'text_extraction': {
                    'extracted_text': text,
                    'text_length': len(text),
                    'confidence': self.calculate_text_confidence(text)
                },
                'document_classification': self.classify_document(text),
                'data_extraction': self.extract_structured_data(text),
                'fraud_detection': self.detect_fraud_indicators(text, filepath),
                'quality_assessment': self.assess_document_quality(filepath, text),
                'language_detection': self.detect_language(text),
                'security_features': self.analyze_security_features(text)
            }
            
            # Calculate overall confidence
            analysis['overall_confidence'] = self.calculate_overall_confidence(analysis)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error in document analysis: {str(e)}")
            raise
    
    def detect_file_type(self, filepath: str) -> str:
        """Detect the type of uploaded file"""
        try:
            if HAS_MAGIC:
                mime = magic.Magic(mime=True)
                file_mime = mime.from_file(filepath)
                
                if 'pdf' in file_mime:
                    return 'pdf'
                elif 'image' in file_mime:
                    return 'image'
            
            # Fallback to extension-based detection
            ext = os.path.splitext(filepath)[1].lower()
            if ext == '.pdf':
                return 'pdf'
            elif ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
                return 'image'
            else:
                return 'unknown'
                
        except Exception as e:
            logger.warning(f"Error detecting file type: {e}")
            # Fallback method
            ext = os.path.splitext(filepath)[1].lower()
            if ext == '.pdf':
                return 'pdf'
            elif ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
                return 'image'
            return 'unknown'
    
    def extract_text_from_pdf(self, filepath: str) -> str:
        """Extract text from PDF using PyMuPDF with fallback"""
        if not HAS_PYMUPDF:
            logger.warning("PyMuPDF not available, cannot extract text from PDF")
            return "PDF processing not available - PyMuPDF missing"
        
        try:
            doc = fitz.open(filepath)
            text = ""
            
            for page_num in range(doc.page_count):
                page = doc[page_num]
                text += page.get_text()
            
            doc.close()
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {str(e)}")
            return ""
    
    def extract_images_from_pdf(self, filepath: str) -> List[str]:
        """Extract images from PDF for OCR with fallback"""
        if not HAS_PYMUPDF:
            logger.warning("PyMuPDF not available, cannot extract images from PDF")
            return []
        
        try:
            doc = fitz.open(filepath)
            images = []
            
            for page_num in range(doc.page_count):
                page = doc[page_num]
                image_list = page.get_images()
                
                for img_index, img in enumerate(image_list):
                    xref = img[0]
                    pix = fitz.Pixmap(doc, xref)
                    
                    if pix.n - pix.alpha < 4:  # GRAY or RGB
                        img_path = f"temp_page_{page_num}_img_{img_index}.png"
                        pix.save(img_path)
                        images.append(img_path)
                    
                    pix = None
            
            doc.close()
            return images
        except Exception as e:
            logger.error(f"Error extracting images from PDF: {str(e)}")
            return []
    
    def extract_text_from_image(self, filepath: str) -> str:
        """Extract text from image using multiple OCR methods"""
        try:
            # Method 1: EasyOCR
            easyocr_text = ""
            if self.easyocr_reader:
                try:
                    results = self.easyocr_reader.readtext(filepath)
                    easyocr_text = " ".join([result[1] for result in results])
                except Exception as e:
                    logger.warning(f"EasyOCR failed: {str(e)}")
            
            # Method 2: Tesseract OCR
            tesseract_text = ""
            try:
                image = Image.open(filepath)
                tesseract_text = pytesseract.image_to_string(image)
            except Exception as e:
                logger.warning(f"Tesseract OCR failed: {str(e)}")
            
            # Combine results and choose the better one
            if len(easyocr_text) > len(tesseract_text):
                return easyocr_text
            else:
                return tesseract_text
                
        except Exception as e:
            logger.error(f"Error extracting text from image: {str(e)}")
            return ""
    
    def classify_document(self, text: str) -> Dict[str, Any]:
        """Classify document type using pattern matching and AI"""
        classification = {
            'detected_type': 'unknown',
            'confidence': 0.0,
            'possible_types': [],
            'patterns_found': []
        }
        
        try:
            text_lower = text.lower()
            scores = {}
            
            # Pattern-based classification
            for doc_type, patterns in self.document_patterns.items():
                score = 0
                found_patterns = []
                
                for pattern in patterns:
                    matches = re.findall(pattern, text_lower)
                    if matches:
                        score += len(matches)
                        found_patterns.extend(matches)
                
                if score > 0:
                    scores[doc_type] = score
                    classification['patterns_found'].extend(found_patterns)
            
            # Determine best match
            if scores:
                best_type = max(scores.keys(), key=lambda x: scores[x])
                classification['detected_type'] = best_type
                classification['confidence'] = min(scores[best_type] * 0.2, 1.0)
                
                # Sort possible types by score
                sorted_types = sorted(scores.items(), key=lambda x: x[1], reverse=True)
                classification['possible_types'] = [
                    {'type': t, 'score': s} for t, s in sorted_types[:3]
                ]
        
        except Exception as e:
            logger.error(f"Error in document classification: {str(e)}")
        
        return classification
    
    def extract_structured_data(self, text: str) -> Dict[str, Any]:
        """Extract structured data from document text"""
        extracted_data = {
            'personal_info': {},
            'numbers': {},
            'dates': {},
            'addresses': []
        }
        
        try:
            # Extract Aadhaar numbers
            aadhaar_pattern = r'\d{4}\s?\d{4}\s?\d{4}'
            aadhaar_matches = re.findall(aadhaar_pattern, text)
            if aadhaar_matches:
                extracted_data['numbers']['aadhaar'] = aadhaar_matches
            
            # Extract PAN numbers
            pan_pattern = r'[A-Z]{5}\d{4}[A-Z]{1}'
            pan_matches = re.findall(pan_pattern, text)
            if pan_matches:
                extracted_data['numbers']['pan'] = pan_matches
            
            # Extract dates
            date_patterns = [
                r'\d{1,2}[-/]\d{1,2}[-/]\d{4}',
                r'\d{1,2}[-/]\d{1,2}[-/]\d{2}',
                r'\d{4}[-/]\d{1,2}[-/]\d{1,2}'
            ]
            dates = []
            for pattern in date_patterns:
                dates.extend(re.findall(pattern, text))
            if dates:
                extracted_data['dates']['found_dates'] = dates
            
            # Extract names (simple heuristic)
            name_pattern = r'Name[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'
            name_matches = re.findall(name_pattern, text, re.IGNORECASE)
            if name_matches:
                extracted_data['personal_info']['names'] = name_matches
            
            # Extract phone numbers
            phone_pattern = r'(?:\+91|91)?[6-9]\d{9}'
            phone_matches = re.findall(phone_pattern, text)
            if phone_matches:
                extracted_data['numbers']['phone'] = phone_matches
            
            # Extract emails
            email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
            email_matches = re.findall(email_pattern, text)
            if email_matches:
                extracted_data['personal_info']['emails'] = email_matches
        
        except Exception as e:
            logger.error(f"Error extracting structured data: {str(e)}")
        
        return extracted_data
    
    def detect_fraud_indicators(self, text: str, filepath: str) -> Dict[str, Any]:
        """Detect potential fraud indicators"""
        fraud_analysis = {
            'risk_score': 0.0,
            'indicators': [],
            'image_analysis': {},
            'text_analysis': {}
        }
        
        try:
            risk_factors = []
            
            # Text-based fraud indicators
            suspicious_patterns = [
                (r'photocopy|xerox|duplicate', 'Possible photocopy'),
                (r'invalid|fake|forged', 'Contains suspicious keywords'),
                (r'specimen|sample|example', 'May be a specimen document')
            ]
            
            for pattern, description in suspicious_patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    risk_factors.append(description)
            
            # Image quality analysis (if image file)
            if filepath.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp')):
                image_risk = self.analyze_image_quality(filepath)
                fraud_analysis['image_analysis'] = image_risk
                if image_risk.get('suspicious', False):
                    risk_factors.extend(image_risk.get('issues', []))
            
            fraud_analysis['indicators'] = risk_factors
            fraud_analysis['risk_score'] = min(len(risk_factors) * 0.25, 1.0)
            
        except Exception as e:
            logger.error(f"Error in fraud detection: {str(e)}")
        
        return fraud_analysis
    
    def analyze_image_quality(self, filepath: str) -> Dict[str, Any]:
        """Analyze image quality for fraud detection"""
        analysis = {
            'suspicious': False,
            'issues': [],
            'quality_score': 0.0
        }
        
        try:
            img = cv2.imread(filepath)
            if img is None:
                return analysis
            
            # Check image sharpness
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            if laplacian_var < 100:
                analysis['issues'].append('Low image sharpness')
                analysis['suspicious'] = True
            
            # Check for extreme compression artifacts
            _, encoded = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 10])
            decoded = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
            
            # Basic quality score
            analysis['quality_score'] = min(laplacian_var / 500.0, 1.0)
            
        except Exception as e:
            logger.error(f"Error analyzing image quality: {str(e)}")
        
        return analysis
    
    def assess_document_quality(self, filepath: str, text: str) -> Dict[str, Any]:
        """Assess overall document quality"""
        quality = {
            'text_clarity': 0.0,
            'completeness': 0.0,
            'authenticity_score': 0.0,
            'overall_score': 0.0
        }
        
        try:
            # Text clarity (based on extracted text quality)
            if text:
                alpha_ratio = sum(c.isalpha() for c in text) / len(text)
                quality['text_clarity'] = alpha_ratio
            
            # Completeness (basic heuristic)
            expected_elements = ['name', 'number', 'date']
            found_elements = sum(1 for elem in expected_elements if elem in text.lower())
            quality['completeness'] = found_elements / len(expected_elements)
            
            # Authenticity score (inverse of fraud risk)
            fraud_analysis = self.detect_fraud_indicators(text, filepath)
            quality['authenticity_score'] = 1.0 - fraud_analysis['risk_score']
            
            # Overall score
            quality['overall_score'] = (
                quality['text_clarity'] * 0.4 +
                quality['completeness'] * 0.3 +
                quality['authenticity_score'] * 0.3
            )
            
        except Exception as e:
            logger.error(f"Error assessing document quality: {str(e)}")
        
        return quality
    
    def detect_language(self, text: str) -> Dict[str, Any]:
        """Detect language of the document"""
        try:
            # Try to import langdetect with fallback
            try:
                from langdetect import detect, detect_langs
                
                if not text.strip():
                    return {'primary_language': 'unknown', 'confidence': 0.0}
                
                # Detect primary language
                primary_lang = detect(text)
                
                # Get confidence scores for multiple languages
                lang_probs = detect_langs(text)
                
                return {
                    'primary_language': primary_lang,
                    'confidence': lang_probs[0].prob if lang_probs else 0.0,
                    'detected_languages': [
                        {'language': lang.lang, 'probability': lang.prob}
                        for lang in lang_probs[:3]
                    ]
                }
            except ImportError:
                # Fallback - simple heuristic detection
                if not text.strip():
                    return {'primary_language': 'unknown', 'confidence': 0.0}
                
                # Simple check for Hindi vs English
                hindi_chars = sum(1 for c in text if '\u0900' <= c <= '\u097f')
                english_chars = sum(1 for c in text if c.isascii() and c.isalpha())
                
                if hindi_chars > english_chars:
                    return {'primary_language': 'hi', 'confidence': 0.7}
                elif english_chars > 0:
                    return {'primary_language': 'en', 'confidence': 0.7}
                else:
                    return {'primary_language': 'unknown', 'confidence': 0.0}
            
        except Exception as e:
            logger.error(f"Error detecting language: {str(e)}")
            return {'primary_language': 'unknown', 'confidence': 0.0}
    
    def analyze_security_features(self, text: str) -> Dict[str, Any]:
        """Analyze security features mentioned in the document"""
        security_features = {
            'watermarks': False,
            'holograms': False,
            'security_threads': False,
            'microprint': False,
            'other_features': []
        }
        
        try:
            text_lower = text.lower()
            
            # Check for security feature keywords
            security_keywords = {
                'watermark': 'watermarks',
                'hologram': 'holograms',
                'security thread': 'security_threads',
                'microprint': 'microprint'
            }
            
            for keyword, feature in security_keywords.items():
                if keyword in text_lower:
                    security_features[feature] = True
            
            # Look for other security-related terms
            other_terms = re.findall(
                r'\b(?:secure|protected|authenticated|verified|certified)\b',
                text_lower
            )
            security_features['other_features'] = list(set(other_terms))
            
        except Exception as e:
            logger.error(f"Error analyzing security features: {str(e)}")
        
        return security_features
    
    def calculate_text_confidence(self, text: str) -> float:
        """Calculate confidence in text extraction"""
        if not text:
            return 0.0
        
        # Simple heuristic based on text characteristics
        alpha_ratio = sum(c.isalpha() for c in text) / len(text)
        digit_ratio = sum(c.isdigit() for c in text) / len(text)
        space_ratio = sum(c.isspace() for c in text) / len(text)
        
        # Good text should have reasonable ratios of these characters
        confidence = (alpha_ratio * 0.6 + digit_ratio * 0.2 + space_ratio * 0.2)
        return min(confidence * 1.5, 1.0)
    
    def calculate_overall_confidence(self, analysis: Dict[str, Any]) -> float:
        """Calculate overall confidence score for the analysis"""
        try:
            scores = []
            
            # Text extraction confidence
            if 'text_extraction' in analysis:
                scores.append(analysis['text_extraction'].get('confidence', 0))
            
            # Classification confidence
            if 'document_classification' in analysis:
                scores.append(analysis['document_classification'].get('confidence', 0))
            
            # Quality score
            if 'quality_assessment' in analysis:
                scores.append(analysis['quality_assessment'].get('overall_score', 0))
            
            # Language detection confidence
            if 'language_detection' in analysis:
                scores.append(analysis['language_detection'].get('confidence', 0))
            
            return sum(scores) / len(scores) if scores else 0.0
            
        except Exception as e:
            logger.error(f"Error calculating overall confidence: {str(e)}")
            return 0.0
    
    def get_status(self) -> Dict[str, Any]:
        """Get status of the document processor"""
        return {
            'models_loaded': self.models_loaded,
            'available_languages': ['en', 'hi'],
            'supported_formats': ['pdf', 'jpg', 'jpeg', 'png', 'bmp', 'tiff'],
            'ocr_engines': ['easyocr', 'tesseract'],
            'features': [
                'text_extraction',
                'document_classification',
                'data_extraction',
                'fraud_detection',
                'quality_assessment',
                'language_detection',
                'security_analysis'
            ]
        }
