const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Tesseract = require('tesseract.js');
const natural = require('natural');
const sentiment = require('sentiment');
const sharp = require('sharp');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/documents/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, JPG, PNG, GIF, and PDF files are allowed.'));
    }
  }
});

// AI Document Processing Service
class AIDocumentProcessor {
  constructor() {
    this.sentiment = new sentiment();
    this.documentTemplates = {
      aadhar: {
        keywords: ['aadhar', 'aadhaar', 'uid', 'government of india'],
        patterns: {
          aadharNumber: /\d{4}\s\d{4}\s\d{4}/g,
          name: /Name[:\s]+([A-Z\s]+)/i,
          dob: /DOB[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
          gender: /Gender[:\s]+(Male|Female|Other)/i
        },
        securityFeatures: ['hologram', 'qr code', 'government seal']
      },
      pan: {
        keywords: ['permanent account number', 'income tax', 'pan'],
        patterns: {
          panNumber: /[A-Z]{5}\d{4}[A-Z]/g,
          name: /Name[:\s]+([A-Z\s]+)/i,
          fatherName: /Father[:\s]+([A-Z\s]+)/i,
          dob: /Date of Birth[:\s]+(\d{2}\/\d{2}\/\d{4})/i
        },
        securityFeatures: ['embossed text', 'lamination', 'official seal']
      },
      passport: {
        keywords: ['passport', 'republic of india', 'ministry of external affairs'],
        patterns: {
          passportNumber: /[A-Z]\d{7}/g,
          name: /Name[:\s]+([A-Z\s]+)/i,
          nationality: /Nationality[:\s]+([A-Z\s]+)/i,
          dob: /Date of Birth[:\s]+(\d{2}\/\d{2}\/\d{4})/i
        },
        securityFeatures: ['machine readable zone', 'biometric chip', 'watermark']
      }
    };
  }

  async processDocument(filePath, documentType = 'auto') {
    try {
      console.log(`Processing document: ${filePath}`);
      
      // Step 1: Image preprocessing
      const preprocessedImage = await this.preprocessImage(filePath);
      
      // Step 2: OCR text extraction
      const ocrResult = await this.extractText(preprocessedImage);
      
      // Step 3: Document type detection
      const detectedType = documentType === 'auto' ? 
        await this.detectDocumentType(ocrResult.text) : documentType;
      
      // Step 4: Structured data extraction
      const extractedData = await this.extractStructuredData(ocrResult.text, detectedType);
      
      // Step 5: Fraud detection
      const fraudAnalysis = await this.detectFraud(ocrResult, extractedData, detectedType);
      
      // Step 6: Quality assessment
      const qualityScore = await this.assessQuality(ocrResult, filePath);
      
      // Step 7: Generate insights
      const insights = await this.generateInsights(ocrResult, extractedData, fraudAnalysis);
      
      return {
        success: true,
        documentType: detectedType,
        ocrText: ocrResult.text,
        confidence: ocrResult.confidence,
        extractedData,
        fraudAnalysis,
        qualityScore,
        insights,
        processingTime: Date.now(),
        metadata: {
          fileSize: fs.statSync(filePath).size,
          processedAt: new Date().toISOString(),
          version: '1.0.0'
        }
      };
    } catch (error) {
      console.error('Document processing error:', error);
      return {
        success: false,
        error: error.message,
        processingTime: Date.now()
      };
    }
  }

  async preprocessImage(filePath) {
    try {
      const outputPath = filePath.replace(/\.[^/.]+$/, '_processed.jpg');
      
      await sharp(filePath)
        .grayscale()
        .normalize()
        .sharpen()
        .jpeg({ quality: 95 })
        .toFile(outputPath);
      
      return outputPath;
    } catch (error) {
      console.log('Image preprocessing failed, using original file');
      return filePath;
    }
  }

  async extractText(imagePath) {
    try {
      const { data: { text, confidence } } = await Tesseract.recognize(imagePath, 'eng+hin', {
        logger: m => console.log(m)
      });
      
      return {
        text: text.trim(),
        confidence: Math.round(confidence)
      };
    } catch (error) {
      throw new Error(`OCR failed: ${error.message}`);
    }
  }

  async detectDocumentType(text) {
    const lowercaseText = text.toLowerCase();
    
    for (const [type, template] of Object.entries(this.documentTemplates)) {
      const keywordMatches = template.keywords.filter(keyword => 
        lowercaseText.includes(keyword.toLowerCase())
      ).length;
      
      if (keywordMatches >= 2) {
        return type;
      }
    }
    
    return 'unknown';
  }

  async extractStructuredData(text, documentType) {
    const template = this.documentTemplates[documentType];
    if (!template) {
      return { type: 'unknown', rawText: text };
    }
    
    const extractedData = { type: documentType };
    
    for (const [field, pattern] of Object.entries(template.patterns)) {
      const match = text.match(pattern);
      if (match) {
        extractedData[field] = match[1] || match[0];
      }
    }
    
    return extractedData;
  }

  async detectFraud(ocrResult, extractedData, documentType) {
    let riskScore = 0;
    const flags = [];
    
    // OCR confidence check
    if (ocrResult.confidence < 70) {
      riskScore += 15;
      flags.push('Low OCR confidence - possible tampering or poor quality');
    }
    
    // Pattern validation
    const template = this.documentTemplates[documentType];
    if (template) {
      for (const [field, pattern] of Object.entries(template.patterns)) {
        if (extractedData[field]) {
          const isValid = pattern.test(extractedData[field]);
          if (!isValid) {
            riskScore += 10;
            flags.push(`Invalid ${field} format detected`);
          }
        }
      }
    }
    
    // Text coherence analysis
    const textQuality = this.analyzeTextCoherence(ocrResult.text);
    if (textQuality.score < 0.5) {
      riskScore += 20;
      flags.push('Text coherence issues detected');
    }
    
    // Duplicate detection (placeholder - would need database comparison)
    // if (await this.checkDuplicates(extractedData)) {
    //   riskScore += 30;
    //   flags.push('Potential duplicate document detected');
    // }
    
    return {
      riskScore: Math.min(riskScore, 100),
      riskLevel: riskScore < 30 ? 'low' : riskScore < 70 ? 'medium' : 'high',
      flags,
      recommendations: this.generateRecommendations(riskScore, flags)
    };
  }

  analyzeTextCoherence(text) {
    try {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      let coherenceScore = 0;
      
      for (const sentence of sentences) {
        const words = sentence.trim().split(/\s+/);
        const validWords = words.filter(word => /^[a-zA-Z]+$/.test(word));
        coherenceScore += validWords.length / words.length;
      }
      
      return {
        score: sentences.length > 0 ? coherenceScore / sentences.length : 0,
        sentences: sentences.length,
        totalWords: text.split(/\s+/).length
      };
    } catch (error) {
      return { score: 0.5, error: error.message };
    }
  }

  async assessQuality(ocrResult, filePath) {
    try {
      const stats = fs.statSync(filePath);
      const metadata = await sharp(filePath).metadata();
      
      let qualityScore = 100;
      
      // File size check
      if (stats.size < 50000) { // Less than 50KB
        qualityScore -= 20;
      }
      
      // Resolution check
      if (metadata.width < 800 || metadata.height < 600) {
        qualityScore -= 15;
      }
      
      // OCR confidence
      qualityScore = qualityScore * (ocrResult.confidence / 100);
      
      return Math.max(qualityScore, 0);
    } catch (error) {
      return 50; // Default quality score
    }
  }

  async generateInsights(ocrResult, extractedData, fraudAnalysis) {
    const insights = [];
    
    // OCR insights
    if (ocrResult.confidence > 90) {
      insights.push('High text extraction accuracy achieved');
    } else if (ocrResult.confidence > 70) {
      insights.push('Good text extraction with minor uncertainties');
    } else {
      insights.push('Text extraction quality could be improved');
    }
    
    // Data extraction insights
    const extractedFields = Object.keys(extractedData).length - 1; // Exclude 'type'
    if (extractedFields > 3) {
      insights.push('Comprehensive data extraction successful');
    } else if (extractedFields > 1) {
      insights.push('Partial data extraction completed');
    } else {
      insights.push('Limited data extraction - manual review recommended');
    }
    
    // Security insights
    if (fraudAnalysis.riskScore < 20) {
      insights.push('Document passes security validation checks');
    } else if (fraudAnalysis.riskScore < 50) {
      insights.push('Document shows minor security concerns');
    } else {
      insights.push('Document requires additional security verification');
    }
    
    // Processing insights
    insights.push('AI processing completed successfully');
    insights.push('Document ready for blockchain storage');
    
    return insights;
  }

  generateRecommendations(riskScore, flags) {
    const recommendations = [];
    
    if (riskScore < 30) {
      recommendations.push('Document can be auto-approved');
    } else if (riskScore < 70) {
      recommendations.push('Manual review recommended');
      recommendations.push('Additional verification may be required');
    } else {
      recommendations.push('High-risk document - thorough manual review required');
      recommendations.push('Consider requesting additional supporting documents');
    }
    
    if (flags.some(flag => flag.includes('OCR confidence'))) {
      recommendations.push('Request higher quality document scan');
    }
    
    if (flags.some(flag => flag.includes('format'))) {
      recommendations.push('Verify document authenticity with issuing authority');
    }
    
    return recommendations;
  }
}

// Initialize AI processor
const aiProcessor = new AIDocumentProcessor();

// Routes

// Upload and process document
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const { documentType = 'auto' } = req.body;
    const filePath = req.file.path;
    
