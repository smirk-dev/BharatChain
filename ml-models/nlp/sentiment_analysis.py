# Sentiment Analysis with Hugging Face
from transformers import pipeline

classifier = pipeline("sentiment-analysis")

def analyze_feedback(text):
    return classifier(text)

if __name__ == "__main__":
    result = analyze_feedback("This service was very helpful and fast.")
    print(result)
