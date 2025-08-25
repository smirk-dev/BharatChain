const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { User, Document } = require('../models');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  }
});

/**
 * @route GET /api/documents
 * @desc Get user's documents
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    // Get wallet address from query params (in real app, this would come from JWT token)
    const walletAddress = req.query.address || req.headers.authorization;
    
    if (!walletAddress) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Wallet address required'
      });
    }

    // Find or create user
    let user = await User.findOne({ 
      where: { walletAddress: walletAddress.toLowerCase() } 
    });

    if (!user) {
      // Create user if doesn't exist
      user = await User.create({
        walletAddress: walletAddress.toLowerCase()
      });
    }

    // Get user's documents
    const documents = await Document.findAll({
      where: { userId: user.id },
      order: [['uploadDate', 'DESC']],
      attributes: [
        'id', 'title', 'type', 'filename', 'originalName', 'fileSize', 
        'description', 'status', 'isPublic', 'ipfsHash', 'verificationDate',
        'verifiedBy', 'aiAnalysis', 'extractedData', 'uploadDate'
      ]
    });

    // Format file sizes and dates
    const formattedDocuments = documents.map(doc => ({
      ...doc.toJSON(),
      fileSize: (doc.fileSize / (1024 * 1024)).toFixed(2) + 'MB',
      uploadDate: doc.uploadDate.toISOString(),
      verificationDate: doc.verificationDate ? doc.verificationDate.toISOString() : null
    }));

    const stats = {
      total: documents.length,
      verified: documents.filter(d => d.status === 'VERIFIED').length,
      pending: documents.filter(d => d.status === 'PENDING').length,
      processing: documents.filter(d => d.status === 'PROCESSING').length,
      rejected: documents.filter(d => d.status === 'REJECTED').length
    };

    res.json({
      success: true,
      message: 'Documents retrieved successfully',
      data: {
        documents: formattedDocuments,
        stats
      }
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve documents'
    });
  }
});

/**
 * @route POST /api/documents/upload
 * @desc Upload and analyze a document
 * @access Private
 */
router.post('/upload', upload.single('document'), [
  body('type').isIn(['AADHAR', 'PAN', 'DRIVING_LICENSE', 'PASSPORT', 'VOTER_ID', 'BIRTH_CERTIFICATE', 'OTHER'])
    .withMessage('Invalid document type'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description too long')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No File',
        message: 'No document file was uploaded'
      });
    }

    const { type, description } = req.body;

    // Mock AI analysis (in real implementation, this would call ML service)
    const mockAiAnalysis = {
      fraudScore: Math.random() > 0.8 ? 'Medium' : 'Low',
      confidence: Math.random() * 0.3 + 0.7, // 0.7 to 1.0
      extractedText: 'Sample extracted text from document...',
      documentType: type,
      quality: 'Good',
      extractedData: {
        name: 'John Doe',
        number: '****-****-' + Math.floor(Math.random() * 9999),
        issuedDate: '2020-01-01',
        expiryDate: '2030-01-01'
      },
      securityFeatures: [
        'Watermark detected',
        'Security thread present',
        'Microprint verified'
      ],
      recommendations: ['Document appears authentic', 'Ready for verification']
    };

    // Mock IPFS upload
    const mockIpfsHash = 'Qm' + Math.random().toString(36).substring(2, 15);

    const uploadResult = {
      id: Date.now(),
      type,
      filename: req.file.originalname,
      filePath: req.file.path,
      fileSize: (req.file.size / (1024 * 1024)).toFixed(2) + 'MB',
      uploadDate: new Date().toISOString(),
      status: 'PENDING',
      description: description || '',
      ipfsHash: mockIpfsHash,
      aiAnalysis: mockAiAnalysis,
      owner: req.body.address || '0x1234567890123456789012345678901234567890'
    };

    res.status(201).json({
      success: true,
      message: 'Document uploaded and analyzed successfully',
      data: uploadResult
    });

  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to upload document'
    });
  }
});

/**
 * @route GET /api/documents/:id
 * @desc Get document details
 * @access Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Mock document details
    const mockDocument = {
      id: parseInt(id),
      type: 'AADHAR',
      filename: 'aadhar_card.pdf',
      uploadDate: '2024-01-15T10:30:00.000Z',
      status: 'VERIFIED',
      verificationDate: '2024-01-16T14:20:00.000Z',
      verifier: '0xverifier123',
      fileSize: '2.5MB',
      ipfsHash: 'QmX1234567890',
      owner: '0x1234567890123456789012345678901234567890',
      metadata: {
        originalName: 'aadhar_card.pdf',
        mimeType: 'application/pdf',
        dimensions: '210x297mm',
        pages: 1
      },
      aiAnalysis: {
        fraudScore: 'Low',
        confidence: 0.95,
        extractedText: 'Government of India Aadhaar Card...',
        extractedData: {
          name: 'John Doe',
          number: '****-****-1234',
          dob: '01/01/1990',
          gender: 'Male',
          address: 'Sample Address, City, State'
        },
        securityFeatures: [
          'Watermark detected',
          'Security thread present',
          'Microprint verified',
          'Hologram authentic'
        ],
        qualityCheck: {
          resolution: 'High',
          clarity: 'Excellent',
          completeness: 'Full document visible'
        }
      },
      verificationHistory: [
        {
          date: '2024-01-16T14:20:00.000Z',
          verifier: '0xverifier123',
          action: 'VERIFIED',
          notes: 'Document verified successfully'
        }
      ]
    };

    res.json({
      success: true,
      message: 'Document details retrieved successfully',
      data: mockDocument
    });

  } catch (error) {
    console.error('Get document details error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve document details'
    });
  }
});

/**
 * @route PUT /api/documents/:id/verify
 * @desc Verify a document (for officials)
 * @access Private (Officials only)
 */
router.put('/:id/verify', [
  body('status').isIn(['VERIFIED', 'REJECTED']).withMessage('Invalid verification status'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes too long')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    // TODO: Implement actual verification logic
    // 1. Check if user is authorized verifier
    // 2. Update document status in database
    // 3. Call smart contract verification function

    const verificationResult = {
      id: parseInt(id),
      status,
      verificationDate: new Date().toISOString(),
      verifier: '0xverifier123',
      notes: notes || '',
      transactionHash: '0xabcd1234567890' // Mock transaction hash
    };

    res.json({
      success: true,
      message: `Document ${status.toLowerCase()} successfully`,
      data: verificationResult
    });

  } catch (error) {
    console.error('Verify document error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify document'
    });
  }
});

/**
 * @route DELETE /api/documents/:id
 * @desc Delete a document
 * @access Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implement actual deletion logic
    // 1. Check ownership
    // 2. Remove from IPFS
    // 3. Update database
    // 4. Update blockchain if necessary

    res.json({
      success: true,
      message: 'Document deleted successfully',
      data: { id: parseInt(id) }
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete document'
    });
  }
});

module.exports = router;
