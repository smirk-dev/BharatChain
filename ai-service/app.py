from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import logging
from datetime import datetime
import traceback

# Import our AI processing modules
from document_processor import DocumentProcessor
from grievance_analyzer import GrievanceAnalyzer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize AI processors
document_processor = DocumentProcessor()
grievance_analyzer = GrievanceAnalyzer()

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
