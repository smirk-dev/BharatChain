const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const blockchainService = require('../services/blockchain');
const { verifyToken, attachUserContext, requireVerification } = require('../middleware/auth');
const { asyncHandler, ValidationError } = require('../middleware/error');

// Initialize blockchain service on first load
let isBlockchainInitialized = false;

async function initializeBlockchain() {
  if (!isBlockchainInitialized) {
    try {
      const network = process.env.BLOCKCHAIN_NETWORK || 'localhost';
      const privateKey = process.env.PRIVATE_KEY;
      
      await blockchainService.initialize(network, privateKey);
      isBlockchainInitialized = true;
      console.log('✅ Blockchain service initialized for citizens module');
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error);
      // Continue without blockchain integration for development
    }
  }
}

// Middleware to ensure blockchain is initialized
const ensureBlockchain = async (req, res, next) => {
  await initializeBlockchain();
  next();
};

// Hash Aadhar number for privacy
function hashAadhar(aadharNumber) {
  return crypto.createHash('sha256').update(aadharNumber).digest('hex');
}

// Extract address from JWT token
function extractAddressFromToken(req) {
  // TODO: Implement JWT extraction
  // For now, use mock address or from request
  return req.body.address || req.headers['x-wallet-address'] || '0x742d35Cc6635C0532925a3b8D07376F0c9fF4c52';
}

/**
 * @route GET /api/citizens/profile
 * @desc Get citizen profile information from blockchain
 * @access Private - requires authentication
 */
router.get('/profile', 
  verifyToken, 
  attachUserContext, 
  asyncHandler(async (req, res) => {
    const citizenAddress = req.user.address;
    
    if (!isBlockchainInitialized) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Blockchain service not available'
      });
    }

    // Check if citizen is registered on blockchain
    const isRegistered = await blockchainService.isCitizenRegistered(citizenAddress);
    
    if (!isRegistered) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Citizen not registered on blockchain'
      });
    }

    // Get citizen data from blockchain
    const citizen = await blockchainService.getCitizen(citizenAddress);
    
    // Get user's documents count
    const documentIds = await blockchainService.getUserDocuments(citizenAddress);
    
    // Get user's grievances count
    const grievanceIds = await blockchainService.getCitizenGrievances(citizenAddress);

    const profile = {
      address: citizenAddress,
      name: citizen.name,
      email: citizen.email,
      phone: citizen.phone,
      aadharHash: citizen.aadharHash,
      isVerified: citizen.isVerified,
      registrationDate: citizen.registrationDate.toISOString(),
      documentsCount: documentIds.length,
      grievancesCount: grievanceIds.length,
      walletAddress: citizen.walletAddress
    };

    res.json({
      success: true,
      message: 'Citizen profile retrieved successfully from blockchain',
      data: profile
    });

  } catch (error) {
    console.error('Get profile error:', error);
    
    if (error.message.includes('Citizen not registered')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Citizen not registered'
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve citizen profile',
      details: error.message
    });
  }
});

/**
 * @route POST /api/citizens/register
 * @desc Register a new citizen on blockchain
 * @access Private
 */
router.post('/register', ensureBlockchain, [
  body('name').isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').isMobilePhone('en-IN').withMessage('Valid Indian phone number is required'),
  body('aadharNumber').isLength({ min: 12, max: 12 }).isNumeric().withMessage('Valid 12-digit Aadhar number is required')
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

    const { name, email, phone, aadharNumber } = req.body;
    const citizenAddress = extractAddressFromToken(req);

    if (!isBlockchainInitialized) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Blockchain service not available'
      });
    }

    // Check if citizen is already registered
    const isAlreadyRegistered = await blockchainService.isCitizenRegistered(citizenAddress);
    if (isAlreadyRegistered) {
      return res.status(409).json({
        error: 'Already Registered',
        message: 'Citizen is already registered on blockchain'
      });
    }

    // Hash Aadhar number for privacy
    const aadharHash = hashAadhar(aadharNumber);

    // Register citizen on blockchain
    const result = await blockchainService.registerCitizen(
      aadharHash,
      name,
      email,
      phone
    );

    const registration = {
      address: citizenAddress,
      name,
      email,
      phone,
      aadharHash,
      isVerified: false,
      registrationDate: new Date().toISOString(),
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      gasUsed: result.gasUsed
    };

    res.status(201).json({
      success: true,
      message: 'Citizen registered successfully on blockchain',
      data: registration
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message.includes('Already registered')) {
      return res.status(409).json({
        error: 'Already Registered',
        message: 'Citizen or Aadhar already registered'
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to register citizen on blockchain',
      details: error.message
    });
  }
});

/**
 * @route PUT /api/citizens/update
 * @desc Update citizen profile on blockchain
 * @access Private
 */
