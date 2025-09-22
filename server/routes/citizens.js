const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const blockchainService = require('../services/blockchain');

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
 * @access Private
 */
router.get('/profile', ensureBlockchain, async (req, res) => {
  try {
    const citizenAddress = extractAddressFromToken(req);
    
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
 * @desc Register a new citizen
 * @access Private
 */
router.post('/register', [
  body('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('aadharHash').isLength({ min: 10 }).withMessage('Aadhar hash is required')
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

    const { name, email, phone, aadharHash } = req.body;

    // TODO: Implement actual registration logic
    // 1. Save to database
    // 2. Call smart contract
    // 3. Send verification email

    const mockRegistration = {
      id: Date.now(),
      address: req.body.address || '0x1234567890123456789012345678901234567890',
      name,
      email,
      phone,
      aadharHash,
      isVerified: false,
      registrationDate: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Citizen registered successfully',
      data: mockRegistration
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to register citizen'
    });
  }
});

/**
 * @route PUT /api/citizens/update
 * @desc Update citizen profile
 * @access Private
 */
router.put('/update', [
  body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required')
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

    // TODO: Implement actual update logic
    const mockUpdatedProfile = {
      address: '0x1234567890123456789012345678901234567890',
      name: name || 'John Doe',
      email: email || 'john.doe@example.com',
      phone: phone || '+91-9876543210',
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: mockUpdatedProfile
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update profile'
    });
  }
});

/**
 * @route GET /api/citizens/stats
 * @desc Get citizen statistics
 * @access Private
 */
router.get('/stats', async (req, res) => {
  try {
    const mockStats = {
      totalDocuments: 5,
      verifiedDocuments: 3,
      pendingDocuments: 2,
      totalGrievances: 3,
      resolvedGrievances: 2,
      pendingGrievances: 1,
      verificationStatus: 'verified',
      memberSince: '2024-01-15T00:00:00.000Z'
    };

    res.json({
      success: true,
      message: 'Citizen statistics retrieved successfully',
      data: mockStats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve statistics'
    });
  }
});

module.exports = router;
