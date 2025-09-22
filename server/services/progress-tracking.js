const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const realtimeEventService = require('./realtime-events');
const notificationService = require('./notification');

// Initialize database for progress tracking
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/progress.db'),
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Progress Tracker model
const ProgressTracker = sequelize.define('ProgressTracker', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  entityType: {
    type: DataTypes.ENUM('document', 'grievance', 'citizen_registration'),
    allowNull: false,
    index: true
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  userAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  currentStep: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalSteps: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  steps: {
    type: DataTypes.JSON,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending'
  },
  progress: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estimatedCompletionTime: {
    type: DataTypes.INTEGER, // minutes
    allowNull: true
  }
}, {
  tableName: 'progress_trackers',
  timestamps: true,
  indexes: [
    { fields: ['entityType', 'entityId'] },
    { fields: ['userAddress'] },
    { fields: ['status'] },
    { fields: ['createdAt'] }
  ]
});

class ProgressTrackingService {
  constructor() {
    this.initialized = false;
    this.progressTemplates = this.initializeProgressTemplates();
  }

  /**
   * Initialize progress tracking service
   */
  async initialize() {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ alter: true });
      
      // Clean up old completed progress trackers (older than 30 days)
      await this.cleanupOldTrackers();
      
      this.initialized = true;
      console.log('✅ Progress tracking service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize progress tracking service:', error);
      throw error;
    }
  }

  /**
   * Initialize progress templates for different entity types
   */
  initializeProgressTemplates() {
    return {
      document: {
        upload: {
          title: 'Document Upload',
          steps: [
            { name: 'File Validation', description: 'Validating file format and size', duration: 1 },
            { name: 'Security Scan', description: 'Scanning for malicious content', duration: 2 },
            { name: 'Blockchain Storage', description: 'Storing document hash on blockchain', duration: 3 },
            { name: 'IPFS Upload', description: 'Uploading to distributed storage', duration: 4 },
            { name: 'Completion', description: 'Document successfully uploaded', duration: 1 }
          ]
        },
        verification: {
          title: 'Document Verification',
          steps: [
            { name: 'Initial Review', description: 'Officer reviewing document details', duration: 1440 }, // 24 hours
            { name: 'Authenticity Check', description: 'Verifying document authenticity', duration: 720 }, // 12 hours
            { name: 'Compliance Review', description: 'Checking regulatory compliance', duration: 480 }, // 8 hours
            { name: 'Final Approval', description: 'Final verification and approval', duration: 240 }, // 4 hours
            { name: 'Blockchain Update', description: 'Updating verification status on blockchain', duration: 5 }
          ]
        }
      },
      grievance: {
        processing: {
          title: 'Grievance Processing',
          steps: [
            { name: 'Submission', description: 'Grievance submitted successfully', duration: 1 },
            { name: 'Initial Review', description: 'Reviewing grievance details and categorization', duration: 120 }, // 2 hours
            { name: 'Assignment', description: 'Assigning to appropriate officer', duration: 240 }, // 4 hours
            { name: 'Investigation', description: 'Officer investigating the grievance', duration: 2880 }, // 48 hours
            { name: 'Resolution', description: 'Preparing resolution and response', duration: 720 }, // 12 hours
            { name: 'Completion', description: 'Grievance resolved and closed', duration: 60 } // 1 hour
          ]
        }
      },
      citizen_registration: {
        verification: {
          title: 'Citizen Registration',
          steps: [
            { name: 'Data Validation', description: 'Validating provided information', duration: 5 },
            { name: 'Identity Verification', description: 'Verifying identity documents', duration: 1440 }, // 24 hours
            { name: 'Background Check', description: 'Conducting background verification', duration: 2880 }, // 48 hours
            { name: 'Blockchain Registration', description: 'Recording on blockchain', duration: 10 },
            { name: 'Account Activation', description: 'Activating citizen account', duration: 5 }
          ]
        }
      }
    };
  }

  /**
   * Create progress tracker for an entity
   * @param {string} entityType - Type of entity (document, grievance, citizen_registration)
   * @param {string} entityId - ID of the entity
   * @param {string} userAddress - User's wallet address
   * @param {string} processType - Type of process (upload, verification, processing)
   * @param {Object} metadata - Additional metadata
   */
  async createProgressTracker(entityType, entityId, userAddress, processType, metadata = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const template = this.progressTemplates[entityType]?.[processType];
      if (!template) {
        throw new Error(`No template found for ${entityType}.${processType}`);
      }

      // Check if tracker already exists
      const existingTracker = await ProgressTracker.findOne({
        where: { entityType, entityId, userAddress: userAddress.toLowerCase() }
      });

      if (existingTracker) {
        return existingTracker;
      }

      const steps = template.steps.map((step, index) => ({
        ...step,
        stepNumber: index + 1,
        completed: false,
        completedAt: null,
        startedAt: null
      }));

      const tracker = await ProgressTracker.create({
        entityType,
        entityId,
        userAddress: userAddress.toLowerCase(),
        title: template.title,
        description: `${template.title} for ${entityType} #${entityId}`,
        currentStep: 0,
        totalSteps: steps.length,
        steps,
        status: 'pending',
        progress: 0,
        metadata,
        estimatedCompletionTime: steps.reduce((total, step) => total + step.duration, 0)
      });

      // Send real-time update
      this.broadcastProgressUpdate(tracker);

      console.log(`📊 Progress tracker created for ${entityType} ${entityId}`);
      return tracker;

    } catch (error) {
      console.error('❌ Failed to create progress tracker:', error);
      throw error;
    }
  }

  /**
   * Update progress tracker to next step
   * @param {string} entityType - Type of entity
   * @param {string} entityId - ID of the entity
   * @param {string} stepName - Optional specific step name to update to
   * @param {Object} stepData - Additional step data
   */
  async updateProgress(entityType, entityId, stepName = null, stepData = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const tracker = await ProgressTracker.findOne({
        where: { entityType, entityId }
      });

      if (!tracker) {
        console.warn(`⚠️ No progress tracker found for ${entityType} ${entityId}`);
        return null;
      }

      const steps = tracker.steps;
      let targetStepIndex;

      if (stepName) {
        // Find specific step by name
        targetStepIndex = steps.findIndex(step => step.name === stepName);
        if (targetStepIndex === -1) {
          throw new Error(`Step "${stepName}" not found in tracker`);
        }
      } else {
        // Move to next step
        targetStepIndex = tracker.currentStep;
      }

      // Update current step
      if (targetStepIndex < steps.length) {
        steps[targetStepIndex] = {
          ...steps[targetStepIndex],
          completed: true,
          completedAt: new Date().toISOString(),
          ...stepData
        };

        const nextStep = targetStepIndex + 1;
        const progress = Math.round((nextStep / steps.length) * 100);
        const isCompleted = nextStep >= steps.length;

        // Start next step if exists
        if (nextStep < steps.length) {
          steps[nextStep] = {
            ...steps[nextStep],
            startedAt: new Date().toISOString()
          };
        }

        const updateData = {
          steps,
          currentStep: nextStep,
          progress,
          status: isCompleted ? 'completed' : (tracker.status === 'pending' ? 'in_progress' : tracker.status)
        };

        if (tracker.status === 'pending') {
          updateData.startedAt = new Date();
        }

        if (isCompleted) {
          updateData.completedAt = new Date();
        }

        await tracker.update(updateData);

        // Send progress notification
        await this.sendProgressNotification(tracker, targetStepIndex);

        // Broadcast real-time update
        this.broadcastProgressUpdate(tracker);

        console.log(`📊 Progress updated for ${entityType} ${entityId}: ${steps[targetStepIndex].name}`);
        return tracker;
      }

      return tracker;

    } catch (error) {
      console.error('❌ Failed to update progress:', error);
      throw error;
    }
  }

  /**
   * Get progress tracker for entity
   * @param {string} entityType - Type of entity
   * @param {string} entityId - ID of the entity
   */
  async getProgress(entityType, entityId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const tracker = await ProgressTracker.findOne({
        where: { entityType, entityId }
      });

      return tracker;

    } catch (error) {
      console.error('❌ Failed to get progress:', error);
      throw error;
    }
  }

  /**
   * Get all progress trackers for a user
   * @param {string} userAddress - User's wallet address
   * @param {Object} options - Query options
   */
  async getUserProgress(userAddress, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        entityType = null,
        status = null,
        limit = 50,
        offset = 0
      } = options;

      const whereClause = {
        userAddress: userAddress.toLowerCase()
      };

      if (entityType) {
        whereClause.entityType = entityType;
      }

      if (status) {
        whereClause.status = status;
      }

      const trackers = await ProgressTracker.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return trackers.map(tracker => tracker.toJSON());

    } catch (error) {
      console.error('❌ Failed to get user progress:', error);
      throw error;
    }
  }

  /**
   * Mark progress as failed
   * @param {string} entityType - Type of entity
   * @param {string} entityId - ID of the entity
   * @param {string} errorMessage - Error message
   */
  async markAsFailed(entityType, entityId, errorMessage) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const tracker = await ProgressTracker.findOne({
        where: { entityType, entityId }
      });

      if (!tracker) {
        return null;
      }

      await tracker.update({
        status: 'failed',
        metadata: {
          ...tracker.metadata,
          error: errorMessage,
          failedAt: new Date().toISOString()
        }
      });

      // Send failure notification
      await notificationService.sendNotification(
        tracker.userAddress,
        {
          title: `${tracker.title} Failed`,
          message: `Your ${tracker.entityType} processing has failed: ${errorMessage}`,
          type: 'error',
          priority: 'high',
          actionUrl: `/dashboard/${tracker.entityType}s`,
          actionLabel: 'View Details'
        }
      );

      // Broadcast real-time update
      this.broadcastProgressUpdate(tracker);

      return tracker;

    } catch (error) {
      console.error('❌ Failed to mark progress as failed:', error);
      throw error;
    }
  }

  /**
   * Send progress notification
   * @param {Object} tracker - Progress tracker
   * @param {number} stepIndex - Completed step index
   */
  async sendProgressNotification(tracker, stepIndex) {
    try {
      const step = tracker.steps[stepIndex];
      const isCompleted = tracker.status === 'completed';

      let notificationTemplate;
      if (isCompleted) {
        notificationTemplate = {
          title: `${tracker.title} Completed! ✅`,
          message: `Your ${tracker.entityType} processing has been completed successfully.`,
          type: 'success',
          priority: 'high'
        };
      } else {
        notificationTemplate = {
          title: `${tracker.title} Progress Update`,
          message: `Step completed: ${step.name}. Progress: ${tracker.progress}%`,
          type: 'info',
          priority: 'medium'
        };
      }

      await notificationService.sendNotification(
        tracker.userAddress,
        notificationTemplate,
        {
          entityType: tracker.entityType,
          entityId: tracker.entityId,
          stepName: step.name,
          progress: tracker.progress
        }
      );

    } catch (error) {
      console.error('❌ Failed to send progress notification:', error);
    }
  }

  /**
   * Broadcast progress update via WebSocket
   * @param {Object} tracker - Progress tracker
   */
  broadcastProgressUpdate(tracker) {
    if (!realtimeEventService.isInitialized) return;

    realtimeEventService.sendNotificationToAddress(tracker.userAddress, {
      type: 'progress_update',
      entityType: tracker.entityType,
      entityId: tracker.entityId,
      progress: tracker.progress,
      currentStep: tracker.currentStep,
      totalSteps: tracker.totalSteps,
      status: tracker.status,
      steps: tracker.steps,
      title: tracker.title,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Clean up old completed progress trackers
   */
  async cleanupOldTrackers() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
      
      const deletedCount = await ProgressTracker.destroy({
        where: {
          status: 'completed',
          completedAt: {
            [Sequelize.Op.lt]: thirtyDaysAgo
          }
        }
      });

      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} old progress trackers`);
      }

    } catch (error) {
      console.error('❌ Failed to cleanup old progress trackers:', error);
    }
  }

  /**
   * Get progress statistics
   */
  async getStatistics() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const stats = await ProgressTracker.findAll({
        attributes: [
          'entityType',
          'status',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
          [Sequelize.fn('AVG', Sequelize.col('progress')), 'avgProgress']
        ],
        group: ['entityType', 'status'],
        raw: true
      });

      const totalTrackers = await ProgressTracker.count();
      const activeTrackers = await ProgressTracker.count({
        where: { status: ['pending', 'in_progress'] }
      });

      return {
        total: totalTrackers,
        active: activeTrackers,
        byTypeAndStatus: stats.reduce((acc, stat) => {
          const key = `${stat.entityType}_${stat.status}`;
          acc[key] = {
            count: parseInt(stat.count),
            avgProgress: parseFloat(stat.avgProgress) || 0
          };
          return acc;
        }, {}),
        isInitialized: this.initialized
      };

    } catch (error) {
      console.error('❌ Failed to get progress statistics:', error);
      return {
        total: 0,
        active: 0,
        byTypeAndStatus: {},
        isInitialized: this.initialized
      };
    }
  }
}

// Create singleton instance
const progressTrackingService = new ProgressTrackingService();

module.exports = progressTrackingService;