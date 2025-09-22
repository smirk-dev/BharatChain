const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const blockchainService = require('../services/blockchain');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Initialize blockchain service
let isBlockchainInitialized = false;

async function initializeBlockchain() {
  if (!isBlockchainInitialized) {
    try {
      const network = process.env.BLOCKCHAIN_NETWORK || 'localhost';
      const privateKey = process.env.PRIVATE_KEY;
      
      await blockchainService.initialize(network, privateKey);
      isBlockchainInitialized = true;
      console.log('✅ Blockchain service initialized for documents module');
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error);
    }
  }
}

// Middleware to ensure blockchain is initialized
const ensureBlockchain = async (req, res, next) => {
  await initializeBlockchain();
  next();
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `document-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and Word documents are allowed'));
    }
  }
});

// Document type mapping
const DocumentType = {
  AADHAR: 0,
  PAN: 1,
  DRIVING_LICENSE: 2,
  PASSPORT: 3,
  VOTER_ID: 4,
  BIRTH_CERTIFICATE: 5,
  OTHER: 6
};

const DocumentStatus = {
  PENDING: 0,
  VERIFIED: 1,
  REJECTED: 2,
  EXPIRED: 3
};

// Extract address from request
function extractAddressFromToken(req) {
  return req.body.address || req.query.address || req.headers['x-wallet-address'] || '0x742d35Cc6635C0532925a3b8D07376F0c9fF4c52';
}

// Generate file hash for integrity verification
function generateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

// Simulate IPFS upload (in production, use real IPFS)
function mockIPFSUpload(filePath) {
  const fileHash = generateFileHash(filePath);
  return `Qm${fileHash.substring(0, 44)}`;
}

/**
 * @route GET /api/documents
 * @desc Get user's documents from blockchain
 * @access Private
 */
router.get('/', ensureBlockchain, async (req, res) => {
  try {
    const userAddress = extractAddressFromToken(req);

    if (!isBlockchainInitialized) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Blockchain service not available'
      });
    }

    // Get user's document IDs from blockchain
    const documentIds = await blockchainService.getUserDocuments(userAddress);

    // Fetch detailed information for each document
    const documents = [];
    const stats = { total: 0, verified: 0, pending: 0, rejected: 0, expired: 0 };

    for (const docId of documentIds) {
      try {
        const doc = await blockchainService.getDocument(docId);
        
        // Get document type name
        const typeNames = Object.keys(DocumentType);
        const typeName = typeNames[doc.docType] || 'OTHER';
        
        // Get status name
        const statusNames = Object.keys(DocumentStatus);
        const statusName = statusNames[doc.status] || 'PENDING';
        
        const documentData = {
          id: doc.id,
          type: typeName,
          status: statusName,
          uploadDate: doc.uploadDate.toISOString(),
          verificationDate: doc.verificationDate ? doc.verificationDate.toISOString() : null,
          verifier: doc.verifier,
          documentHash: doc.documentHash,
          metadata: JSON.parse(doc.metadata || '{}'),
          rejectionReason: doc.rejectionReason,
          expiryDate: doc.expiryDate ? doc.expiryDate.toISOString() : null
        };
        
        documents.push(documentData);
        
        // Update stats
        stats.total++;
        switch (doc.status) {
          case 1: stats.verified++; break;
          case 0: stats.pending++; break;
          case 2: stats.rejected++; break;
          case 3: stats.expired++; break;
        }
      } catch (error) {
        console.warn(`Could not fetch document ${docId}:`, error.message);
      }
    }

    res.json({
      success: true,
      message: 'Documents retrieved successfully from blockchain',
      data: {
        documents: documents.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)),
        stats
      }
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve documents from blockchain',
      details: error.message
    });
  }
});

/**
 * @route POST /api/documents/upload
 * @desc Upload document to blockchain and IPFS
 * @access Private
 */
router.post('/upload', ensureBlockchain, upload.single('document'), [
  body('type').isIn(['AADHAR', 'PAN', 'DRIVING_LICENSE', 'PASSPORT', 'VOTER_ID', 'BIRTH_CERTIFICATE', 'OTHER'])
    .withMessage('Invalid document type'),
  body('title').optional().isLength({ max: 100 }).withMessage('Title too long'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description too long'),
  body('expiryDate').optional().isISO8601().withMessage('Invalid expiry date format')
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

    const { type, title, description, expiryDate } = req.body;
    const userAddress = extractAddressFromToken(req);

    if (!isBlockchainInitialized) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Blockchain service not available'
      });
    }

    // Generate file hash for integrity
    const fileHash = generateFileHash(req.file.path);
    
    // Simulate IPFS upload
    const ipfsHash = mockIPFSUpload(req.file.path);

    // Prepare metadata
    const metadata = JSON.stringify({
      title: title || `${type} Document`,
      description: description || '',
      originalName: req.file.originalname,
      filename: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      ipfsHash,
      fileHash,
      uploadedBy: userAddress
    });

    // Convert expiry date to timestamp
    const expiryTimestamp = expiryDate ? Math.floor(new Date(expiryDate).getTime() / 1000) : 0;

    // Upload to blockchain
    const result = await blockchainService.uploadDocument(
      ipfsHash,
      DocumentType[type],
      metadata,
      expiryTimestamp
    );

    const responseData = {
      id: result.documentId,
      type,
      title: title || `${type} Document`,
      description: description || '',
      filename: req.file.originalname,
      fileSize: (req.file.size / (1024 * 1024)).toFixed(2) + 'MB',
      uploadDate: new Date().toISOString(),
      status: 'PENDING',
      documentHash: ipfsHash,
      fileHash,
      metadata: JSON.parse(metadata),
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      gasUsed: result.gasUsed,
      owner: userAddress
    };

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully to blockchain',
      data: responseData
    });

  } catch (error) {
    console.error('Upload document error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to upload document to blockchain',
      details: error.message
    });
  }
});

/**
 * @route GET /api/documents/:id
 * @desc Get document details from blockchain
 * @access Private
 */
router.get('/:id', ensureBlockchain, async (req, res) => {
  try {
    const { id } = req.params;
    const userAddress = extractAddressFromToken(req);

    if (!isBlockchainInitialized) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Blockchain service not available'
      });
    }

    // Get document from blockchain
    const doc = await blockchainService.getDocument(id);

    // Check if user owns this document or has permission to view
    if (doc.owner.toLowerCase() !== userAddress.toLowerCase()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to view this document'
      });
    }

    // Get document type and status names
    const typeNames = Object.keys(DocumentType);
    const statusNames = Object.keys(DocumentStatus);
    const typeName = typeNames[doc.docType] || 'OTHER';
    const statusName = statusNames[doc.status] || 'PENDING';

    // Parse metadata
    const metadata = JSON.parse(doc.metadata || '{}');

    const documentData = {
      id: doc.id,
      owner: doc.owner,
      type: typeName,
      status: statusName,
      uploadDate: doc.uploadDate.toISOString(),
      verificationDate: doc.verificationDate ? doc.verificationDate.toISOString() : null,
      verifier: doc.verifier,
      documentHash: doc.documentHash,
      rejectionReason: doc.rejectionReason,
      expiryDate: doc.expiryDate ? doc.expiryDate.toISOString() : null,
      metadata,
      fileHash: metadata.fileHash,
      ipfsHash: metadata.ipfsHash,
      originalName: metadata.originalName,
      fileSize: metadata.fileSize ? (metadata.fileSize / (1024 * 1024)).toFixed(2) + 'MB' : 'Unknown'
    };

    res.json({
      success: true,
      message: 'Document details retrieved successfully from blockchain',
      data: documentData
    });

  } catch (error) {
    console.error('Get document details error:', error);
    
    if (error.message.includes('Document does not exist')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Document not found'
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve document details from blockchain',
      details: error.message
    });
  }
});

/**
 * @route PUT /api/documents/:id/verify
 * @desc Verify a document on blockchain (for officials)
 * @access Private (Verifiers only)
 */
router.put('/:id/verify', ensureBlockchain, [
  body('action').isIn(['verify', 'reject']).withMessage('Invalid verification action'),
  body('reason').optional().isLength({ max: 1000 }).withMessage('Reason too long')
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
    const { action, reason } = req.body;
    const verifierAddress = extractAddressFromToken(req);

    if (!isBlockchainInitialized) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Blockchain service not available'
      });
    }

    let result;
    let message;

    if (action === 'verify') {
      result = await blockchainService.verifyDocument(id);
      message = 'Document verified successfully on blockchain';
    } else if (action === 'reject') {
      const contract = blockchainService.getContract('DocumentRegistry');
      const tx = await contract.rejectDocument(id, reason || 'Document rejected');
      const receipt = await tx.wait();
      
      result = {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      message = 'Document rejected successfully on blockchain';
    }

    const verificationResult = {
      documentId: id,
      action: action.toUpperCase(),
      verifierAddress,
      reason: reason || '',
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      gasUsed: result.gasUsed,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      message,
      data: verificationResult
    });

  } catch (error) {
    console.error('Verify document error:', error);
    
    if (error.message.includes('Not authorized verifier')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Not authorized to verify documents'
      });
    }
    
    if (error.message.includes('Document does not exist')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Document not found'
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify document on blockchain',
      details: error.message
    });
  }
});

/**
 * @route GET /api/documents/:id/integrity
 * @desc Verify document integrity using blockchain hash
 * @access Private
 */
router.get('/:id/integrity', ensureBlockchain, async (req, res) => {
  try {
    const { id } = req.params;
    const userAddress = extractAddressFromToken(req);

    if (!isBlockchainInitialized) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Blockchain service not available'
      });
    }

    // Get document from blockchain
    const doc = await blockchainService.getDocument(id);

    // Check permission
    if (doc.owner.toLowerCase() !== userAddress.toLowerCase()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to verify this document'
      });
    }

    const metadata = JSON.parse(doc.metadata || '{}');
    const storedFileHash = metadata.fileHash;
    const blockchainHash = doc.documentHash;

    // Check if local file exists and verify integrity
    const filename = metadata.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    let fileIntegrityCheck = null;
    if (fs.existsSync(filePath)) {
      const currentFileHash = generateFileHash(filePath);
      fileIntegrityCheck = {
        fileExists: true,
        storedHash: storedFileHash,
        currentHash: currentFileHash,
        isIntact: storedFileHash === currentFileHash
      };
    } else {
      fileIntegrityCheck = {
        fileExists: false,
        message: 'Original file not found on server'
      };
    }

    const integrityResult = {
      documentId: id,
      blockchainHash,
      ipfsHash: metadata.ipfsHash,
      fileIntegrityCheck,
      uploadDate: doc.uploadDate.toISOString(),
      lastVerified: new Date().toISOString(),
      isBlockchainVerified: true
    };

    res.json({
      success: true,
      message: 'Document integrity check completed',
      data: integrityResult
    });

  } catch (error) {
    console.error('Document integrity check error:', error);
    
    if (error.message.includes('Document does not exist')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Document not found'
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify document integrity',
      details: error.message
    });
  }
});

/**
 * @route GET /api/documents/pending/verification
 * @desc Get documents pending verification (for verifiers)
 * @access Private (Verifiers only)
 */
router.get('/pending/verification', ensureBlockchain, async (req, res) => {
  try {
    if (!isBlockchainInitialized) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Blockchain service not available'
      });
    }

    // Get documents by status (PENDING = 0)
    const contract = blockchainService.getContract('DocumentRegistry');
    const pendingDocumentIds = await contract.getDocumentsByStatus(0); // PENDING

    const pendingDocuments = [];
    
    for (const docId of pendingDocumentIds) {
      try {
        const doc = await blockchainService.getDocument(docId.toString());
        const metadata = JSON.parse(doc.metadata || '{}');
        
        const typeNames = Object.keys(DocumentType);
        const typeName = typeNames[doc.docType] || 'OTHER';
        
        pendingDocuments.push({
          id: doc.id,
          type: typeName,
          owner: doc.owner,
          uploadDate: doc.uploadDate.toISOString(),
          documentHash: doc.documentHash,
          metadata,
          title: metadata.title || `${typeName} Document`
        });
      } catch (error) {
        console.warn(`Could not fetch pending document ${docId}:`, error.message);
      }
    }

    res.json({
      success: true,
      message: 'Pending documents retrieved successfully',
      data: {
        documents: pendingDocuments.sort((a, b) => new Date(a.uploadDate) - new Date(b.uploadDate)),
        count: pendingDocuments.length
      }
    });

  } catch (error) {
    console.error('Get pending documents error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve pending documents',
      details: error.message
    });
  }
});

module.exports = router;