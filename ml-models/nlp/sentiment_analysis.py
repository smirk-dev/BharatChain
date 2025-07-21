from transformers import pipeline
import sys

classifier = pipeline("sentiment-analysis")

def analyze_feedback(text):
    try:
        return classifier(text)
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    text = " ".join(sys.argv[1:]) or "This service was very helpful."
    print(analyze_feedback(text))
