"""
Simple OCR Service for BharatChain - Lightweight version
Focuses on fast startup and basic OCR functionality
"""

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from datetime import datetime
from functools import wraps
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Simple rate limiting
def rate_limit(max_requests=10, per_seconds=60):
    """Simple rate limiting decorator"""
    def decorator(func):
        func.requests = {}
        
        @wraps(func)
        def wrapper(*args, **kwargs):
            client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
            now = time.time()
            
            # Clean old requests
            func.requests = {ip: times for ip, times in func.requests.items() 
                           if any(now - t < per_seconds for t in times)}
            
            # Check current IP
            if client_ip in func.requests:
                recent_requests = [t for t in func.requests[client_ip] if now - t < per_seconds]
                if len(recent_requests) >= max_requests:
                    return jsonify({"error": "Rate limit exceeded"}), 429
                func.requests[client_ip] = recent_requests + [now]
            else:
                func.requests[client_ip] = [now]
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "BharatChain Simple AI Service",
        "features": ["document_analysis", "grievance_analysis", "basic_ocr"]
    })

@app.route('/api/ocr/status', methods=['GET'])
def get_ocr_status():
    """Get OCR service status"""
    return jsonify({
        "success": True,
        "data": {
            "service_ready": True,
            "engine": "basic",
            "supported_formats": [".txt", ".pdf"],
            "features": ["text_extraction", "basic_analysis"]
        },
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/ocr/extract', methods=['POST'])
@rate_limit(max_requests=20, per_seconds=300)
def extract_text():
    """Simple text extraction - placeholder for real OCR"""
    try:
        if 'file' not in request.files:
            return jsonify({
                "success": False,
                "error": "No file uploaded"
            }), 400
        
        file = request.files['file']
        if file.filename == '' or file.filename is None:
            return jsonify({
                "success": False,
                "error": "No file selected"
            }), 400
        
        # Simulate OCR processing
        extracted_text = f"[OCR SIMULATION] Text extracted from {file.filename}. This is a placeholder showing the OCR system is working. In production, this would contain the actual text from the uploaded document."
        
        return jsonify({
            "success": True,
            "data": {
                "text": extracted_text,
                "confidence": 0.85,
                "engine": "simulation",
                "processing_time": 0.5,
                "file_name": file.filename,
                "extracted_at": datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"OCR extraction error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/grievance/analyze', methods=['POST'])
@rate_limit()
def analyze_grievance():
    """Analyze grievance text with basic sentiment analysis"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({
                "success": False,
                "error": "No text provided"
            }), 400
        
        text = data['text']
        if len(text.strip()) < 10:
            return jsonify({
                "success": False,
                "error": "Text too short for analysis"
            }), 400
        
        # Basic sentiment analysis
        text_lower = text.lower()
        negative_keywords = ['bad', 'terrible', 'awful', 'angry', 'frustrated', 'complaint', 'problem', 'issue']
        positive_keywords = ['good', 'great', 'excellent', 'satisfied', 'happy', 'resolved']
        urgent_keywords = ['urgent', 'emergency', 'immediately', 'asap', 'critical']
        
        negative_score = sum(1 for word in negative_keywords if word in text_lower)
        positive_score = sum(1 for word in positive_keywords if word in text_lower)
        urgent_score = sum(1 for word in urgent_keywords if word in text_lower)
        
        if negative_score > positive_score:
            sentiment = 'negative'
        elif positive_score > negative_score:
            sentiment = 'positive'
        else:
            sentiment = 'neutral'
        
        # Category detection
        category_keywords = {
            'infrastructure': ['water', 'road', 'electricity', 'transport'],
            'healthcare': ['hospital', 'doctor', 'medical', 'health'],
            'education': ['school', 'teacher', 'education', 'student'],
            'corruption': ['bribe', 'corruption', 'illegal', 'fraud']
        }
        
        detected_category = 'general'
        for category, keywords in category_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                detected_category = category
                break
        
        priority = 'high' if urgent_score > 0 else 'medium' if negative_score > 1 else 'low'
        
        return jsonify({
            "success": True,
            "data": {
                "sentiment": {
                    "label": sentiment,
                    "confidence": 0.8,
                    "scores": {
                        "positive": positive_score,
                        "negative": negative_score,
                        "neutral": max(0, len(text.split()) - positive_score - negative_score)
                    }
                },
                "category": detected_category,
                "priority": priority,
                "urgency_indicators": urgent_score > 0,
                "word_count": len(text.split()),
                "analysis_timestamp": datetime.now().isoformat()
            },
            "analyzed_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Grievance analysis error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/models/status', methods=['GET'])
def models_status():
    """Check status of services"""
    return jsonify({
        'document_processor': {'status': 'ready', 'type': 'basic'},
        'grievance_analyzer': {'status': 'ready', 'type': 'keyword-based'},
        'ocr_service': {'status': 'ready', 'type': 'simulation'},
        'timestamp': datetime.now().isoformat()
    })

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        "success": False,
        "error": "Endpoint not found",
        "available_endpoints": [
            "/health",
            "/api/ocr/status", 
            "/api/ocr/extract",
            "/api/grievance/analyze",
            "/models/status"
        ]
    }), 404

if __name__ == '__main__':
    logger.info("🚀 Starting BharatChain Simple AI Service")
    logger.info("📄 Features: Basic OCR simulation, Grievance analysis")
    logger.info("⚡ Fast startup, lightweight processing")
    
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=False,
        threaded=True
    )