const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { ethers } = require('ethers');
const crypto = require('crypto');
const router = express.Router();

// In-memory storage for nonces (use Redis in production)
const nonces = new Map();

// Clean up expired nonces every hour
setInterval(() => {
  const now = Date.now();
  for (const [address, data] of nonces.entries()) {
    if (now - data.timestamp > 3600000) { // 1 hour
      nonces.delete(address);
    }
  }
}, 3600000);

/**
 * @route POST /api/auth/message
 * @desc Get a message to sign for wallet authentication
 * @access Public
 */
router.post('/message', [
  body('address')
    .isString()
    .isLength({ min: 42, max: 42 })
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid Ethereum address format')
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

    const { address } = req.body;
    
    // Sanitize address (remove ENS resolution issues)
    const sanitizedAddress = address.toLowerCase().trim();
    
    // Validate address format
    if (!ethers.isAddress(sanitizedAddress)) {
      return res.status(400).json({
        error: 'Invalid Address',
        message: 'Provided address is not a valid Ethereum address'
      });
    }

    // Generate a unique nonce
    const nonce = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    
    // Store nonce with timestamp for security
    nonces.set(sanitizedAddress, {
      nonce,
      timestamp,
      used: false
    });

    // Create message to sign
    const message = `Welcome to BharatChain!
    
This signature request proves you own this wallet address and will be used to log you into the platform.

Address: ${sanitizedAddress}
Nonce: ${nonce}
Timestamp: ${new Date(timestamp).toISOString()}

This request will not trigger any blockchain transaction or cost any gas fees.`;

    res.json({
      success: true,
      message: 'Sign this message to authenticate with BharatChain',
      data: {
        message,
        nonce,
        address: sanitizedAddress,
        timestamp
      }
    });

  } catch (error) {
    console.error('Auth message error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate authentication message'
    });
  }
});

/**
 * @route POST /api/auth/connect
 * @desc Verify signature and authenticate user
 * @access Public
 */
router.post('/connect', [
  body('address')
    .isString()
    .isLength({ min: 42, max: 42 })
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid Ethereum address format'),
  body('signature')
    .isString()
    .isLength({ min: 132, max: 132 })
    .matches(/^0x[a-fA-F0-9]{130}$/)
    .withMessage('Invalid signature format'),
  body('nonce')
    .isString()
    .isLength({ min: 64, max: 64 })
    .matches(/^[a-fA-F0-9]{64}$/)
    .withMessage('Invalid nonce format')
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

    const { address, signature, nonce } = req.body;
    
    // Sanitize address
    const sanitizedAddress = address.toLowerCase().trim();
    
    // Check if nonce exists and is valid
    const storedData = nonces.get(sanitizedAddress);
    if (!storedData) {
      return res.status(400).json({
        error: 'Invalid Nonce',
        message: 'Nonce not found. Please request a new message to sign.'
      });
    }

    // Check if nonce has been used
    if (storedData.used) {
      return res.status(400).json({
        error: 'Nonce Already Used',
        message: 'This nonce has already been used. Please request a new message.'
      });
    }

    // Check if nonce matches
    if (storedData.nonce !== nonce) {
      return res.status(400).json({
        error: 'Nonce Mismatch',
        message: 'Provided nonce does not match stored nonce.'
      });
    }

    // Check if nonce is expired (1 hour)
    const now = Date.now();
    if (now - storedData.timestamp > 3600000) {
      nonces.delete(sanitizedAddress);
      return res.status(400).json({
        error: 'Nonce Expired',
        message: 'Nonce has expired. Please request a new message to sign.'
      });
    }

    // Reconstruct the message that was signed
    const message = `Welcome to BharatChain!
    
This signature request proves you own this wallet address and will be used to log you into the platform.

Address: ${sanitizedAddress}
Nonce: ${nonce}
Timestamp: ${new Date(storedData.timestamp).toISOString()}

This request will not trigger any blockchain transaction or cost any gas fees.`;

    try {
      // Verify the signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      if (recoveredAddress.toLowerCase() !== sanitizedAddress) {
        return res.status(401).json({
          error: 'Invalid Signature',
          message: 'Signature verification failed. The signature does not match the provided address.'
        });
      }

      // Mark nonce as used
      storedData.used = true;

      // Generate JWT token
      const tokenPayload = {
        address: sanitizedAddress,
        timestamp: now,
        nonce: nonce.substring(0, 8) // Include partial nonce for tracking
      };

      const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        { 
          expiresIn: '24h',
          issuer: 'bharatchain-api',
          audience: 'bharatchain-client'
        }
      );

      // Clean up used nonce after successful authentication
      setTimeout(() => {
        nonces.delete(sanitizedAddress);
      }, 60000); // Remove after 1 minute

      res.json({
        success: true,
        message: 'Authentication successful',
        data: {
          token,
          address: sanitizedAddress,
          expiresIn: '24h',
          issuedAt: new Date(now).toISOString()
        }
      });

    } catch (signatureError) {
      console.error('Signature verification error:', signatureError);
      return res.status(401).json({
        error: 'Signature Verification Failed',
        message: 'Unable to verify the provided signature.'
      });
    }

  } catch (error) {
    console.error('Auth connect error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to authenticate user'
    });
  }
});

/**
 * @route POST /api/auth/verify
 * @desc Verify JWT token
 * @access Private
 */
router.post('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'No Token',
        message: 'No authentication token provided'
      });
    }

    try {
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'your-super-secret-jwt-key'
      );

      res.json({
        success: true,
        message: 'Token is valid',
        data: {
          address: decoded.address,
          timestamp: decoded.timestamp,
          expiresAt: new Date(decoded.exp * 1000).toISOString()
        }
      });

    } catch (jwtError) {
      return res.status(401).json({
        error: 'Invalid Token',
        message: 'Token verification failed',
        details: jwtError.message
      });
    }

  } catch (error) {
    console.error('Auth verify error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify token'
    });
  }
});

/**
 * @route GET /api/auth/stats
 * @desc Get authentication statistics
 * @access Public
 */
router.get('/stats', (req, res) => {
  try {
    const now = Date.now();
    let activeNonces = 0;
    let expiredNonces = 0;

    for (const [address, data] of nonces.entries()) {
      if (now - data.timestamp > 3600000) {
        expiredNonces++;
      } else {
        activeNonces++;
      }
    }

    res.json({
      success: true,
      message: 'Authentication statistics',
      data: {
        activeNonces,
        expiredNonces,
        totalStoredNonces: nonces.size,
        serverUptime: process.uptime(),
        timestamp: new Date(now).toISOString()
      }
    });

  } catch (error) {
    console.error('Auth stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get authentication statistics'
    });
  }
});

module.exports = router;
