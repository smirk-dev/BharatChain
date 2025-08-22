const express = require('express');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Services
const { Citizen } = require('../models');
const blockchainService = require('../services/blockchainService');

// Validation middleware
const validateAuthRequest = [
  body('address')
    .isString()
    .custom((value) => {
      if (!ethers.isAddress(value)) {
        throw new Error('Invalid Ethereum address');
      }
      return true;
    }),
  body('signature')
    .isString()
    .isLength({ min: 130, max: 132 })
    .withMessage('Invalid signature format'),
  body('message')
    .isString()
    .notEmpty()
    .withMessage('Message is required'),
];

// Generate authentication message
router.post('/message', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Ethereum address required',
      });
    }

    const timestamp = Date.now();
    const message = `Sign this message to authenticate with BharatChain.\n\nAddress: ${address}\nTimestamp: ${timestamp}\n\nThis signature will not trigger any blockchain transaction or cost any gas fees.`;

    res.json({
      success: true,
      data: {
        message,
        timestamp,
        address: address.toLowerCase(),
      },
    });
  } catch (error) {
    console.error('Error generating auth message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate authentication message',
      error: error.message,
    });
  }
});

// Authenticate with wallet signature
router.post('/connect', validateAuthRequest, async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { address, signature, message } = req.body;
    const normalizedAddress = address.toLowerCase();

    // Verify signature
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      if (recoveredAddress.toLowerCase() !== normalizedAddress) {
        return res.status(401).json({
          success: false,
          message: 'Invalid signature',
        });
      }
    } catch (signatureError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid signature format',
        error: signatureError.message,
      });
    }

    // Check if citizen exists in database
    let citizen = await Citizen.findOne({ where: { address: normalizedAddress } });
    let isRegistered = false;

    if (!citizen) {
      // Check blockchain for registration
      try {
        const blockchainCitizen = await blockchainService.getCitizen(normalizedAddress);
        if (blockchainCitizen && blockchainCitizen.name) {
          isRegistered = true;
          // Sync with database
          citizen = await Citizen.create({
            address: normalizedAddress,
            name: blockchainCitizen.name,
            email: blockchainCitizen.email,
            isVerified: blockchainCitizen.isVerified,
            isActive: blockchainCitizen.isActive,
          });
        }
      } catch (blockchainError) {
        console.log('Citizen not found on blockchain:', blockchainError.message);
      }
    } else {
      isRegistered = true;
    }

    // Generate JWT token
    const tokenPayload = {
      address: normalizedAddress,
      isVerified: citizen ? citizen.isVerified : false,
      isRegistered,
      role: 'citizen', // Default role
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Update last login
    if (citizen) {
      dataStore.updateCitizen(normalizedAddress, { lastLogin: new Date() });
    }

    res.json({
      success: true,
      message: 'Authentication successful',
      data: {
        token,
        user: {
          address: normalizedAddress,
          isRegistered,
          isVerified: citizen ? citizen.isVerified : false,
          name: citizen ? citizen.name : null,
          email: citizen ? citizen.email : null,
          lastLogin: citizen ? citizen.lastLogin : null,
        },
      },
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message,
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Generate new token with updated info
      const citizen = dataStore.findCitizenByAddress(decoded.address);
      
      const newTokenPayload = {
        address: decoded.address,
        isVerified: citizen ? citizen.isVerified : false,
        isRegistered: !!citizen,
        role: decoded.role || 'citizen',
      };

      const newToken = jwt.sign(
        newTokenPayload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newToken,
          user: {
            address: decoded.address,
            isRegistered: !!citizen,
            isVerified: citizen ? citizen.isVerified : false,
            name: citizen ? citizen.name : null,
            email: citizen ? citizen.email : null,
          },
        },
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh token',
      error: error.message,
    });
  }
});

// Logout (client-side should discard token)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'Auth route working',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
