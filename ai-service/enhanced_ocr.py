"""
Enhanced OCR Service for BharatChain
Provides real OCR functionality using multiple engines
"""

import os
import cv2
import numpy as np
import pytesseract
import easyocr
from PIL import Image
import logging
import fitz  # PyMuPDF
from typing import Dict, List, Any, Optional
import tempfile
from datetime import datetime

logger = logging.getLogger(__name__)

class EnhancedOCRService:
    """Enhanced OCR service with multiple engines and preprocessing"""
    
    def __init__(self):
        """Initialize OCR service with multiple engines"""
        self.easyocr_reader = None
        self.tesseract_available = False
        self.initialize_engines()
    
    def initialize_engines(self):
        """Initialize all available OCR engines"""
        try:
            # Initialize EasyOCR with English and Hindi support
            logger.info("Initializing EasyOCR...")
            self.easyocr_reader = easyocr.Reader(['en', 'hi'], gpu=False)
            logger.info("✅ EasyOCR initialized successfully")
        except Exception as e:
            logger.error(f"❌ EasyOCR initialization failed: {e}")
            self.easyocr_reader = None
        
        # Test Tesseract availability
        try:
            pytesseract.get_tesseract_version()
            self.tesseract_available = True
            logger.info("✅ Tesseract OCR available")
        except Exception as e:
            logger.warning(f"⚠️ Tesseract OCR not available: {e}")
            self.tesseract_available = False
    
    def preprocess_image(self, image_path: str) -> str:
        """Preprocess image for better OCR results"""
        try:
            # Read image
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError("Could not read image")
            
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Apply noise reduction
            denoised = cv2.fastNlMeansDenoising(gray)
            
            # Apply adaptive thresholding
            thresh = cv2.adaptiveThreshold(
                denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                cv2.THRESH_BINARY, 11, 2
            )
            
            # Morphological operations to clean up
            kernel = np.ones((1, 1), np.uint8)
            processed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
            processed = cv2.morphologyEx(processed, cv2.MORPH_OPEN, kernel)
            
            # Save processed image
            processed_path = f"{image_path}_processed.png"
            cv2.imwrite(processed_path, processed)
            
            return processed_path
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            return image_path  # Return original if preprocessing fails
    
    def extract_with_easyocr(self, image_path: str) -> Dict[str, Any]:
        """Extract text using EasyOCR"""
        if not self.easyocr_reader:
            return {"text": "", "confidence": 0.0, "details": [], "error": "EasyOCR not available"}
        
        try:
            results = self.easyocr_reader.readtext(image_path, detail=1, paragraph=True)
            
            # Extract text and calculate average confidence
            text_parts = []
            confidences = []
            details = []
            
            for bbox, text, confidence in results:
                if text.strip() and confidence > 0.3:  # Filter low confidence results
                    text_parts.append(text)
                    confidences.append(confidence)
                    details.append({
                        "text": text,
                        "confidence": confidence,
                        "bbox": bbox
                    })
            
            extracted_text = " ".join(text_parts)
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
            
            return {
                "text": extracted_text,
                "confidence": avg_confidence,
                "details": details,
                "engine": "easyocr"
            }
            
        except Exception as e:
            logger.error(f"EasyOCR extraction failed: {e}")
            return {"text": "", "confidence": 0.0, "details": [], "error": str(e)}
    
    def extract_with_tesseract(self, image_path: str) -> Dict[str, Any]:
        """Extract text using Tesseract OCR"""
        if not self.tesseract_available:
            return {"text": "", "confidence": 0.0, "details": [], "error": "Tesseract not available"}
        
        try:
            # Open image with PIL
            image = Image.open(image_path)
            
            # Extract text with confidence data
            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
            
            # Filter and combine results
            text_parts = []
            confidences = []
            details = []
            
            for i in range(len(data['text'])):
                text = data['text'][i].strip()
                conf = int(data['conf'][i])
                
                if text and conf > 30:  # Filter low confidence results
                    text_parts.append(text)
                    confidences.append(conf / 100.0)  # Convert to 0-1 scale
                    details.append({
                        "text": text,
                        "confidence": conf / 100.0,
                        "bbox": [data['left'][i], data['top'][i], 
                               data['left'][i] + data['width'][i], 
                               data['top'][i] + data['height'][i]]
                    })
            
            extracted_text = " ".join(text_parts)
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
            
            return {
                "text": extracted_text,
                "confidence": avg_confidence,
                "details": details,
                "engine": "tesseract"
            }
            
        except Exception as e:
            logger.error(f"Tesseract extraction failed: {e}")
            return {"text": "", "confidence": 0.0, "details": [], "error": str(e)}
    
    def extract_from_pdf(self, pdf_path: str) -> Dict[str, Any]:
        """Extract text from PDF using both direct text extraction and OCR"""
        try:
            doc = fitz.open(pdf_path)
            results = {
                "pages": [],
                "total_text": "",
                "total_confidence": 0.0,
                "extraction_method": "hybrid"
            }
            
            for page_num in range(doc.page_count):
                page = doc[page_num]
                page_result = {
                    "page_number": page_num + 1,
                    "direct_text": "",
                    "ocr_text": "",
                    "final_text": "",
                    "confidence": 0.0
                }
                
                # Try direct text extraction first
                direct_text = page.get_text().strip()
                page_result["direct_text"] = direct_text
                
                # If direct extraction yields little text, use OCR
                if len(direct_text) < 50:
                    # Convert page to image
                    mat = fitz.Matrix(2, 2)  # Zoom factor for better OCR
                    pix = page.get_pixmap(matrix=mat)
                    
                    # Save as temporary image
                    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp_file:
                        pix.save(tmp_file.name)
                        temp_image_path = tmp_file.name
                    
                    try:
                        # Preprocess and extract with OCR
                        processed_path = self.preprocess_image(temp_image_path)
                        ocr_result = self.extract_with_multiple_engines(processed_path)
                        
                        page_result["ocr_text"] = ocr_result["text"]
                        page_result["final_text"] = ocr_result["text"] if len(ocr_result["text"]) > len(direct_text) else direct_text
                        page_result["confidence"] = ocr_result.get("confidence", 0.5)
                        
                        # Clean up temporary files
                        os.unlink(temp_image_path)
                        if processed_path != temp_image_path:
                            os.unlink(processed_path)
                            
                    except Exception as e:
                        logger.error(f"OCR failed for page {page_num + 1}: {e}")
                        page_result["final_text"] = direct_text
                        page_result["confidence"] = 0.8 if direct_text else 0.0
                else:
                    page_result["final_text"] = direct_text
                    page_result["confidence"] = 0.9  # High confidence for direct extraction
                
                results["pages"].append(page_result)
                results["total_text"] += page_result["final_text"] + "\n"
            
            doc.close()
            
            # Calculate overall confidence
            confidences = [p["confidence"] for p in results["pages"] if p["confidence"] > 0]
            results["total_confidence"] = sum(confidences) / len(confidences) if confidences else 0.0
            results["total_text"] = results["total_text"].strip()
            
            return results
            
        except Exception as e:
            logger.error(f"PDF extraction failed: {e}")
            return {
                "pages": [],
                "total_text": "",
                "total_confidence": 0.0,
                "extraction_method": "failed",
                "error": str(e)
            }
    
    def extract_with_multiple_engines(self, image_path: str) -> Dict[str, Any]:
        """Extract text using multiple OCR engines and combine results"""
        results = {}
        
        # Try EasyOCR
        easyocr_result = self.extract_with_easyocr(image_path)
        results["easyocr"] = easyocr_result
        
        # Try Tesseract
        tesseract_result = self.extract_with_tesseract(image_path)
        results["tesseract"] = tesseract_result
        
        # Choose the best result
        best_result = self.choose_best_result([easyocr_result, tesseract_result])
        
        return {
            "text": best_result["text"],
            "confidence": best_result["confidence"],
            "best_engine": best_result["engine"],
            "all_results": results,
            "combined_approach": True
        }
    
    def choose_best_result(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Choose the best OCR result based on confidence and text length"""
        valid_results = [r for r in results if r.get("text") and not r.get("error")]
        
        if not valid_results:
            return {"text": "", "confidence": 0.0, "engine": "none"}
        
        # Score results based on confidence and text length
        best_result = None
        best_score = 0
        
        for result in valid_results:
            text_length_score = min(len(result["text"]) / 100.0, 1.0)
            confidence_score = result.get("confidence", 0.0)
            
            # Weighted score: 70% confidence, 30% text length
            score = confidence_score * 0.7 + text_length_score * 0.3
            
            if score > best_score:
                best_score = score
                best_result = result
        
        return best_result or valid_results[0]
    
    def extract_text(self, file_path: str) -> Dict[str, Any]:
        """Main method to extract text from any supported file type"""
        try:
            file_ext = os.path.splitext(file_path)[1].lower()
            
            if file_ext == '.pdf':
                return self.extract_from_pdf(file_path)
            elif file_ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif']:
                # Preprocess image for better results
                processed_path = self.preprocess_image(file_path)
                result = self.extract_with_multiple_engines(processed_path)
                
                # Clean up processed image if different from original
                if processed_path != file_path:
                    try:
                        os.unlink(processed_path)
                    except:
                        pass
                
                return result
            else:
                return {
                    "text": "",
                    "confidence": 0.0,
                    "error": f"Unsupported file type: {file_ext}"
                }
                
        except Exception as e:
            logger.error(f"Text extraction failed: {e}")
            return {
                "text": "",
                "confidence": 0.0,
                "error": str(e)
            }
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get status of OCR service"""
        return {
            "easyocr_available": self.easyocr_reader is not None,
            "tesseract_available": self.tesseract_available,
            "supported_formats": [".pdf", ".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif"],
            "supported_languages": ["en", "hi"],
            "preprocessing_enabled": True,
            "multi_engine_support": True,
            "service_ready": self.easyocr_reader is not None or self.tesseract_available
        }

# Create global instance
ocr_service = EnhancedOCRService()

def get_ocr_service():
    """Get the global OCR service instance"""
    return ocr_service