    // Process document with AI
    const result = await aiProcessor.processDocument(filePath, documentType);
    
    // Store result in database (placeholder)
    const documentRecord = {
      id: Date.now(),
      filename: req.file.originalname,
      filePath: filePath,
      documentType: result.documentType,
      ocrText: result.ocrText,
      extractedData: result.extractedData,
      fraudAnalysis: result.fraudAnalysis,
      qualityScore: result.qualityScore,
      insights: result.insights,
      uploadedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      status: result.fraudAnalysis?.riskScore < 30 ? 'verified' : 'pending_review'
    };
    
    res.json({
      success: true,
      message: 'Document processed successfully',
      data: documentRecord
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Document processing failed',
      error: error.message
    });
  }
});

// Get processing status
router.get('/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch from database (placeholder)
    const document = await getDocumentById(id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    res.json({
      success: true,
      data: document
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document status',
      error: error.message
    });
  }
});

// Get processed documents
router.get('/processed', async (req, res) => {
  try {
    // Fetch from database (placeholder)
    const documents = await getAllProcessedDocuments();
    
    res.json({
      success: true,
      data: documents
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch processed documents',
      error: error.message
    });
  }
});

// Manual verification
router.post('/verify/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    // Update in database (placeholder)
    const updatedDocument = await updateDocumentStatus(id, status, notes);
    
    res.json({
      success: true,
      message: 'Document verification updated',
      data: updatedDocument
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update verification status',
      error: error.message
    });
  }
});

// Placeholder database functions
async function getDocumentById(id) {
  // Implement database query
  return null;
}

async function getAllProcessedDocuments() {
  // Implement database query
  return [];
}

async function updateDocumentStatus(id, status, notes) {
  // Implement database update
  return null;
}

module.exports = router;
