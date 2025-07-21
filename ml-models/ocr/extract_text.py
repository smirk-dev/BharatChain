from PIL import Image
import pytesseract
import sys

def extract_text(image_path):
    try:
        return pytesseract.image_to_string(Image.open(image_path))
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_text.py <image_path>")
    else:
        print(extract_text(sys.argv[1]))
