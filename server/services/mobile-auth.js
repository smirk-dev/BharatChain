const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Initialize database for mobile auth
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/mobile_auth.db'),
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Device model
const Device = sequelize.define('Device', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  deviceId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    index: true
  },
  userAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  deviceName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  deviceType: {
    type: DataTypes.ENUM('ios', 'android', 'web', 'tablet', 'desktop'),
    allowNull: false
  },
  platform: {
    type: DataTypes.STRING,
    allowNull: true
  },
  appVersion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  osVersion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deviceFingerprint: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pushToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isTrusted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastSeen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  lastLocation: {
    type: DataTypes.JSON,
    allowNull: true
  },
  securitySettings: {
    type: DataTypes.JSON,
    defaultValue: {
      biometricEnabled: false,
      pinEnabled: false,
      autoLockEnabled: true,
      autoLockDuration: 300 // 5 minutes
    }
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'devices',
  timestamps: true,
  indexes: [
    { fields: ['deviceId'] },
    { fields: ['userAddress'] },
    { fields: ['isActive'] },
    { fields: ['isTrusted'] }
  ]
});

// Mobile session model
const MobileSession = sequelize.define('MobileSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sessionToken: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    index: true
  },
  deviceId: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  userAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  refreshToken: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    index: true
  },
  refreshExpiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sessionData: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'mobile_sessions',
  timestamps: true,
  indexes: [
    { fields: ['sessionToken'] },
    { fields: ['refreshToken'] },
    { fields: ['deviceId'] },
    { fields: ['userAddress'] },
    { fields: ['expiresAt'] }
  ]
});

// OTP model
const OTP = sequelize.define('OTP', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  identifier: {
    type: DataTypes.STRING, // phone number or email
    allowNull: false,
    index: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  hashedCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  purpose: {
    type: DataTypes.ENUM('registration', 'login', 'verification', 'password_reset', 'device_trust'),
    allowNull: false
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  maxAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    index: true
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deviceId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'otps',
  timestamps: true,
  indexes: [
    { fields: ['identifier'] },
    { fields: ['purpose'] },
    { fields: ['expiresAt'] },
    { fields: ['isUsed'] }
  ]
});

// Two-factor authentication model
const TwoFactorAuth = sequelize.define('TwoFactorAuth', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    index: true
  },
  secret: {
    type: DataTypes.STRING,
    allowNull: false
  },
  backupCodes: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  isEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastUsed: {
    type: DataTypes.DATE,
    allowNull: true
  },
  qrCodeUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'two_factor_auth',
  timestamps: true,
  indexes: [
    { fields: ['userAddress'] },
    { fields: ['isEnabled'] }
  ]
});

class MobileAuthService {
  constructor() {
    this.initialized = false;
    this.jwtSecret = process.env.JWT_SECRET || 'bharatchain-mobile-auth-secret-2025';
    this.refreshSecret = process.env.REFRESH_JWT_SECRET || 'bharatchain-refresh-secret-2025';
    this.otpValidityMinutes = 10;
    this.sessionValidityHours = 24;
    this.refreshValidityDays = 30;
  }

