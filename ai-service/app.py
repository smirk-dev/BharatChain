from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import logging
from datetime import datetime
import traceback
import warnings
from functools import wraps
import time
from werkzeug.utils import secure_filename

# Suppress specific warnings
warnings.filterwarnings('ignore', category=UserWarning)
warnings.filterwarnings('ignore', message='.*CUDA.*')
warnings.filterwarnings('ignore', message='.*MPS.*')

# Import our AI processing modules
from document_processor import DocumentProcessor
from enhanced_ocr import get_ocr_service

# Create a proper lightweight grievance analyzer
class LightweightGrievanceAnalyzer:
    def __init__(self):
        self.models_loaded = True
        
    def analyze_grievance(self, text):
        """Analyze grievance with proper categorization and sentiment"""
        # Basic sentiment analysis
        sentiment_keywords = {
            'positive': ['good', 'excellent', 'satisfied', 'happy', 'resolved', 'helpful'],
            'negative': ['bad', 'terrible', 'unsatisfied', 'angry', 'frustrated', 'awful', 'horrible'],
            'urgent': ['urgent', 'emergency', 'immediate', 'asap', 'critical', 'serious']
        }
        
        text_lower = text.lower()
        words = text_lower.split()
        
        # Calculate sentiment scores
        positive_score = sum(1 for word in words if word in sentiment_keywords['positive'])
        negative_score = sum(1 for word in words if word in sentiment_keywords['negative'])
        urgent_score = sum(1 for word in words if word in sentiment_keywords['urgent'])
        
        # Determine overall sentiment
        if negative_score > positive_score:
            sentiment = 'negative'
            confidence = min(0.9, negative_score / max(len(words) * 0.1, 1))
        elif positive_score > negative_score:
            sentiment = 'positive'
            confidence = min(0.9, positive_score / max(len(words) * 0.1, 1))
        else:
            sentiment = 'neutral'
            confidence = 0.5
            
        # Category detection
        category_keywords = {
            'public_services': ['water', 'electricity', 'road', 'transport', 'hospital', 'school'],
            'corruption': ['bribe', 'corrupt', 'illegal', 'fraud', 'scam'],
            'infrastructure': ['road', 'bridge', 'building', 'construction', 'repair'],
            'healthcare': ['hospital', 'doctor', 'medicine', 'treatment', 'health'],
            'education': ['school', 'teacher', 'education', 'student', 'college']
        }
        
        detected_categories = []
        for category, keywords in category_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                detected_categories.append(category)
        
        # Priority calculation
        priority_score = urgent_score * 0.4 + negative_score * 0.3 + len(detected_categories) * 0.3
        
        if priority_score > 2:
            priority = 'high'
        elif priority_score > 1:
            priority = 'medium'
        else:
            priority = 'low'
        
        return {
            'sentiment': {
                'label': sentiment,
                'confidence': confidence,
                'scores': {
                    'positive': positive_score,
                    'negative': negative_score,
                    'neutral': max(0, len(words) - positive_score - negative_score)
                }
            },
            'category': detected_categories[0] if detected_categories else 'general',
            'all_categories': detected_categories,
            'priority': priority,
            'urgency_indicators': urgent_score > 0,
            'word_count': len(words),
            'analysis_timestamp': datetime.now().isoformat()
        }

# Configuration
UPLOAD_FOLDER = 'uploads'
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx'}

# Initialize services
document_processor = DocumentProcessor()
grievance_analyzer = LightweightGrievanceAnalyzer()
ocr_service = get_ocr_service()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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
    ocr_status = ocr_service.get_service_status()
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "document_processor": "available",
            "grievance_analyzer": "available", 
            "ocr_service": ocr_status
        }
    })

@app.route('/api/ocr/status', methods=['GET'])
def get_ocr_status():
    """Get OCR service status"""
    try:
        status = ocr_service.get_service_status()
        return jsonify({
            "success": True,
            "data": status,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting OCR status: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/ocr/extract', methods=['POST'])
@rate_limit(max_requests=20, per_seconds=300)
def extract_text():
    """Extract text from uploaded file using OCR"""
    try:
        if 'file' not in request.files:
            return jsonify({
                "success": False,
                "error": "No file uploaded"
            }), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({
                "success": False,
                "error": "No file selected"
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                "success": False,
                "error": f"File type not supported"
            }), 400
        
        # Save file securely
        filename = secure_filename(file.filename)
        timestamp = str(int(time.time()))
        filename = f"{timestamp}_{filename}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Extract text using OCR service
        logger.info(f"Extracting text from: {filename}")
        start_time = time.time()
        
        ocr_result = ocr_service.extract_text(filepath)
        processing_time = time.time() - start_time
        
        # Clean up uploaded file
        try:
            os.unlink(filepath)
        except:
            pass
        
        return jsonify({
            "success": True,
            "data": {
                "text": ocr_result.get("text", ""),
                "confidence": ocr_result.get("confidence", 0.0),
                "engine": ocr_result.get("best_engine", "unknown"),
                "processing_time": round(processing_time, 2),
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