router.put('/update', ensureBlockchain, [
  body('name').optional().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone('en-IN').withMessage('Valid Indian phone number is required')
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

    const { name, email, phone } = req.body;
    const citizenAddress = extractAddressFromToken(req);

    if (!isBlockchainInitialized) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Blockchain service not available'
      });
    }

    // Check if citizen is registered
    const isRegistered = await blockchainService.isCitizenRegistered(citizenAddress);
    if (!isRegistered) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Citizen not registered on blockchain'
      });
    }

    // Get current profile
    const currentProfile = await blockchainService.getCitizen(citizenAddress);

    // Update profile on blockchain (using the updateProfile function from smart contract)
    const contract = blockchainService.getContract('CitizenRegistry');
    const tx = await contract.updateProfile(
      name || currentProfile.name,
      email || currentProfile.email,
      phone || currentProfile.phone
    );

    const receipt = await tx.wait();

    const updatedProfile = {
      address: citizenAddress,
      name: name || currentProfile.name,
      email: email || currentProfile.email,
      phone: phone || currentProfile.phone,
      lastUpdated: new Date().toISOString(),
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };

    res.json({
      success: true,
      message: 'Profile updated successfully on blockchain',
      data: updatedProfile
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.message.includes('Citizen not registered')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Citizen not registered'
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update profile on blockchain',
      details: error.message
    });
  }
});

/**
 * @route GET /api/citizens/stats
 * @desc Get citizen statistics from blockchain
 * @access Private
 */
router.get('/stats', ensureBlockchain, async (req, res) => {
  try {
    const citizenAddress = extractAddressFromToken(req);

    if (!isBlockchainInitialized) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Blockchain service not available'
      });
    }

    // Check if citizen is registered
    const isRegistered = await blockchainService.isCitizenRegistered(citizenAddress);
    if (!isRegistered) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Citizen not registered on blockchain'
      });
    }

    // Get citizen profile
    const citizen = await blockchainService.getCitizen(citizenAddress);

    // Get user's documents
    const documentIds = await blockchainService.getUserDocuments(citizenAddress);
    let verifiedDocuments = 0;
    let pendingDocuments = 0;

    // Count document statuses
    for (const docId of documentIds) {
      try {
        const doc = await blockchainService.getDocument(docId);
        if (doc.status === 1) { // VERIFIED
          verifiedDocuments++;
        } else if (doc.status === 0) { // PENDING
          pendingDocuments++;
        }
      } catch (error) {
        console.warn(`Could not fetch document ${docId}:`, error.message);
      }
    }

    // Get user's grievances
    const grievanceIds = await blockchainService.getCitizenGrievances(citizenAddress);
    let resolvedGrievances = 0;
    let pendingGrievances = 0;

    // Count grievance statuses
    for (const grievanceId of grievanceIds) {
      try {
        const grievance = await blockchainService.getGrievance(grievanceId);
        if (grievance.status === 2) { // RESOLVED
          resolvedGrievances++;
        } else if (grievance.status === 0 || grievance.status === 1) { // SUBMITTED or IN_PROGRESS
          pendingGrievances++;
        }
      } catch (error) {
        console.warn(`Could not fetch grievance ${grievanceId}:`, error.message);
      }
    }

    const stats = {
      totalDocuments: documentIds.length,
      verifiedDocuments,
      pendingDocuments,
      rejectedDocuments: documentIds.length - verifiedDocuments - pendingDocuments,
      totalGrievances: grievanceIds.length,
      resolvedGrievances,
      pendingGrievances,
      escalatedGrievances: grievanceIds.length - resolvedGrievances - pendingGrievances,
      verificationStatus: citizen.isVerified ? 'verified' : 'unverified',
      memberSince: citizen.registrationDate.toISOString(),
      walletAddress: citizenAddress
    };

    res.json({
      success: true,
      message: 'Citizen statistics retrieved successfully from blockchain',
      data: stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    
    if (error.message.includes('Citizen not registered')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Citizen not registered'
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve statistics from blockchain',
      details: error.message
    });
  }
});

/**
 * @route POST /api/citizens/verify/:address
 * @desc Verify a citizen (admin/verifier only)
 * @access Private (Verifier)
 */
router.post('/verify/:address', ensureBlockchain, async (req, res) => {
  try {
    const { address } = req.params;
    const verifierAddress = extractAddressFromToken(req);

    if (!isBlockchainInitialized) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Blockchain service not available'
      });
    }

    // Verify citizen on blockchain
    const result = await blockchainService.verifyCitizen(address);

    res.json({
      success: true,
      message: 'Citizen verified successfully on blockchain',
      data: {
        citizenAddress: address,
        verifierAddress,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Verify citizen error:', error);
    
    if (error.message.includes('Not authorized verifier')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Not authorized to verify citizens'
      });
    }
    
    if (error.message.includes('Citizen not registered')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Citizen not registered'
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify citizen on blockchain',
      details: error.message
    });
  }
});

module.exports = router;
