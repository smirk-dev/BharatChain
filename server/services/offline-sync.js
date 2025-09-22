const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const crypto = require('crypto');

// Initialize database for offline sync
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/offline_sync.db'),
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Sync Queue model - tracks changes to be synced
const SyncQueue = sequelize.define('SyncQueue', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  deviceId: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  entityType: {
    type: DataTypes.ENUM('document', 'grievance', 'citizen_profile', 'notification', 'chat_message', 'configuration'),
    allowNull: false,
    index: true
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  operation: {
    type: DataTypes.ENUM('create', 'update', 'delete'),
    allowNull: false,
    index: true
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    index: true,
    comment: '1=highest, 10=lowest priority'
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'The actual data to sync'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional metadata like file paths, references'
  },
  status: {
    type: DataTypes.ENUM('pending', 'syncing', 'completed', 'failed', 'conflict'),
    defaultValue: 'pending',
    index: true
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  maxAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  lastAttemptAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  conflictData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Server data that conflicts with local changes'
  },
  checksum: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Hash of data for conflict detection'
  },
  lastModified: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    index: true
  }
}, {
  tableName: 'sync_queue',
  timestamps: true,
  indexes: [
    { fields: ['userAddress'] },
    { fields: ['deviceId'] },
    { fields: ['entityType', 'entityId'] },
    { fields: ['status'] },
    { fields: ['priority'] },
    { fields: ['lastModified'] },
    { unique: true, fields: ['deviceId', 'entityType', 'entityId', 'operation'] }
  ]
});

// Offline Cache model - stores data for offline access
const OfflineCache = sequelize.define('OfflineCache', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  deviceId: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  cacheKey: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  entityType: {
    type: DataTypes.ENUM('document', 'grievance', 'citizen_profile', 'notification', 'chat_message', 'configuration', 'file'),
    allowNull: false,
    index: true
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  isStale: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    index: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    index: true
  },
  lastSyncAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    comment: 'Cache priority for cleanup'
  },
  accessCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastAccessAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  size: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Size in bytes'
  }
}, {
  tableName: 'offline_cache',
  timestamps: true,
  indexes: [
    { fields: ['userAddress'] },
    { fields: ['deviceId'] },
    { fields: ['cacheKey'] },
    { fields: ['entityType', 'entityId'] },
    { fields: ['isStale'] },
    { fields: ['expiresAt'] },
    { fields: ['lastAccessAt'] },
    { unique: true, fields: ['deviceId', 'cacheKey'] }
  ]
});

// Conflict Resolution model - tracks conflicts and resolutions
const ConflictResolution = sequelize.define('ConflictResolution', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  syncQueueId: {
    type: DataTypes.UUID,
    allowNull: false,
    index: true
  },
  userAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  deviceId: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  conflictType: {
    type: DataTypes.ENUM('data_mismatch', 'version_conflict', 'delete_conflict', 'permission_conflict'),
    allowNull: false,
    index: true
  },
  localData: {
    type: DataTypes.JSON,
    allowNull: false
  },
  serverData: {
    type: DataTypes.JSON,
    allowNull: false
  },
  resolution: {
    type: DataTypes.ENUM('use_local', 'use_server', 'merge', 'manual', 'skip'),
    allowNull: true,
    index: true
  },
  resolvedData: {
    type: DataTypes.JSON,
    allowNull: true
  },
  isResolved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    index: true
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolvedBy: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'user or system'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'conflict_resolutions',
  timestamps: true,
  indexes: [
    { fields: ['syncQueueId'] },
    { fields: ['userAddress'] },
    { fields: ['deviceId'] },
    { fields: ['conflictType'] },
    { fields: ['isResolved'] }
  ]
});

// Sync Session model - tracks sync sessions
const SyncSession = sequelize.define('SyncSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  deviceId: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('started', 'completed', 'failed', 'cancelled'),
    defaultValue: 'started',
    index: true
  },
  totalItems: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  processedItems: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  successfulItems: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  failedItems: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  conflictItems: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  bytesTransferred: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  },
  errorMessages: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'sync_sessions',
  timestamps: true,
  indexes: [
    { fields: ['userAddress'] },
    { fields: ['deviceId'] },
    { fields: ['status'] },
    { fields: ['startTime'] }
  ]
});

class OfflineSyncService {
  constructor() {
    this.initialized = false;
    this.activeSessions = new Map();
    this.syncIntervals = new Map();
    this.maxCacheSize = 100 * 1024 * 1024; // 100MB per device
    this.defaultCacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
  }

