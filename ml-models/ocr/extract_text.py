# OCR Extraction Script using pytesseract
from PIL import Image
import pytesseract
def extract_text(image_path):
    return pytesseract.image_to_string(Image.open(image_path))

if __name__ == "__main__":
    text = extract_text("sample_doc.png")
    print(text)
