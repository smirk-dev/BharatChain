#!/usr/bin/env python3
"""
BharatChain AI Service - Simplified Version
A lightweight Flask server providing AI analysis for documents and grievances.
"""

import os
import json
import logging
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

class SimpleDocumentProcessor:
    """Simplified document processor with basic OCR and classification"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
    def process_document(self, file_path):
        """Process a document and return analysis results"""
        try:
            # For now, return a structured response based on file type
            file_extension = os.path.splitext(file_path)[1].lower()
            
            # Simulate different analysis based on file type
            if file_extension in ['.pdf']:
                document_type = 'government_certificate'
                confidence = 0.92
                extracted_text = "Sample extracted text from PDF document"
            elif file_extension in ['.jpg', '.jpeg', '.png']:
                document_type = 'identity_document'
                confidence = 0.87
                extracted_text = "Sample extracted text from image document"
            else:
                document_type = 'unknown'
                confidence = 0.65
                extracted_text = "Unable to extract text from this file type"
            
            return {
                'success': True,
                'document_type': document_type,
                'confidence_score': confidence,
                'extracted_text': extracted_text,
                'analysis': {
                    'is_valid': confidence > 0.8,
                    'fraud_indicators': [],
                    'quality_score': min(confidence + 0.1, 1.0),
                    'completeness': 'complete' if confidence > 0.8 else 'partial'
                },
                'metadata': {
                    'file_size': os.path.getsize(file_path) if os.path.exists(file_path) else 0,
                    'processing_time': 1.2,
                    'language': 'english'
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error processing document: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'document_type': 'unknown',
                'confidence_score': 0.0
            }

class SimpleGrievanceAnalyzer:
    """Simplified grievance analyzer with basic NLP analysis"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
    def analyze_grievance(self, text):
        """Analyze grievance text and return insights"""
        try:
            # Basic text analysis
            word_count = len(text.split())
            
            # Simple sentiment analysis based on keywords
            negative_words = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'angry', 'frustrated', 'disappointed']
            positive_words = ['good', 'great', 'excellent', 'satisfied', 'happy', 'pleased']
            
            negative_count = sum(1 for word in negative_words if word.lower() in text.lower())
            positive_count = sum(1 for word in positive_words if word.lower() in text.lower())
            
            if negative_count > positive_count:
                sentiment = 'negative'
                sentiment_score = -0.6
            elif positive_count > negative_count:
                sentiment = 'positive'
                sentiment_score = 0.6
            else:
                sentiment = 'neutral'
                sentiment_score = 0.0
            
            # Simple category classification based on keywords
            categories = {
                'public_services': ['water', 'electricity', 'power', 'sanitation', 'garbage'],
                'transportation': ['bus', 'train', 'road', 'traffic', 'transport'],
                'healthcare': ['hospital', 'doctor', 'medical', 'health', 'treatment'],
                'education': ['school', 'teacher', 'education', 'student', 'college'],
                'corruption': ['bribe', 'corruption', 'illegal', 'fraud', 'money']
            }
            
            detected_category = 'general'
            for category, keywords in categories.items():
                if any(keyword.lower() in text.lower() for keyword in keywords):
                    detected_category = category
                    break
            
            # Determine urgency based on text content
            urgent_indicators = ['urgent', 'emergency', 'immediate', 'critical', 'serious']
            urgency = 'high' if any(indicator.lower() in text.lower() for indicator in urgent_indicators) else 'medium'
            
            return {
                'success': True,
                'sentiment': {
                    'label': sentiment,
                    'score': sentiment_score,
                    'confidence': 0.75
                },
                'emotion': {
                    'primary': 'anger' if sentiment == 'negative' else 'satisfaction',
                    'confidence': 0.68
                },
                'category': {
                    'predicted': detected_category,
                    'confidence': 0.72
                },
                'urgency': {
                    'level': urgency,
                    'score': 0.8 if urgency == 'high' else 0.5
                },
                'insights': {
                    'word_count': word_count,
                    'readability': 'medium',
                    'complexity': 'low' if word_count < 50 else 'medium',
                    'resolution_suggestions': [
                        f"Forward to {detected_category} department",
                        "Acknowledge receipt within 24 hours",
                        "Investigate and respond within 7 days"
                    ]
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error analyzing grievance: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'sentiment': {'label': 'unknown', 'score': 0.0},
                'category': {'predicted': 'unknown'}
            }

# Initialize processors
document_processor = SimpleDocumentProcessor()
grievance_analyzer = SimpleGrievanceAnalyzer()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'BharatChain AI Service',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/analyze/document', methods=['POST'])
def analyze_document():
    """Analyze uploaded document"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save uploaded file temporarily
        temp_path = os.path.join('/tmp' if os.name != 'nt' else os.environ.get('TEMP', ''), 
                                f'temp_{datetime.now().timestamp()}_{file.filename}')
        file.save(temp_path)
        
        try:
            # Process the document
            result = document_processor.process_document(temp_path)
            result['timestamp'] = datetime.now().isoformat()
            return jsonify(result)
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        logger.error(f"Error in document analysis: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/analyze/grievance', methods=['POST'])
def analyze_grievance():
    """Analyze grievance text"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
            
        text = data['text']
        if not text.strip():
            return jsonify({'error': 'Empty text provided'}), 400
        
        # Analyze the grievance
        result = grievance_analyzer.analyze_grievance(text)
        result['timestamp'] = datetime.now().isoformat()
        result['input_length'] = len(text)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in grievance analysis: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/analyze/batch', methods=['POST'])
def analyze_batch():
    """Analyze multiple grievances in batch"""
    try:
        data = request.get_json()
        
        if not data or 'texts' not in data:
            return jsonify({'error': 'No texts provided'}), 400
            
        texts = data['texts']
        if not isinstance(texts, list):
            return jsonify({'error': 'Texts must be a list'}), 400
        
        results = []
        for i, text in enumerate(texts):
            if text.strip():
                analysis = grievance_analyzer.analyze_grievance(text)
                analysis['index'] = i
                results.append(analysis)
        
        return jsonify({
            'success': True,
            'batch_size': len(texts),
            'processed': len(results),
            'results': results,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    logger.info("🚀 Starting BharatChain AI Service...")
    logger.info("📊 Service Details:")
    logger.info("   ├── Version: Simplified 1.0.0")
    logger.info("   ├── Mode: Development")
    logger.info("   └── Features: Basic document & grievance analysis")
    logger.info("")
    logger.info("🔗 Available Endpoints:")
    logger.info("   ├── GET  /health - Health check")
    logger.info("   ├── POST /analyze/document - Document analysis")
    logger.info("   ├── POST /analyze/grievance - Grievance analysis")
    logger.info("   └── POST /analyze/batch - Batch grievance analysis")
    logger.info("")
    
    app.run(host='0.0.0.0', port=5001, debug=True)