  /**
   * Initialize mobile auth service
   */
  async initialize() {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ alter: true });
      
      // Clean up expired sessions and OTPs
      await this.cleanupExpiredData();
      
      this.initialized = true;
      console.log('✅ Mobile Authentication service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Mobile Auth service:', error);
      throw error;
    }
  }

  /**
   * Register a new device
   * @param {Object} deviceInfo - Device information
   * @param {string} userAddress - User's wallet address
   */
  async registerDevice(deviceInfo, userAddress) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        deviceId,
        deviceName,
        deviceType,
        platform,
        appVersion,
        osVersion,
        deviceFingerprint,
        pushToken
      } = deviceInfo;

      // Check if device already exists
      let device = await Device.findOne({
        where: { deviceId, userAddress: userAddress.toLowerCase() }
      });

      if (device) {
        // Update existing device
        await device.update({
          deviceName,
          deviceType,
          platform,
          appVersion,
          osVersion,
          deviceFingerprint,
          pushToken,
          lastSeen: new Date(),
          isActive: true
        });
      } else {
        // Create new device
        device = await Device.create({
          deviceId,
          userAddress: userAddress.toLowerCase(),
          deviceName,
          deviceType,
          platform,
          appVersion,
          osVersion,
          deviceFingerprint,
          pushToken,
          isActive: true,
          isTrusted: false,
          lastSeen: new Date()
        });
      }

      console.log(`📱 Device registered: ${deviceId} for ${userAddress}`);
      return device.toJSON();

    } catch (error) {
      console.error('❌ Failed to register device:', error);
      throw error;
    }
  }

  /**
   * Send OTP to phone number or email
   * @param {string} identifier - Phone number or email
   * @param {string} purpose - Purpose of OTP
   * @param {string} deviceId - Device ID
   */
  async sendOTP(identifier, purpose, deviceId = null) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Generate 6-digit OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedCode = await bcrypt.hash(code, 10);

      // Set expiry time
      const expiresAt = new Date(Date.now() + (this.otpValidityMinutes * 60 * 1000));

      // Invalidate previous OTPs for this identifier and purpose
      await OTP.update(
        { isUsed: true },
        {
          where: {
            identifier: identifier.toLowerCase(),
            purpose,
            isUsed: false,
            expiresAt: { [Sequelize.Op.gt]: new Date() }
          }
        }
      );

      // Create new OTP
      const otp = await OTP.create({
        identifier: identifier.toLowerCase(),
        code: code.substring(0, 3) + '***', // Partially masked for security
        hashedCode,
        purpose,
        expiresAt,
        deviceId,
        maxAttempts: 3
      });

      // In a real implementation, you would send SMS/email here
      // For demo purposes, we'll just log it
      console.log(`📱 OTP sent to ${identifier}: ${code} (Purpose: ${purpose})`);

      // Return masked OTP info (never return actual code)
      return {
        otpId: otp.id,
        identifier: identifier.toLowerCase(),
        purpose,
        expiresAt: expiresAt.toISOString(),
        maskedCode: code.substring(0, 2) + '****',
        attemptsRemaining: 3
      };

    } catch (error) {
      console.error('❌ Failed to send OTP:', error);
      throw error;
    }
  }

  /**
   * Verify OTP
   * @param {string} identifier - Phone number or email
   * @param {string} code - OTP code
   * @param {string} purpose - Purpose of OTP
   * @param {string} deviceId - Device ID
   */
  async verifyOTP(identifier, code, purpose, deviceId = null) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Find latest unused OTP
      const otp = await OTP.findOne({
        where: {
          identifier: identifier.toLowerCase(),
          purpose,
          isUsed: false,
          expiresAt: { [Sequelize.Op.gt]: new Date() }
        },
        order: [['createdAt', 'DESC']]
      });

      if (!otp) {
        throw new Error('OTP not found or expired');
      }

      // Check attempt limits
      if (otp.attempts >= otp.maxAttempts) {
        await otp.update({ isUsed: true });
        throw new Error('Maximum OTP attempts exceeded');
      }

      // Verify OTP code
      const isValid = await bcrypt.compare(code, otp.hashedCode);

      if (!isValid) {
        await otp.update({ attempts: otp.attempts + 1 });
        const remainingAttempts = otp.maxAttempts - (otp.attempts + 1);
        throw new Error(`Invalid OTP. ${remainingAttempts} attempts remaining`);
      }

      // Mark OTP as used
      await otp.update({ isUsed: true, attempts: otp.attempts + 1 });

      console.log(`✅ OTP verified for ${identifier} (Purpose: ${purpose})`);
      return {
        success: true,
        identifier: identifier.toLowerCase(),
        purpose,
        verifiedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Failed to verify OTP:', error);
      throw error;
    }
  }

  /**
   * Create mobile session with tokens
   * @param {string} userAddress - User's wallet address
   * @param {string} deviceId - Device ID
   * @param {Object} sessionContext - Additional session context
   */
  async createSession(userAddress, deviceId, sessionContext = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Verify device exists and is active
      const device = await Device.findOne({
        where: {
          deviceId,
          userAddress: userAddress.toLowerCase(),
          isActive: true
        }
      });

      if (!device) {
        throw new Error('Device not found or inactive');
      }

      // Generate tokens
      const sessionToken = jwt.sign(
        {
          userAddress: userAddress.toLowerCase(),
          deviceId,
          type: 'mobile_session',
          iat: Math.floor(Date.now() / 1000)
        },
        this.jwtSecret,
        { expiresIn: `${this.sessionValidityHours}h` }
      );

      const refreshToken = jwt.sign(
        {
          userAddress: userAddress.toLowerCase(),
          deviceId,
          type: 'mobile_refresh',
          iat: Math.floor(Date.now() / 1000)
        },
        this.refreshSecret,
        { expiresIn: `${this.refreshValidityDays}d` }
      );

      // Calculate expiry times
      const expiresAt = new Date(Date.now() + (this.sessionValidityHours * 60 * 60 * 1000));
      const refreshExpiresAt = new Date(Date.now() + (this.refreshValidityDays * 24 * 60 * 60 * 1000));

      // Invalidate previous sessions for this device
      await MobileSession.update(
        { isActive: false },
        {
          where: {
            deviceId,
            userAddress: userAddress.toLowerCase(),
            isActive: true
          }
        }
      );

      // Create new session
      const session = await MobileSession.create({
        sessionToken,
        deviceId,
        userAddress: userAddress.toLowerCase(),
        refreshToken,
        expiresAt,
        refreshExpiresAt,
        ipAddress: sessionContext.ipAddress,
        userAgent: sessionContext.userAgent,
        sessionData: sessionContext.sessionData || {}
      });

      // Update device last seen
      await device.update({ lastSeen: new Date() });

      console.log(`📱 Mobile session created for ${userAddress} on device ${deviceId}`);

      return {
        sessionToken,
        refreshToken,
        expiresAt: expiresAt.toISOString(),
        refreshExpiresAt: refreshExpiresAt.toISOString(),
        deviceId,
        userAddress: userAddress.toLowerCase(),
        deviceTrusted: device.isTrusted
      };

    } catch (error) {
      console.error('❌ Failed to create mobile session:', error);
      throw error;
    }
  }

  /**
   * Refresh mobile session tokens
   * @param {string} refreshToken - Current refresh token
   */
  async refreshSession(refreshToken) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.refreshSecret);

      // Find session
      const session = await MobileSession.findOne({
        where: {
          refreshToken,
          isActive: true,
          refreshExpiresAt: { [Sequelize.Op.gt]: new Date() }
        }
      });

      if (!session) {
        throw new Error('Invalid or expired refresh token');
      }

      // Verify device is still active
      const device = await Device.findOne({
        where: {
          deviceId: session.deviceId,
          userAddress: session.userAddress,
          isActive: true
        }
      });

      if (!device) {
        await session.update({ isActive: false });
        throw new Error('Device is no longer active');
      }

      // Generate new tokens
      const newSessionToken = jwt.sign(
        {
          userAddress: session.userAddress,
          deviceId: session.deviceId,
          type: 'mobile_session',
          iat: Math.floor(Date.now() / 1000)
        },
        this.jwtSecret,
        { expiresIn: `${this.sessionValidityHours}h` }
      );

      const newRefreshToken = jwt.sign(
        {
          userAddress: session.userAddress,
          deviceId: session.deviceId,
          type: 'mobile_refresh',
          iat: Math.floor(Date.now() / 1000)
        },
        this.refreshSecret,
        { expiresIn: `${this.refreshValidityDays}d` }
      );

      // Calculate new expiry times
      const expiresAt = new Date(Date.now() + (this.sessionValidityHours * 60 * 60 * 1000));
      const refreshExpiresAt = new Date(Date.now() + (this.refreshValidityDays * 24 * 60 * 60 * 1000));

      // Update session
      await session.update({
        sessionToken: newSessionToken,
        refreshToken: newRefreshToken,
        expiresAt,
        refreshExpiresAt
      });

      // Update device last seen
      await device.update({ lastSeen: new Date() });

      console.log(`🔄 Mobile session refreshed for ${session.userAddress}`);

      return {
        sessionToken: newSessionToken,
        refreshToken: newRefreshToken,
        expiresAt: expiresAt.toISOString(),
        refreshExpiresAt: refreshExpiresAt.toISOString(),
        deviceId: session.deviceId,
        userAddress: session.userAddress
      };

    } catch (error) {
      console.error('❌ Failed to refresh mobile session:', error);
      throw error;
    }
  }

  /**
   * Validate mobile session token
   * @param {string} sessionToken - Session token to validate
   */
  async validateSession(sessionToken) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Verify JWT token
      const decoded = jwt.verify(sessionToken, this.jwtSecret);

      // Find session in database
      const session = await MobileSession.findOne({
        where: {
          sessionToken,
          isActive: true,
          expiresAt: { [Sequelize.Op.gt]: new Date() }
        },
        include: [{
          model: Device,
          as: 'device',
          where: { isActive: true }
        }]
      });

      if (!session) {
        throw new Error('Invalid or expired session');
      }

      return {
        valid: true,
        userAddress: session.userAddress,
        deviceId: session.deviceId,
        sessionData: session.sessionData,
        device: session.device || null
      };

    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Set up two-factor authentication
   * @param {string} userAddress - User's wallet address
   * @param {string} deviceId - Device ID
   */
  async setupTwoFactor(userAddress, deviceId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `BharatChain (${userAddress})`,
        issuer: 'BharatChain Gov',
        length: 32
      });

      // Generate backup codes
      const backupCodes = [];
      for (let i = 0; i < 10; i++) {
        backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
      }

      // Generate QR code for authenticator apps
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      // Check if 2FA already exists
      let twoFactor = await TwoFactorAuth.findOne({
        where: { userAddress: userAddress.toLowerCase() }
      });

      if (twoFactor) {
        // Update existing 2FA
        await twoFactor.update({
          secret: secret.base32,
          backupCodes: backupCodes.map(code => ({ code, used: false })),
          qrCodeUrl,
          isEnabled: false // User needs to verify to enable
        });
      } else {
        // Create new 2FA
        twoFactor = await TwoFactorAuth.create({
          userAddress: userAddress.toLowerCase(),
          secret: secret.base32,
          backupCodes: backupCodes.map(code => ({ code, used: false })),
          qrCodeUrl,
          isEnabled: false
        });
      }

      return {
        secret: secret.base32,
        qrCodeUrl,
        backupCodes,
        manualEntryKey: secret.base32
      };

    } catch (error) {
      console.error('❌ Failed to setup 2FA:', error);
      throw error;
    }
  }

  /**
   * Verify two-factor authentication token
   * @param {string} userAddress - User's wallet address
   * @param {string} token - 2FA token
   * @param {boolean} isBackupCode - Whether this is a backup code
   */
  async verifyTwoFactor(userAddress, token, isBackupCode = false) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const twoFactor = await TwoFactorAuth.findOne({
        where: { userAddress: userAddress.toLowerCase() }
      });

      if (!twoFactor) {
        throw new Error('Two-factor authentication not set up');
      }

      let isValid = false;

      if (isBackupCode) {
        // Verify backup code
        const backupCode = twoFactor.backupCodes.find(
          bc => bc.code === token.toUpperCase() && !bc.used
        );

        if (backupCode) {
          // Mark backup code as used
          backupCode.used = true;
          await twoFactor.update({ backupCodes: twoFactor.backupCodes });
          isValid = true;
        }
      } else {
        // Verify TOTP token
        isValid = speakeasy.totp.verify({
          secret: twoFactor.secret,
          encoding: 'base32',
          token,
          window: 2 // Allow 60 seconds tolerance
        });
      }

      if (isValid) {
        await twoFactor.update({
          lastUsed: new Date(),
          isEnabled: true // Enable 2FA after first successful verification
        });
      }

      return { valid: isValid };

    } catch (error) {
      console.error('❌ Failed to verify 2FA:', error);
      throw error;
    }
  }

  /**
   * Logout from mobile session
   * @param {string} sessionToken - Session token
   */
  async logout(sessionToken) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      await MobileSession.update(
        { isActive: false },
        { where: { sessionToken } }
      );

      console.log('📱 Mobile session logged out');
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to logout mobile session:', error);
      throw error;
    }
  }

  /**
   * Get user's devices
   * @param {string} userAddress - User's wallet address
   */
  async getUserDevices(userAddress) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const devices = await Device.findAll({
        where: { userAddress: userAddress.toLowerCase() },
        order: [['lastSeen', 'DESC']],
        attributes: [
          'id', 'deviceId', 'deviceName', 'deviceType', 'platform',
          'appVersion', 'osVersion', 'isActive', 'isTrusted',
          'lastSeen', 'createdAt', 'securitySettings'
        ]
      });

      return devices.map(device => device.toJSON());

    } catch (error) {
      console.error('❌ Failed to get user devices:', error);
      throw error;
    }
  }

  /**
   * Clean up expired data
   */
  async cleanupExpiredData() {
    try {
      const now = new Date();

      // Cleanup expired sessions
      const expiredSessions = await MobileSession.update(
        { isActive: false },
        {
          where: {
            [Sequelize.Op.or]: [
              { expiresAt: { [Sequelize.Op.lt]: now } },
              { refreshExpiresAt: { [Sequelize.Op.lt]: now } }
            ],
            isActive: true
          }
        }
      );

      // Cleanup expired OTPs
      const expiredOTPs = await OTP.update(
        { isUsed: true },
        {
          where: {
            expiresAt: { [Sequelize.Op.lt]: now },
            isUsed: false
          }
        }
      );

      if (expiredSessions[0] > 0 || expiredOTPs[0] > 0) {
        console.log(`🧹 Mobile auth cleanup: ${expiredSessions[0]} sessions, ${expiredOTPs[0]} OTPs expired`);
      }

    } catch (error) {
      console.error('❌ Failed to cleanup expired mobile auth data:', error);
    }
  }

  /**
   * Get mobile auth statistics
   */
  async getStatistics() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const [deviceStats, sessionStats, otpStats, twoFactorStats] = await Promise.all([
        Device.findAll({
          attributes: [
            'deviceType',
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
            [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN isActive = 1 THEN 1 ELSE 0 END')), 'active']
          ],
          group: ['deviceType'],
          raw: true
        }),
        MobileSession.count({ where: { isActive: true } }),
        OTP.count({ where: { isUsed: false, expiresAt: { [Sequelize.Op.gt]: new Date() } } }),
        TwoFactorAuth.count({ where: { isEnabled: true } })
      ]);

      return {
        devices: {
          total: await Device.count(),
          active: await Device.count({ where: { isActive: true } }),
          trusted: await Device.count({ where: { isTrusted: true } }),
          byType: deviceStats.reduce((acc, stat) => {
            acc[stat.deviceType] = {
              total: parseInt(stat.count),
              active: parseInt(stat.active) || 0
            };
            return acc;
          }, {})
        },
        sessions: {
          active: sessionStats
        },
        otps: {
          pending: otpStats
        },
        twoFactor: {
          enabled: twoFactorStats
        },
        isInitialized: this.initialized
      };

    } catch (error) {
      console.error('❌ Failed to get mobile auth statistics:', error);
      return {
        devices: { total: 0, active: 0, trusted: 0, byType: {} },
        sessions: { active: 0 },
        otps: { pending: 0 },
        twoFactor: { enabled: 0 },
        isInitialized: this.initialized
      };
    }
  }
}

// Create singleton instance
const mobileAuthService = new MobileAuthService();

module.exports = mobileAuthService;