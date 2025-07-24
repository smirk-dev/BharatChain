const DocumentProcessor = require('../../ml-models/documentProcessor');
const fs = require('fs');
const path = require('path');

describe('DocumentProcessor', () => {
  let processor;

  beforeAll(() => {
    processor = new DocumentProcessor();
  });

  describe('Text Extraction', () => {
    it('should extract text from image', async () => {
      // Mock image data
      const mockImageData = Buffer.from('mock image data');
      
      // Note: In real tests, you'd use actual test images
      const result = processor.extract_text_ocr(mockImageData);
      
      expect(result).toHaveProperty('extracted_text');
      expect(result).toHaveProperty('confidence');
      expect(typeof result.confidence).toBe('number');
    });
  });

  describe('Document Classification', () => {
    it('should classify Aadhar card correctly', () => {
      const aadharText = `
        Government of India
        Date of Birth: 01/01/1990
        Name: John Doe
        1234 5678 9012
        UIDAI
      `;

      const result = processor.classify_document_type(aadharText, 'aadhar');
      
      expect(result).toHaveProperty('predicted_type');
      expect(result).toHaveProperty('confidence');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should classify PAN card correctly', () => {
      const panText = `
        Income Tax Department
        Permanent Account Number
        ABCDE1234F
        Name: John Doe
        Father's Name: Jane Doe
        Date of Birth: 01/01/1990
      `;

      const result = processor.classify_document_type(panText, 'pan');
      
      expect(result.predicted_type).toBe('pan');
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Structured Data Extraction', () => {
    it('should extract structured data from Aadhar text', () => {
      const aadharText = `
        Name: John Doe
        Date of Birth: 01/01/1990
        Gender: Male
        Address: 123 Main Street, New Delhi
        1234 5678 9012
      `;

      const result = processor.extract_structured_data(aadharText, 'aadhar');
      
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('dob');
      expect(result).toHaveProperty('gender');
      expect(result).toHaveProperty('address');
      expect(result).toHaveProperty('aadhar_number');
    });
  });

  describe('Fraud Detection', () => {
    it('should detect potential fraud indicators', async () => {
      const mockImageData = Buffer.from('mock image data');
      const mockTextData = 'suspicious text with inconsistencies';

      const result = processor.detect_fraud(mockImageData, mockTextData, 'aadhar');
      
      expect(result).toHaveProperty('risk_score');
      expect(result).toHaveProperty('fraud_indicators');
      expect(result).toHaveProperty('is_potentially_fraudulent');
      expect(Array.isArray(result.fraud_indicators)).toBe(true);
    });
  });

  describe('Complete Document Processing', () => {
    it('should process document comprehensively', async () => {
      const mockImageData = Buffer.from('mock image data');

      const result = processor.process_document(mockImageData, 'aadhar');
      
      expect(result).toHaveProperty('ocr_result');
      expect(result).toHaveProperty('classification');
      expect(result).toHaveProperty('structured_data');
      expect(result).toHaveProperty('fraud_detection');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('processing_status');
    });
  });
});
