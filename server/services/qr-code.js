const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const crypto = require('crypto-js');
const { v4: uuidv4 } = require('uuid');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Initialize database for QR codes
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/qrcodes.db'),
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// QR Code model
const QRCodeToken = sequelize.define('QRCodeToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tokenId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    index: true
  },
  entityType: {
    type: DataTypes.ENUM('document', 'grievance', 'citizen_profile', 'verification', 'payment', 'service_access'),
    allowNull: false,
    index: true
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  ownerAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  purpose: {
    type: DataTypes.ENUM('share', 'verify', 'authenticate', 'pay', 'access'),
    allowNull: false
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    index: true
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  maxUsage: {
    type: DataTypes.INTEGER,
    defaultValue: null // null means unlimited
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastUsedBy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  accessLog: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  tableName: 'qr_code_tokens',
  timestamps: true,
  indexes: [
    { fields: ['tokenId'] },
    { fields: ['entityType', 'entityId'] },
    { fields: ['ownerAddress'] },
    { fields: ['expiresAt'] },
    { fields: ['isActive'] }
  ]
});

class QRCodeService {
  constructor() {
    this.initialized = false;
    this.jwtSecret = process.env.JWT_SECRET || 'bharatchain-qr-secret-key-2025';
    this.baseUrl = process.env.BASE_URL || 'https://bharatchain.gov.in';
  }

  /**
   * Initialize QR code service
   */
  async initialize() {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ alter: true });
      
      // Clean up expired tokens
      await this.cleanupExpiredTokens();
      
      this.initialized = true;
      console.log('✅ QR Code service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize QR Code service:', error);
      throw error;
    }
  }

  /**
   * Generate QR code for entity
   * @param {string} entityType - Type of entity (document, grievance, citizen_profile, etc.)
   * @param {string} entityId - ID of the entity
   * @param {string} ownerAddress - Owner's wallet address
   * @param {string} purpose - Purpose of QR code (share, verify, authenticate, etc.)
   * @param {Object} options - Additional options
   */
  async generateQRCode(entityType, entityId, ownerAddress, purpose, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        permissions = [],
        metadata = {},
        expiryHours = 24,
        maxUsage = null,
        qrCodeOptions = {}
      } = options;

      // Generate unique token ID
      const tokenId = uuidv4();
      
      // Calculate expiry time
      const expiresAt = new Date(Date.now() + (expiryHours * 60 * 60 * 1000));

      // Create token record
      const qrToken = await QRCodeToken.create({
        tokenId,
        entityType,
        entityId,
        ownerAddress: ownerAddress.toLowerCase(),
        purpose,
        permissions,
        metadata,
        expiresAt,
        maxUsage
      });

      // Create JWT payload
      const jwtPayload = {
        tokenId,
        entityType,
        entityId,
        purpose,
        permissions,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(expiresAt.getTime() / 1000)
      };

      // Generate JWT token
      const jwtToken = jwt.sign(jwtPayload, this.jwtSecret);

      // Create QR code data
      const qrData = {
        version: '1.0',
        platform: 'BharatChain',
        action: 'scan',
        token: jwtToken,
        url: `${this.baseUrl}/mobile/qr/${tokenId}`,
        timestamp: new Date().toISOString()
      };

      // Generate QR code image
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256,
        ...qrCodeOptions
      });

      // Log QR code generation
      console.log(`📱 QR code generated for ${entityType} ${entityId} by ${ownerAddress}`);

      return {
        tokenId,
        qrCodeDataURL,
        qrCodeData: JSON.stringify(qrData),
        expiresAt: expiresAt.toISOString(),
        scanUrl: `${this.baseUrl}/mobile/qr/${tokenId}`,
        permissions,
        maxUsage,
        purpose
      };

    } catch (error) {
      console.error('❌ Failed to generate QR code:', error);
      throw error;
    }
  }

  /**
   * Scan and validate QR code
   * @param {string} qrData - QR code data (JSON string or token ID)
   * @param {string} scannerAddress - Address of the scanner
   * @param {Object} scanContext - Additional scan context
   */
  async scanQRCode(qrData, scannerAddress, scanContext = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      let tokenId;
      let parsedData;

      // Try to parse QR data
      try {
        parsedData = JSON.parse(qrData);
        if (parsedData.token) {
          // Extract token from JWT
          const decoded = jwt.verify(parsedData.token, this.jwtSecret);
          tokenId = decoded.tokenId;
        } else {
          throw new Error('Invalid QR code format');
        }
      } catch (parseError) {
        // Assume it's a direct token ID
        tokenId = qrData;
      }

      // Find token in database
      const qrToken = await QRCodeToken.findOne({
        where: { tokenId, isActive: true }
      });

      if (!qrToken) {
        throw new Error('QR code not found or inactive');
      }

      // Check expiry
      if (new Date() > qrToken.expiresAt) {
        await qrToken.update({ isActive: false });
        throw new Error('QR code has expired');
      }

      // Check usage limits
      if (qrToken.maxUsage && qrToken.usageCount >= qrToken.maxUsage) {
        await qrToken.update({ isActive: false });
        throw new Error('QR code usage limit exceeded');
      }

      // Check permissions (if scanner is not owner)
      if (scannerAddress.toLowerCase() !== qrToken.ownerAddress.toLowerCase()) {
        if (!this.checkPermissions(qrToken.permissions, scannerAddress, qrToken.purpose)) {
          throw new Error('Insufficient permissions to scan this QR code');
        }
      }

      // Get entity data based on type
      const entityData = await this.getEntityData(qrToken.entityType, qrToken.entityId, scannerAddress);

      // Update usage statistics
      const accessEntry = {
        scannerAddress: scannerAddress.toLowerCase(),
        scanTime: new Date().toISOString(),
        context: scanContext,
        ipAddress: scanContext.ipAddress || null,
        userAgent: scanContext.userAgent || null
      };

      const updatedAccessLog = [...(qrToken.accessLog || []), accessEntry];

      await qrToken.update({
        usageCount: qrToken.usageCount + 1,
        lastUsedAt: new Date(),
        lastUsedBy: scannerAddress.toLowerCase(),
        accessLog: updatedAccessLog.slice(-50) // Keep last 50 access logs
      });

      const result = {
        success: true,
        tokenId,
        entityType: qrToken.entityType,
        entityId: qrToken.entityId,
        purpose: qrToken.purpose,
        ownerAddress: qrToken.ownerAddress,
        entityData,
        metadata: qrToken.metadata,
        scanTime: new Date().toISOString(),
        usageCount: qrToken.usageCount + 1,
        maxUsage: qrToken.maxUsage,
        permissions: qrToken.permissions
      };

      console.log(`📱 QR code scanned: ${tokenId} by ${scannerAddress}`);
      return result;

    } catch (error) {
      console.error('❌ Failed to scan QR code:', error);
      return {
        success: false,
        error: error.message,
        scanTime: new Date().toISOString()
      };
    }
  }

  /**
   * Get entity data based on type
   * @param {string} entityType - Type of entity
   * @param {string} entityId - ID of the entity
   * @param {string} requestorAddress - Address making the request
   */
  async getEntityData(entityType, entityId, requestorAddress) {
    try {
      // This would integrate with your existing services
      // For now, return basic information based on entity type
      
      switch (entityType) {
        case 'document':
          return {
            id: entityId,
            type: 'document',
            title: 'Government Document',
            status: 'verified',
            lastUpdated: new Date().toISOString(),
            // Add actual document data from blockchain/database
            placeholder: 'Document data would be fetched from blockchain service'
          };

        case 'grievance':
          return {
            id: entityId,
            type: 'grievance',
            title: 'Citizen Grievance',
            status: 'in_progress',
            category: 'public_services',
            lastUpdated: new Date().toISOString(),
            // Add actual grievance data from blockchain/database
            placeholder: 'Grievance data would be fetched from blockchain service'
          };

        case 'citizen_profile':
          return {
            id: entityId,
            type: 'citizen_profile',
            name: 'Citizen Profile',
            verified: true,
            registrationDate: new Date().toISOString(),
            // Add actual citizen data from blockchain/database
            placeholder: 'Citizen data would be fetched from blockchain service'
          };

        case 'verification':
          return {
            id: entityId,
            type: 'verification',
            verificationStatus: 'valid',
            issuedBy: 'Government Authority',
            issuedAt: new Date().toISOString(),
            // Add actual verification data
            placeholder: 'Verification data would be fetched from verification service'
          };

        default:
          return {
            id: entityId,
            type: entityType,
            message: 'Entity data available',
            lastUpdated: new Date().toISOString()
          };
      }
    } catch (error) {
      console.error(`❌ Failed to get entity data for ${entityType} ${entityId}:`, error);
      return {
        id: entityId,
        type: entityType,
        error: 'Failed to fetch entity data',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check permissions for QR code access
   * @param {Array} permissions - Array of permission objects
   * @param {string} scannerAddress - Address of the scanner
   * @param {string} purpose - Purpose of the QR code
   */
  checkPermissions(permissions, scannerAddress, purpose) {
    if (!permissions || permissions.length === 0) {
      return true; // No specific permissions means public access
    }

    // Check if scanner address is in allowed addresses
    const hasAddressPermission = permissions.some(perm => 
      perm.type === 'address' && 
      perm.value.toLowerCase() === scannerAddress.toLowerCase()
    );

    // Check if scanner has role-based permission
    const hasRolePermission = permissions.some(perm => 
      perm.type === 'role' && 
      this.checkUserRole(scannerAddress, perm.value)
    );

    // Check if purpose matches allowed purposes
    const hasPurposePermission = permissions.some(perm => 
      perm.type === 'purpose' && 
      perm.value === purpose
    );

    return hasAddressPermission || hasRolePermission || hasPurposePermission;
  }

  /**
   * Check user role (placeholder - would integrate with your auth system)
   * @param {string} userAddress - User's address
   * @param {string} role - Role to check
   */
  checkUserRole(userAddress, role) {
    // This would integrate with your existing role/permission system
    // For now, return basic role checks
    const officerAddresses = [
      '0x123456789abcdef123456789abcdef123456789a', // Example officer addresses
      '0x987654321fedcba987654321fedcba987654321'
    ];

    switch (role) {
      case 'officer':
        return officerAddresses.includes(userAddress.toLowerCase());
      case 'citizen':
        return true; // All addresses are considered citizens
      case 'admin':
        return userAddress.toLowerCase() === '0x742d35cc6635c0532925a3b8d07376f0c9ff4c52';
      default:
        return false;
    }
  }

  /**
   * Revoke QR code
   * @param {string} tokenId - Token ID to revoke
   * @param {string} ownerAddress - Owner's address
   */
  async revokeQRCode(tokenId, ownerAddress) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const qrToken = await QRCodeToken.findOne({
        where: { 
          tokenId, 
          ownerAddress: ownerAddress.toLowerCase(),
          isActive: true 
        }
      });

      if (!qrToken) {
        throw new Error('QR code not found or not owned by user');
      }

      await qrToken.update({ 
        isActive: false,
        metadata: {
          ...qrToken.metadata,
          revokedAt: new Date().toISOString(),
          revokedBy: ownerAddress.toLowerCase()
        }
      });

      console.log(`📱 QR code revoked: ${tokenId} by ${ownerAddress}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to revoke QR code:', error);
      throw error;
    }
  }

  /**
   * Get QR code usage statistics
   * @param {string} tokenId - Token ID
   * @param {string} ownerAddress - Owner's address
   */
  async getQRCodeStats(tokenId, ownerAddress) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const qrToken = await QRCodeToken.findOne({
        where: { 
          tokenId, 
          ownerAddress: ownerAddress.toLowerCase() 
        }
      });

      if (!qrToken) {
        throw new Error('QR code not found or not owned by user');
      }

      return {
        tokenId,
        entityType: qrToken.entityType,
        entityId: qrToken.entityId,
        purpose: qrToken.purpose,
        usageCount: qrToken.usageCount,
        maxUsage: qrToken.maxUsage,
        isActive: qrToken.isActive,
        createdAt: qrToken.createdAt,
        expiresAt: qrToken.expiresAt,
        lastUsedAt: qrToken.lastUsedAt,
        lastUsedBy: qrToken.lastUsedBy,
        accessLog: qrToken.accessLog || [],
        uniqueScanners: [...new Set((qrToken.accessLog || []).map(log => log.scannerAddress))].length
      };

    } catch (error) {
      console.error('❌ Failed to get QR code stats:', error);
      throw error;
    }
  }

  /**
   * List user's QR codes
   * @param {string} ownerAddress - Owner's address
   * @param {Object} options - Query options
   */
  async listUserQRCodes(ownerAddress, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        entityType = null,
        purpose = null,
        isActive = null,
        limit = 50,
        offset = 0
      } = options;

      const whereClause = {
        ownerAddress: ownerAddress.toLowerCase()
      };

      if (entityType) whereClause.entityType = entityType;
      if (purpose) whereClause.purpose = purpose;
      if (isActive !== null) whereClause.isActive = isActive;

      const qrCodes = await QRCodeToken.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        attributes: [
          'tokenId', 'entityType', 'entityId', 'purpose', 
          'usageCount', 'maxUsage', 'isActive', 'createdAt', 
          'expiresAt', 'lastUsedAt'
        ]
      });

      return qrCodes.map(qr => qr.toJSON());

    } catch (error) {
      console.error('❌ Failed to list QR codes:', error);
      throw error;
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens() {
    try {
      const expiredCount = await QRCodeToken.update(
        { isActive: false },
        {
          where: {
            expiresAt: {
              [Sequelize.Op.lt]: new Date()
            },
            isActive: true
          }
        }
      );

      // Delete very old expired tokens (older than 90 days)
      const ninetyDaysAgo = new Date(Date.now() - (90 * 24 * 60 * 60 * 1000));
      const deletedCount = await QRCodeToken.destroy({
        where: {
          expiresAt: {
            [Sequelize.Op.lt]: ninetyDaysAgo
          },
          isActive: false
        }
      });

      if (expiredCount[0] > 0 || deletedCount > 0) {
        console.log(`🧹 QR cleanup: ${expiredCount[0]} expired, ${deletedCount} deleted`);
      }

    } catch (error) {
      console.error('❌ Failed to cleanup expired QR codes:', error);
    }
  }

  /**
   * Get QR code service statistics
   */
  async getStatistics() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const [totalStats, activeStats, purposeStats, entityStats] = await Promise.all([
        QRCodeToken.count(),
        QRCodeToken.count({ where: { isActive: true } }),
        QRCodeToken.findAll({
          attributes: [
            'purpose',
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
            [Sequelize.fn('SUM', Sequelize.col('usageCount')), 'totalUsage']
          ],
          group: ['purpose'],
          raw: true
        }),
        QRCodeToken.findAll({
          attributes: [
            'entityType',
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
          ],
          group: ['entityType'],
          raw: true
        })
      ]);

      return {
        total: totalStats,
        active: activeStats,
        expired: totalStats - activeStats,
        byPurpose: purposeStats.reduce((acc, stat) => {
          acc[stat.purpose] = {
            count: parseInt(stat.count),
            totalUsage: parseInt(stat.totalUsage) || 0
          };
          return acc;
        }, {}),
        byEntityType: entityStats.reduce((acc, stat) => {
          acc[stat.entityType] = parseInt(stat.count);
          return acc;
        }, {}),
        isInitialized: this.initialized
      };

    } catch (error) {
      console.error('❌ Failed to get QR code statistics:', error);
      return {
        total: 0,
        active: 0,
        expired: 0,
        byPurpose: {},
        byEntityType: {},
        isInitialized: this.initialized
      };
    }
  }
}

// Create singleton instance
const qrCodeService = new QRCodeService();

module.exports = qrCodeService;