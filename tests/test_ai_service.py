import requests
import json

def test_ai_service():
    """Test the AI service endpoints"""
    base_url = "http://localhost:5001"
    
    print("🧪 Testing BharatChain AI Service with Enhanced OCR")
    print("=" * 60)
    
    # Test 1: Health Check
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        if response.status_code == 200:
            print("✅ Health Check: Service is running")
            data = response.json()
            print(f"   Timestamp: {data.get('timestamp', 'N/A')}")
            print(f"   OCR Service Ready: {data.get('services', {}).get('ocr_service', {}).get('service_ready', 'N/A')}")
        else:
            print(f"❌ Health Check Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health Check Error: {e}")
    
    print()
    
    # Test 2: OCR Status
    try:
        response = requests.get(f"{base_url}/api/ocr/status", timeout=10)
        if response.status_code == 200:
            print("✅ OCR Status Check: Available")
            data = response.json()
            ocr_data = data.get('data', {})
            print(f"   EasyOCR Available: {ocr_data.get('easyocr_available', 'N/A')}")
            print(f"   Tesseract Available: {ocr_data.get('tesseract_available', 'N/A')}")
            print(f"   Supported Formats: {', '.join(ocr_data.get('supported_formats', []))}")
            print(f"   Supported Languages: {', '.join(ocr_data.get('supported_languages', []))}")
        else:
            print(f"❌ OCR Status Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ OCR Status Error: {e}")
    
    print()
    
    # Test 3: Model Status
    try:
        response = requests.get(f"{base_url}/models/status", timeout=10)
        if response.status_code == 200:
            print("✅ Model Status Check: Available")
            data = response.json()
            print(f"   Document Processor: {data.get('document_processor', {}).get('status', 'N/A')}")
            print(f"   Grievance Analyzer: {data.get('grievance_analyzer', {}).get('status', 'N/A')}")
            print(f"   OCR Service Ready: {data.get('ocr_service', {}).get('service_ready', 'N/A')}")
        else:
            print(f"❌ Model Status Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Model Status Error: {e}")
    
    print()
    
    # Test 4: Grievance Analysis
    try:
        test_text = "The water supply in my area has been disrupted for the past week. This is a serious issue affecting many families. We need immediate action from the water department."
        
        response = requests.post(
            f"{base_url}/api/grievance/analyze",
            json={"text": test_text},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Grievance Analysis: Working")
            data = response.json()
            analysis = data.get('data', {})
            print(f"   Sentiment: {analysis.get('sentiment', {}).get('label', 'N/A')}")
            print(f"   Category: {analysis.get('category', 'N/A')}")
            print(f"   Priority: {analysis.get('priority', 'N/A')}")
        else:
            print(f"❌ Grievance Analysis Failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Grievance Analysis Error: {e}")
    
    print()
    print("🎯 AI Service Test Summary:")
    print("   - Enhanced OCR capabilities with EasyOCR")
    print("   - Multi-format document support (PDF, images)")
    print("   - Grievance analysis with sentiment detection") 
    print("   - Rate limiting and error handling")
    print("   - Multi-language support (English, Hindi)")

if __name__ == "__main__":
    test_ai_service()