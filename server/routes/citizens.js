const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Services
const { Citizen, Document, Grievance } = require('../models');
const blockchainService = require('../services/blockchainService');

// Validation middleware
const validateCitizenRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('aadharNumber')
    .isLength({ min: 12, max: 12 })
    .matches(/^\d{12}$/)
    .withMessage('Aadhar number must be exactly 12 digits'),
  body('phone')
    .optional()
    .matches(/^[+]?[1-9][\d\s\-()]+$/)
    .withMessage('Invalid phone number format'),
];

// Get citizen profile
router.get('/profile', async (req, res) => {
  try {
    const citizenAddress = req.user.address;

    // Get citizen from database
    let citizen = await Citizen.findOne({ where: { address: citizenAddress } });

    if (!citizen) {
      // Check blockchain for registration
      try {
        const blockchainCitizen = await blockchainService.getCitizen(citizenAddress);
        if (blockchainCitizen && blockchainCitizen.name) {
          // Sync with in-memory store
          citizen = dataStore.createCitizen({
            address: citizenAddress,
            name: blockchainCitizen.name,
            email: blockchainCitizen.email,
            isVerified: blockchainCitizen.isVerified,
            isActive: blockchainCitizen.isActive,
          });
        }
      } catch (blockchainError) {
        console.log('Citizen not found on blockchain:', blockchainError.message);
      }
    }

    if (!citizen) {
      return res.status(404).json({
        success: false,
        message: 'Citizen profile not found',
      });
    }

    // Don't expose sensitive data
    const { aadharHash, ...safeData } = citizen;

    res.json({
      success: true,
      data: safeData,
    });
  } catch (error) {
    console.error('Error fetching citizen profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message,
    });
  }
});

// Register new citizen
router.post('/register', validateCitizenRegistration, async (req, res) => {
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

    const { name, email, aadharNumber, phone } = req.body;
    const citizenAddress = req.user.address;

    // Check if citizen already exists
    const existingCitizen = dataStore.findCitizenByAddress(citizenAddress);

    if (existingCitizen) {
      return res.status(409).json({
        success: false,
        message: 'Citizen already registered',
      });
    }

    // Hash sensitive data
    const crypto = require('crypto');
    const aadharHash = crypto.createHash('sha256').update(aadharNumber).digest('hex');
    const phoneHash = phone ? crypto.createHash('sha256').update(phone).digest('hex') : '';

    // Register on blockchain
    try {
      const blockchainResult = await blockchainService.registerCitizen(
        citizenAddress,
        name,
        aadharHash,
        email || '',
        phoneHash
      );

      console.log('Blockchain registration:', blockchainResult);
    } catch (blockchainError) {
      console.log('Blockchain registration failed, continuing with data store only:', blockchainError.message);
    }

    // Create in data store
    const citizen = dataStore.createCitizen({
      address: citizenAddress,
      name,
      email,
      phone,
      aadharHash,
      isVerified: false,
      isActive: true,
    });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`citizen-${citizenAddress}`).emit('citizen-registered', {
        address: citizenAddress,
        name: citizen.name,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Citizen registered successfully',
      data: {
        address: citizen.address,
        name: citizen.name,
        email: citizen.email,
        isVerified: citizen.isVerified,
        createdAt: citizen.createdAt,
      },
    });
  } catch (error) {
    console.error('Error registering citizen:', error);
    
    // Handle specific errors
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: 'Citizen with this information already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to register citizen',
      error: error.message,
    });
  }
});

// Update citizen profile
router.put('/profile', async (req, res) => {
  try {
    const citizenAddress = req.user.address;
    const { name, email, phone, dateOfBirth, gender, city, state, pincode } = req.body;

    const citizen = dataStore.findCitizenByAddress(citizenAddress);

    if (!citizen) {
      return res.status(404).json({
        success: false,
        message: 'Citizen profile not found',
      });
    }

    // Update allowed fields
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (gender) updateData.gender = gender;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (pincode) updateData.pincode = pincode;

    const updatedCitizen = dataStore.updateCitizen(citizenAddress, updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        address: updatedCitizen.address,
        name: updatedCitizen.name,
        email: updatedCitizen.email,
        phone: updatedCitizen.phone,
        dateOfBirth: updatedCitizen.dateOfBirth,
        gender: updatedCitizen.gender,
        city: updatedCitizen.city,
        state: updatedCitizen.state,
        pincode: updatedCitizen.pincode,
        updatedAt: updatedCitizen.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating citizen profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
});

// Get citizen statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = dataStore.getCitizenStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching citizen stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
});

module.exports = router;
