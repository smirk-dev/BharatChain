from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import logging
from datetime import datetime
import traceback
import warnings

# Suppress specific warnings
warnings.filterwarnings('ignore', category=UserWarning)
warnings.filterwarnings('ignore', message='.*CUDA.*')
warnings.filterwarnings('ignore', message='.*MPS.*')

# Import our AI processing modules
from document_processor import DocumentProcessor

# Create a proper lightweight grievance analyzer
class LightweightGrievanceAnalyzer:
    def __init__(self):
        self.models_loaded = True
        self.sentiment_keywords = {
            'positive': ['good', 'great', 'excellent', 'satisfied', 'happy', 'pleased', 'thank', 'wonderful', 'amazing'],
            'negative': ['bad', 'terrible', 'awful', 'angry', 'frustrated', 'disappointed', 'complaint', 'horrible', 'disgusted', 'furious'],
            'urgent': ['urgent', 'emergency', 'immediately', 'asap', 'critical', 'serious', 'quick']
        }
        self.category_keywords = {
            'corruption': ['bribe', 'corruption', 'illegal', 'fraud', 'dishonest'],
            'service_quality': ['service', 'quality', 'staff', 'behavior', 'treatment'],
            'infrastructure': ['road', 'water', 'electricity', 'sanitation', 'infrastructure'],
            'healthcare': ['hospital', 'doctor', 'medical', 'health', 'treatment'],
            'education': ['school', 'teacher', 'education', 'student', 'learning'],
            'administration': ['office', 'documentation', 'paperwork', 'process', 'delay']
        }
    
    def analyze_grievance(self, text):
        """Lightweight grievance analysis using keyword-based approach"""
        text_lower = text.lower()
        
        # Sentiment analysis
        sentiment = self._analyze_sentiment(text_lower)
        
        # Category detection
        category = self._detect_category(text_lower)
        
        # Urgency detection
        urgency = self._detect_urgency(text_lower)
        
        # Severity calculation
        severity = self._calculate_severity(sentiment, urgency, len(text))
        
        return {
            'sentiment': sentiment,
            'category': category,
            'urgency': urgency,
            'severity': severity,
            'summary': f"Lightweight analysis: {category['predicted_category']} grievance with {sentiment['primary_sentiment']} sentiment",
            'confidence': 0.7,
            'processing_method': 'keyword_based'
        }
    
    def _analyze_sentiment(self, text):
        positive_score = sum(1 for word in self.sentiment_keywords['positive'] if word in text)
        negative_score = sum(1 for word in self.sentiment_keywords['negative'] if word in text)
        
        if positive_score > negative_score:
            return {'primary_sentiment': 'positive', 'confidence': min(0.8, 0.5 + positive_score * 0.1)}
        elif negative_score > positive_score:
            return {'primary_sentiment': 'negative', 'confidence': min(0.8, 0.5 + negative_score * 0.1)}
        else:
            return {'primary_sentiment': 'neutral', 'confidence': 0.5}
    
    def _detect_category(self, text):
        scores = {}
        for category, keywords in self.category_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > 0:
                scores[category] = score
        
        if scores:
            best_category = max(scores.keys(), key=lambda x: scores[x])
            confidence = min(scores[best_category] * 0.2, 1.0)
        else:
            best_category = 'general'
            confidence = 0.3
        
        return {'predicted_category': best_category, 'confidence': confidence, 'all_scores': scores}
    
    def _detect_urgency(self, text):
        urgency_score = sum(1 for word in self.sentiment_keywords['urgent'] if word in text)
        
        if urgency_score >= 2:
            return {'level': 'high', 'score': 0.8}
        elif urgency_score == 1:
            return {'level': 'medium', 'score': 0.6}
        else:
            return {'level': 'low', 'score': 0.3}
    
    def _calculate_severity(self, sentiment, urgency, text_length):
        base_score = 0.5
        
        if sentiment['primary_sentiment'] == 'negative':
            base_score += 0.3
        if urgency['level'] == 'high':
            base_score += 0.2
        elif urgency['level'] == 'medium':
            base_score += 0.1
        
        # Longer text might indicate more detailed complaint
        if text_length > 500:
            base_score += 0.1
        
        severity_score = min(base_score, 1.0)
        
        if severity_score >= 0.7:
            return {'level': 'high', 'score': severity_score}
        elif severity_score >= 0.5:
            return {'level': 'medium', 'score': severity_score}
        else:
            return {'level': 'low', 'score': severity_score}
    
    def get_status(self):
        return {
            'models_loaded': True, 
            'features': ['sentiment_analysis', 'category_detection', 'urgency_assessment', 'severity_calculation'],
            'method': 'keyword_based_lightweight'
        }

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize AI processors
document_processor = DocumentProcessor()
grievance_analyzer = LightweightGrievanceAnalyzer()

# Create uploads directory
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'BharatChain AI Service',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/analyze/document', methods=['POST'])
def analyze_document():
    """Analyze uploaded document using AI"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save uploaded file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{file.filename}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        logger.info(f"Processing document: {filename}")
        
        # Process document with AI
        result = document_processor.analyze_document(filepath)
        
        # Clean up uploaded file
        os.remove(filepath)
        
        return jsonify({
            'success': True,
            'analysis': result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error analyzing document: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/analyze/grievance', methods=['POST'])
def analyze_grievance():
    """Analyze grievance text using AI"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        text = data['text']
        logger.info(f"Processing grievance text: {text[:100]}...")
        
        # Process grievance with AI
        result = grievance_analyzer.analyze_grievance(text)
        
        return jsonify({
            'success': True,
            'analysis': result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error analyzing grievance: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/models/status', methods=['GET'])
def models_status():
    """Check status of loaded AI models"""
    try:
        doc_status = document_processor.get_status()
        grievance_status = grievance_analyzer.get_status()
        
        return jsonify({
            'document_processor': doc_status,
            'grievance_analyzer': grievance_status,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error checking model status: {str(e)}")
        return jsonify({
            'error': str(e)
        }), 500

if __name__ == '__main__':
    logger.info("Starting BharatChain AI Service...")
    app.run(host='0.0.0.0', port=5001, debug=True)
