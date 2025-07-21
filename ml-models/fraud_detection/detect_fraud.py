def detect_fraud(data):
    try:
        return any("suspicious" in str(v).lower() for v in data.values())
    except Exception:
        return False

if __name__ == "__main__":
    test_data = {
        "doc_title": "Fake Passport",
        "content": "Suspicious transaction noticed"
    }
    print("Fraud Detected" if detect_fraud(test_data) else "No Fraud Detected")
