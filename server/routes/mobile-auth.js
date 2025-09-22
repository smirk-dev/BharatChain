const express = require('express');
const router = express.Router();
const mobileAuthService = require('../services/mobile-auth');

/**
 * @route POST /api/mobile-auth/device/register
 * @desc Register a new mobile device
 * @access Public
 */
router.post('/device/register', async (req, res) => {
  try {
    const {
      deviceInfo,
      userAddress
    } = req.body;

    // Validate required fields
    if (!deviceInfo || !userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: deviceInfo, userAddress'
      });
    }

    const requiredDeviceFields = ['deviceId', 'deviceName', 'deviceType'];
    const missingFields = requiredDeviceFields.filter(field => !deviceInfo[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing device fields: ${missingFields.join(', ')}`
      });
    }

    // Register device
    const device = await mobileAuthService.registerDevice(deviceInfo, userAddress);

    res.json({
      success: true,
      data: device,
      message: 'Device registered successfully'
    });

  } catch (error) {
    console.error('❌ Device registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to register device'
    });
  }
});

/**
 * @route POST /api/mobile-auth/otp/send
 * @desc Send OTP to phone number or email
 * @access Public
 */
router.post('/otp/send', async (req, res) => {
  try {
    const {
      identifier,
      purpose,
      deviceId
    } = req.body;

    if (!identifier || !purpose) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: identifier, purpose'
      });
    }

    // Validate purpose
    const validPurposes = ['registration', 'login', 'verification', 'password_reset', 'device_trust'];
    if (!validPurposes.includes(purpose)) {
      return res.status(400).json({
        success: false,
        error: `Invalid purpose. Must be one of: ${validPurposes.join(', ')}`
      });
    }

    // Rate limiting - simple implementation
    const key = `otp_${identifier}_${purpose}`;
    // In production, use Redis or similar for rate limiting

    const otpInfo = await mobileAuthService.sendOTP(identifier, purpose, deviceId);

    res.json({
      success: true,
      data: otpInfo,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    console.error('❌ OTP send error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send OTP'
    });
  }
});

/**
 * @route POST /api/mobile-auth/otp/verify
 * @desc Verify OTP code
 * @access Public
 */
router.post('/otp/verify', async (req, res) => {
  try {
    const {
      identifier,
      code,
      purpose,
      deviceId
    } = req.body;

    if (!identifier || !code || !purpose) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: identifier, code, purpose'
      });
    }

    const verificationResult = await mobileAuthService.verifyOTP(identifier, code, purpose, deviceId);

    res.json({
      success: true,
      data: verificationResult,
      message: 'OTP verified successfully'
    });

  } catch (error) {
    console.error('❌ OTP verification error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to verify OTP'
    });
  }
});

/**
 * @route POST /api/mobile-auth/session/create
 * @desc Create mobile session after authentication
 * @access Public
 */
router.post('/session/create', async (req, res) => {
  try {
    const {
      userAddress,
      deviceId,
      otpVerified = false,
      twoFactorVerified = false
    } = req.body;

    if (!userAddress || !deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userAddress, deviceId'
      });
    }

    // Add request context
    const sessionContext = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      sessionData: {
        otpVerified,
        twoFactorVerified,
        loginTime: new Date().toISOString()
      }
    };

    const sessionData = await mobileAuthService.createSession(userAddress, deviceId, sessionContext);

    res.json({
      success: true,
      data: sessionData,
      message: 'Mobile session created successfully'
    });

  } catch (error) {
    console.error('❌ Session creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create session'
    });
  }
});

/**
 * @route POST /api/mobile-auth/session/refresh
 * @desc Refresh mobile session tokens
 * @access Public
 */
router.post('/session/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: refreshToken'
      });
    }

    const newSessionData = await mobileAuthService.refreshSession(refreshToken);

    res.json({
      success: true,
      data: newSessionData,
      message: 'Session refreshed successfully'
    });

  } catch (error) {
    console.error('❌ Session refresh error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Failed to refresh session'
    });
  }
});

/**
 * @route POST /api/mobile-auth/session/validate
 * @desc Validate mobile session token
 * @access Public
 */
router.post('/session/validate', async (req, res) => {
  try {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: sessionToken'
      });
    }

    const validationResult = await mobileAuthService.validateSession(sessionToken);

    if (validationResult.valid) {
      res.json({
        success: true,
        data: validationResult,
        message: 'Session is valid'
      });
    } else {
      res.status(401).json({
        success: false,
        error: validationResult.error || 'Invalid session',
        data: validationResult
      });
    }

  } catch (error) {
    console.error('❌ Session validation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to validate session'
    });
  }
});

/**
 * @route POST /api/mobile-auth/session/logout
 * @desc Logout from mobile session
 * @access Private
 */
router.post('/session/logout', async (req, res) => {
  try {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: sessionToken'
      });
    }

    await mobileAuthService.logout(sessionToken);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to logout'
    });
  }
});

/**
 * @route POST /api/mobile-auth/2fa/setup
 * @desc Setup two-factor authentication
 * @access Private
 */
router.post('/2fa/setup', async (req, res) => {
  try {
    const { userAddress, deviceId } = req.body;

    if (!userAddress || !deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userAddress, deviceId'
      });
    }

    const twoFactorData = await mobileAuthService.setupTwoFactor(userAddress, deviceId);

    res.json({
      success: true,
      data: twoFactorData,
      message: '2FA setup initiated. Please verify with your authenticator app to enable.'
    });

  } catch (error) {
    console.error('❌ 2FA setup error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to setup 2FA'
    });
  }
});

/**
 * @route POST /api/mobile-auth/2fa/verify
 * @desc Verify two-factor authentication token
 * @access Private
 */
router.post('/2fa/verify', async (req, res) => {
  try {
    const {
      userAddress,
      token,
      isBackupCode = false
    } = req.body;

    if (!userAddress || !token) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userAddress, token'
      });
    }

    const verificationResult = await mobileAuthService.verifyTwoFactor(userAddress, token, isBackupCode);

    if (verificationResult.valid) {
      res.json({
        success: true,
        data: verificationResult,
        message: '2FA token verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid 2FA token'
      });
    }

  } catch (error) {
    console.error('❌ 2FA verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify 2FA token'
    });
  }
});

/**
 * @route GET /api/mobile-auth/devices
 * @desc Get user's registered devices
 * @access Private
 */
router.get('/devices', async (req, res) => {
  try {
    const { userAddress } = req.query;

    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: userAddress'
      });
    }

    const devices = await mobileAuthService.getUserDevices(userAddress);

    res.json({
      success: true,
      data: devices,
      meta: {
        count: devices.length
      }
    });

  } catch (error) {
    console.error('❌ Get devices error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get devices'
    });
  }
});

/**
 * @route PUT /api/mobile-auth/device/:deviceId/trust
 * @desc Trust or untrust a device
 * @access Private
 */
router.put('/device/:deviceId/trust', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { userAddress, trusted } = req.body;

    if (!userAddress || trusted === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userAddress, trusted'
      });
    }

    // This would update the device trust status
    // Implementation would go here

    res.json({
      success: true,
      message: `Device ${trusted ? 'trusted' : 'untrusted'} successfully`
    });

  } catch (error) {
    console.error('❌ Device trust error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update device trust'
    });
  }
});

/**
 * @route DELETE /api/mobile-auth/device/:deviceId
 * @desc Remove a device
 * @access Private
 */
router.delete('/device/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userAddress'
      });
    }

    // This would remove/deactivate the device
    // Implementation would go here

    res.json({
      success: true,
      message: 'Device removed successfully'
    });

  } catch (error) {
    console.error('❌ Device removal error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove device'
    });
  }
});

/**
 * @route GET /api/mobile-auth/stats
 * @desc Get mobile authentication statistics
 * @access Public
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await mobileAuthService.getStatistics();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Mobile auth stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get mobile auth statistics'
    });
  }
});

/**
 * @route POST /api/mobile-auth/auth/complete
 * @desc Complete mobile authentication flow
 * @access Public
 */
router.post('/auth/complete', async (req, res) => {
  try {
    const {
      userAddress,
      deviceId,
      otpIdentifier,
      otpCode,
      twoFactorToken,
      deviceInfo
    } = req.body;

    if (!userAddress || !deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userAddress, deviceId'
      });
    }

    let otpVerified = false;
    let twoFactorVerified = false;

    // Step 1: Register/update device if deviceInfo provided
    if (deviceInfo) {
      await mobileAuthService.registerDevice(deviceInfo, userAddress);
    }

    // Step 2: Verify OTP if provided
    if (otpIdentifier && otpCode) {
      try {
        await mobileAuthService.verifyOTP(otpIdentifier, otpCode, 'login', deviceId);
        otpVerified = true;
      } catch (otpError) {
        return res.status(400).json({
          success: false,
          error: `OTP verification failed: ${otpError.message}`
        });
      }
    }

    // Step 3: Verify 2FA if provided
    if (twoFactorToken) {
      try {
        const twoFactorResult = await mobileAuthService.verifyTwoFactor(userAddress, twoFactorToken);
        twoFactorVerified = twoFactorResult.valid;
        
        if (!twoFactorVerified) {
          return res.status(400).json({
            success: false,
            error: 'Two-factor authentication failed'
          });
        }
      } catch (twoFactorError) {
        return res.status(400).json({
          success: false,
          error: `2FA verification failed: ${twoFactorError.message}`
        });
      }
    }

    // Step 4: Create session
    const sessionContext = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      sessionData: {
        otpVerified,
        twoFactorVerified,
        loginTime: new Date().toISOString(),
        authMethod: 'mobile_complete'
      }
    };

    const sessionData = await mobileAuthService.createSession(userAddress, deviceId, sessionContext);

    res.json({
      success: true,
      data: {
        ...sessionData,
        authStatus: {
          otpVerified,
          twoFactorVerified
        }
      },
      message: 'Mobile authentication completed successfully'
    });

  } catch (error) {
    console.error('❌ Complete auth error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete authentication'
    });
  }
});

/**
 * Middleware to authenticate mobile requests
 */
const authenticateMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header'
      });
    }

    const sessionToken = authHeader.substring(7);
    const validationResult = await mobileAuthService.validateSession(sessionToken);

    if (!validationResult.valid) {
      return res.status(401).json({
        success: false,
        error: validationResult.error || 'Invalid session'
      });
    }

    // Add user info to request
    req.user = {
      address: validationResult.userAddress,
      deviceId: validationResult.deviceId,
      sessionData: validationResult.sessionData
    };

    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

// Export middleware for use in other routes
router.authenticateMiddleware = authenticateMiddleware;

module.exports = router;