  /**
   * Initialize offline sync service
   */
  async initialize() {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ alter: true });
      
      // Clean up expired cache and old sessions
      await this.cleanupExpiredData();
      
      // Resume any incomplete sync sessions
      await this.resumeIncompleteSessions();
      
      this.initialized = true;
      console.log('✅ Offline Sync service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Offline Sync service:', error);
      throw error;
    }
  }

  /**
   * Add item to sync queue
   * @param {string} userAddress - User's wallet address
   * @param {string} deviceId - Device ID
   * @param {string} entityType - Type of entity
   * @param {string} entityId - Entity ID
   * @param {string} operation - Operation (create/update/delete)
   * @param {Object} data - Data to sync
   * @param {Object} options - Additional options
   */
  async addToSyncQueue(userAddress, deviceId, entityType, entityId, operation, data, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        priority = 5,
        metadata = {},
        maxAttempts = 3
      } = options;

      // Generate checksum for conflict detection
      const checksum = this.generateChecksum(data);

      // Check if item already exists in queue
      const existing = await SyncQueue.findOne({
        where: {
          deviceId,
          entityType,
          entityId,
          operation,
          status: ['pending', 'syncing']
        }
      });

      if (existing) {
        // Update existing item
        await existing.update({
          data,
          metadata,
          priority,
          checksum,
          lastModified: new Date(),
          status: 'pending',
          attempts: 0,
          errorMessage: null
        });

        console.log(`📱 Updated sync queue item: ${entityType} ${entityId} for ${userAddress}`);
        return existing.toJSON();
      } else {
        // Create new item
        const syncItem = await SyncQueue.create({
          userAddress: userAddress.toLowerCase(),
          deviceId,
          entityType,
          entityId,
          operation,
          priority,
          data,
          metadata,
          maxAttempts,
          checksum
        });

        console.log(`📱 Added to sync queue: ${entityType} ${entityId} for ${userAddress}`);
        return syncItem.toJSON();
      }

    } catch (error) {
      console.error('❌ Failed to add to sync queue:', error);
      throw error;
    }
  }

  /**
   * Get sync queue for device
   * @param {string} deviceId - Device ID
   * @param {Object} options - Query options
   */
  async getSyncQueue(deviceId, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        status = null,
        entityType = null,
        limit = 100,
        offset = 0
      } = options;

      const whereClause = { deviceId };
      if (status) whereClause.status = status;
      if (entityType) whereClause.entityType = entityType;

      const syncItems = await SyncQueue.findAll({
        where: whereClause,
        order: [
          ['priority', 'ASC'],
          ['lastModified', 'ASC']
        ],
        limit,
        offset
      });

      return syncItems.map(item => item.toJSON());

    } catch (error) {
      console.error('❌ Failed to get sync queue:', error);
      throw error;
    }
  }

  /**
   * Process sync queue for device
   * @param {string} deviceId - Device ID
   * @param {string} userAddress - User's address
   */
  async processSyncQueue(deviceId, userAddress) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Check if sync session is already active
      if (this.activeSessions.has(deviceId)) {
        throw new Error('Sync session already active for this device');
      }

      // Create sync session
      const session = await SyncSession.create({
        userAddress: userAddress.toLowerCase(),
        deviceId,
        startTime: new Date(),
        status: 'started'
      });

      this.activeSessions.set(deviceId, session.id);

      try {
        // Get pending sync items
        const pendingItems = await SyncQueue.findAll({
          where: {
            deviceId,
            userAddress: userAddress.toLowerCase(),
            status: 'pending'
          },
          order: [
            ['priority', 'ASC'],
            ['lastModified', 'ASC']
          ],
          limit: 50 // Process in batches
        });

        await session.update({ totalItems: pendingItems.length });

        let successCount = 0;
        let failureCount = 0;
        let conflictCount = 0;
        let bytesTransferred = 0;
        const errors = [];

        // Process each item
        for (const item of pendingItems) {
          try {
            await item.update({ status: 'syncing', lastAttemptAt: new Date() });

            const result = await this.syncItem(item);

            if (result.success) {
              await item.update({
                status: 'completed',
                completedAt: new Date()
              });
              successCount++;
              bytesTransferred += result.bytesTransferred || 0;
            } else if (result.conflict) {
              await item.update({
                status: 'conflict',
                conflictData: result.conflictData
              });
              conflictCount++;
              
              // Create conflict resolution record
              await this.createConflictResolution(item, result);
            } else {
              throw new Error(result.error || 'Sync failed');
            }

          } catch (syncError) {
            await item.update({
              status: item.attempts >= item.maxAttempts ? 'failed' : 'pending',
              attempts: item.attempts + 1,
              errorMessage: syncError.message
            });

            failureCount++;
            errors.push({
              itemId: item.id,
              entityType: item.entityType,
              entityId: item.entityId,
              error: syncError.message
            });

            console.error(`❌ Sync failed for ${item.entityType} ${item.entityId}:`, syncError);
          }

          await session.update({
            processedItems: session.processedItems + 1,
            successfulItems: successCount,
            failedItems: failureCount,
            conflictItems: conflictCount,
            bytesTransferred,
            errorMessages: errors
          });
        }

        // Complete session
        await session.update({
          status: 'completed',
          endTime: new Date()
        });

        console.log(`✅ Sync session completed for ${deviceId}: ${successCount} success, ${failureCount} failed, ${conflictCount} conflicts`);

        return {
          sessionId: session.id,
          totalItems: pendingItems.length,
          successfulItems: successCount,
          failedItems: failureCount,
          conflictItems: conflictCount,
          bytesTransferred,
          errors
        };

      } catch (sessionError) {
        await session.update({
          status: 'failed',
          endTime: new Date(),
          errorMessages: [{ error: sessionError.message }]
        });
        throw sessionError;
      } finally {
        this.activeSessions.delete(deviceId);
      }

    } catch (error) {
      console.error('❌ Failed to process sync queue:', error);
      throw error;
    }
  }

  /**
   * Sync individual item (placeholder - would integrate with your API)
   * @param {Object} syncItem - Sync queue item
   */
  async syncItem(syncItem) {
    try {
      // This would integrate with your actual API endpoints
      // For now, simulate the sync process

      const { entityType, entityId, operation, data, checksum } = syncItem;

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate different scenarios
      const random = Math.random();

      if (random < 0.8) {
        // Success
        return {
          success: true,
          bytesTransferred: JSON.stringify(data).length
        };
      } else if (random < 0.9) {
        // Conflict
        return {
          success: false,
          conflict: true,
          conflictData: {
            serverData: { ...data, modifiedBy: 'another_user', lastModified: new Date() },
            conflictType: 'data_mismatch'
          }
        };
      } else {
        // Failure
        return {
          success: false,
          error: 'Network error or server unavailable'
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create conflict resolution record
   * @param {Object} syncItem - Sync queue item
   * @param {Object} conflictResult - Conflict data
   */
  async createConflictResolution(syncItem, conflictResult) {
    try {
      const conflict = await ConflictResolution.create({
        syncQueueId: syncItem.id,
        userAddress: syncItem.userAddress,
        deviceId: syncItem.deviceId,
        entityType: syncItem.entityType,
        entityId: syncItem.entityId,
        conflictType: conflictResult.conflictData.conflictType,
        localData: syncItem.data,
        serverData: conflictResult.conflictData.serverData
      });

      console.log(`⚠️ Conflict created for ${syncItem.entityType} ${syncItem.entityId}`);
      return conflict.toJSON();

    } catch (error) {
      console.error('❌ Failed to create conflict resolution:', error);
      throw error;
    }
  }

  /**
   * Cache data for offline access
   * @param {string} userAddress - User's address
   * @param {string} deviceId - Device ID
   * @param {string} cacheKey - Cache key
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {Object} data - Data to cache
   * @param {Object} options - Cache options
   */
  async cacheData(userAddress, deviceId, cacheKey, entityType, entityId, data, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        expiresAt = new Date(Date.now() + this.defaultCacheExpiry),
        priority = 5,
        metadata = {}
      } = options;

      const dataSize = JSON.stringify(data).length;

      // Check cache size limits
      await this.enforceCacheLimit(deviceId, dataSize);

      const [cacheItem, created] = await OfflineCache.findOrCreate({
        where: {
          deviceId,
          cacheKey
        },
        defaults: {
          userAddress: userAddress.toLowerCase(),
          entityType,
          entityId,
          data,
          metadata,
          expiresAt,
          priority,
          size: dataSize,
          accessCount: 1,
          lastAccessAt: new Date()
        }
      });

      if (!created) {
        await cacheItem.update({
          data,
          metadata,
          expiresAt,
          priority,
          size: dataSize,
          isStale: false,
          lastSyncAt: new Date(),
          accessCount: cacheItem.accessCount + 1,
          lastAccessAt: new Date()
        });
      }

      console.log(`💾 Cached data: ${cacheKey} for ${deviceId}`);
      return cacheItem.toJSON();

    } catch (error) {
      console.error('❌ Failed to cache data:', error);
      throw error;
    }
  }

  /**
   * Get cached data
   * @param {string} deviceId - Device ID
   * @param {string} cacheKey - Cache key
   */
  async getCachedData(deviceId, cacheKey) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const cacheItem = await OfflineCache.findOne({
        where: {
          deviceId,
          cacheKey,
          [Sequelize.Op.or]: [
            { expiresAt: null },
            { expiresAt: { [Sequelize.Op.gt]: new Date() } }
          ]
        }
      });

      if (!cacheItem) {
        return null;
      }

      // Update access stats
      await cacheItem.update({
        accessCount: cacheItem.accessCount + 1,
        lastAccessAt: new Date()
      });

      return {
        data: cacheItem.data,
        metadata: cacheItem.metadata,
        isStale: cacheItem.isStale,
        lastSyncAt: cacheItem.lastSyncAt,
        expiresAt: cacheItem.expiresAt
      };

    } catch (error) {
      console.error('❌ Failed to get cached data:', error);
      return null;
    }
  }

  /**
   * Mark cache as stale
   * @param {string} deviceId - Device ID
   * @param {string} cacheKey - Cache key or pattern
   */
  async markCacheStale(deviceId, cacheKey) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const whereClause = { deviceId };
      
      if (cacheKey.includes('*')) {
        // Pattern matching
        const pattern = cacheKey.replace(/\*/g, '%');
        whereClause.cacheKey = { [Sequelize.Op.like]: pattern };
      } else {
        whereClause.cacheKey = cacheKey;
      }

      const updatedCount = await OfflineCache.update(
        { isStale: true },
        { where: whereClause }
      );

      console.log(`📱 Marked ${updatedCount[0]} cache items as stale for ${deviceId}`);
      return updatedCount[0];

    } catch (error) {
      console.error('❌ Failed to mark cache as stale:', error);
      throw error;
    }
  }

  /**
   * Enforce cache size limits
   * @param {string} deviceId - Device ID
   * @param {number} newDataSize - Size of new data
   */
  async enforceCacheLimit(deviceId, newDataSize) {
    try {
      // Get current cache size
      const result = await OfflineCache.findOne({
        where: { deviceId },
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('size')), 'totalSize'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalItems']
        ],
        raw: true
      });

      const currentSize = parseInt(result.totalSize) || 0;
      
      if (currentSize + newDataSize > this.maxCacheSize) {
        // Clean up old items
        const itemsToDelete = await OfflineCache.findAll({
          where: { deviceId },
          order: [
            ['priority', 'DESC'], // Lower priority first
            ['lastAccessAt', 'ASC'], // Least recently accessed
            ['accessCount', 'ASC'] // Least accessed
          ],
          limit: 20
        });

        let sizeFreed = 0;
        const targetSize = currentSize + newDataSize - this.maxCacheSize;

        for (const item of itemsToDelete) {
          await item.destroy();
          sizeFreed += item.size;
          
          if (sizeFreed >= targetSize) {
            break;
          }
        }

        console.log(`🧹 Cache cleanup: freed ${sizeFreed} bytes for ${deviceId}`);
      }

    } catch (error) {
      console.error('❌ Failed to enforce cache limit:', error);
    }
  }

  /**
   * Get conflicts for resolution
   * @param {string} userAddress - User's address
   * @param {string} deviceId - Device ID
   */
  async getConflicts(userAddress, deviceId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const conflicts = await ConflictResolution.findAll({
        where: {
          userAddress: userAddress.toLowerCase(),
          deviceId,
          isResolved: false
        },
        order: [['createdAt', 'ASC']],
        include: [{
          model: SyncQueue,
          as: 'syncQueueItem'
        }]
      });

      return conflicts.map(conflict => conflict.toJSON());

    } catch (error) {
      console.error('❌ Failed to get conflicts:', error);
      throw error;
    }
  }

  /**
   * Resolve conflict
   * @param {string} conflictId - Conflict ID
   * @param {string} resolution - Resolution type
   * @param {Object} resolvedData - Resolved data
   * @param {string} resolvedBy - Who resolved it
   */
  async resolveConflict(conflictId, resolution, resolvedData = null, resolvedBy = 'user') {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const conflict = await ConflictResolution.findByPk(conflictId);
      if (!conflict) {
        throw new Error('Conflict not found');
      }

      const validResolutions = ['use_local', 'use_server', 'merge', 'manual', 'skip'];
      if (!validResolutions.includes(resolution)) {
        throw new Error(`Invalid resolution. Must be one of: ${validResolutions.join(', ')}`);
      }

      await conflict.update({
        resolution,
        resolvedData,
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy
      });

      // Update corresponding sync queue item
      const syncItem = await SyncQueue.findByPk(conflict.syncQueueId);
      if (syncItem) {
        if (resolution === 'skip') {
          await syncItem.update({ status: 'completed' });
        } else {
          await syncItem.update({
            status: 'pending',
            data: resolvedData || (resolution === 'use_local' ? conflict.localData : conflict.serverData),
            attempts: 0
          });
        }
      }

      console.log(`✅ Conflict resolved: ${conflictId} with ${resolution}`);
      return conflict.toJSON();

    } catch (error) {
      console.error('❌ Failed to resolve conflict:', error);
      throw error;
    }
  }

  /**
   * Clean up expired data
   */
  async cleanupExpiredData() {
    try {
      const now = new Date();

      // Clean up expired cache
      const expiredCacheCount = await OfflineCache.destroy({
        where: {
          expiresAt: { [Sequelize.Op.lt]: now }
        }
      });

      // Clean up old completed sync items
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      const oldSyncCount = await SyncQueue.destroy({
        where: {
          status: 'completed',
          completedAt: { [Sequelize.Op.lt]: thirtyDaysAgo }
        }
      });

      // Clean up old sync sessions
      const oldSessionCount = await SyncSession.destroy({
        where: {
          endTime: { [Sequelize.Op.lt]: thirtyDaysAgo }
        }
      });

      if (expiredCacheCount > 0 || oldSyncCount > 0 || oldSessionCount > 0) {
        console.log(`🧹 Offline sync cleanup: ${expiredCacheCount} cache, ${oldSyncCount} sync items, ${oldSessionCount} sessions`);
      }

    } catch (error) {
      console.error('❌ Failed to cleanup expired data:', error);
    }
  }

  /**
   * Resume incomplete sync sessions
   */
  async resumeIncompleteSessions() {
    try {
      const incompleteSessions = await SyncSession.findAll({
        where: {
          status: 'started'
        }
      });

      for (const session of incompleteSessions) {
        await session.update({
          status: 'failed',
          endTime: new Date(),
          errorMessages: [{ error: 'Session interrupted during startup' }]
        });
      }

      if (incompleteSessions.length > 0) {
        console.log(`🔄 Marked ${incompleteSessions.length} incomplete sync sessions as failed`);
      }

    } catch (error) {
      console.error('❌ Failed to resume incomplete sessions:', error);
    }
  }

  /**
   * Generate checksum for data
   * @param {Object} data - Data to hash
   */
  generateChecksum(data) {
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
  }

  /**
   * Get service statistics
   */
  async getStatistics() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const [
        totalSyncItems,
        pendingSyncItems,
        totalCacheItems,
        staleCacheItems,
        activeConflicts,
        activeSessions
      ] = await Promise.all([
        SyncQueue.count(),
        SyncQueue.count({ where: { status: 'pending' } }),
        OfflineCache.count(),
        OfflineCache.count({ where: { isStale: true } }),
        ConflictResolution.count({ where: { isResolved: false } }),
        SyncSession.count({ where: { status: 'started' } })
      ]);

      const cacheSize = await OfflineCache.findOne({
        attributes: [[Sequelize.fn('SUM', Sequelize.col('size')), 'totalSize']],
        raw: true
      });

      return {
        syncQueue: {
          total: totalSyncItems,
          pending: pendingSyncItems
        },
        cache: {
          total: totalCacheItems,
          stale: staleCacheItems,
          totalSize: parseInt(cacheSize.totalSize) || 0,
          maxSize: this.maxCacheSize
        },
        conflicts: {
          active: activeConflicts
        },
        sessions: {
          active: activeSessions,
          currentlyActive: this.activeSessions.size
        },
        isInitialized: this.initialized
      };

    } catch (error) {
      console.error('❌ Failed to get offline sync statistics:', error);
      return {
        syncQueue: { total: 0, pending: 0 },
        cache: { total: 0, stale: 0, totalSize: 0, maxSize: this.maxCacheSize },
        conflicts: { active: 0 },
        sessions: { active: 0, currentlyActive: 0 },
        isInitialized: this.initialized
      };
    }
  }
}

// Create singleton instance
const offlineSyncService = new OfflineSyncService();

module.exports = offlineSyncService;