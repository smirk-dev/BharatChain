# Placeholder for fraud detection model
def detect_fraud(data):
    # This would be replaced by a real ML model
    suspicious = any("suspicious" in field.lower() for field in data.values())
    return suspicious

if __name__ == "__main__":
    sample = {"doc_title": "Fake Passport", "content": "Suspicious activity"}
    print("Fraud Detected:" if detect_fraud(sample) else "Document Clean")
