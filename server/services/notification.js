const realtimeEventService = require('./realtime-events');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Initialize database for notifications
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/notifications.db'),
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Notification model
const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  recipientAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM(
      'info', 'success', 'warning', 'error', 
      'citizen_registration', 'document_verification', 
      'grievance_update', 'system_announcement'
    ),
    defaultValue: 'info'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actionUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  actionLabel: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    { fields: ['recipientAddress'] },
    { fields: ['type'] },
    { fields: ['read'] },
    { fields: ['createdAt'] },
    { fields: ['priority'] }
  ]
});

class NotificationService {
  constructor() {
    this.initialized = false;
    this.templates = this.initializeTemplates();
  }

  /**
   * Initialize notification service
   */
  async initialize() {
    try {
      // Sync database
      await sequelize.authenticate();
      await sequelize.sync({ alter: true });
      
      // Clean up expired notifications
      await this.cleanupExpiredNotifications();
      
      this.initialized = true;
      console.log('✅ Notification service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      throw error;
    }
  }

  /**
   * Initialize notification templates
   */
  initializeTemplates() {
    return {
      citizen_registered: {
        title: 'Welcome to BharatChain! 🎉',
        message: 'Your citizen registration has been successfully completed. You can now access all government services.',
        type: 'citizen_registration',
        priority: 'high',
        actionLabel: 'View Profile',
        actionUrl: '/dashboard/profile'
      },
      citizen_verified: {
        title: 'Account Verified ✅',
        message: 'Your citizen account has been verified by government authorities.',
        type: 'citizen_registration',
        priority: 'high',
        actionLabel: 'View Profile',
        actionUrl: '/dashboard/profile'
      },
      document_uploaded: {
        title: 'Document Uploaded 📄',
        message: 'Your {documentType} has been successfully uploaded and is pending verification.',
        type: 'document_verification',
        priority: 'medium',
        actionLabel: 'View Documents',
        actionUrl: '/dashboard/documents'
      },
      document_verified: {
        title: 'Document Verified ✅',
        message: 'Your {documentType} has been verified and is now officially recognized.',
        type: 'document_verification',
        priority: 'high',
        actionLabel: 'View Documents',
        actionUrl: '/dashboard/documents'
      },
      document_rejected: {
        title: 'Document Rejected ❌',
        message: 'Your {documentType} has been rejected. Please check the requirements and upload again.',
        type: 'document_verification',
        priority: 'high',
        actionLabel: 'Upload Again',
        actionUrl: '/dashboard/documents/upload'
      },
      grievance_submitted: {
        title: 'Grievance Submitted 📝',
        message: 'Your grievance "_{title}_" has been submitted successfully. Reference ID: {grievanceId}',
        type: 'grievance_update',
        priority: 'medium',
        actionLabel: 'Track Grievance',
        actionUrl: '/dashboard/grievances/{grievanceId}'
      },
      grievance_assigned: {
        title: 'Grievance Assigned 👮‍♂️',
        message: 'Your grievance "_{title}_" has been assigned to an officer for resolution.',
        type: 'grievance_update',
        priority: 'medium',
        actionLabel: 'View Progress',
        actionUrl: '/dashboard/grievances/{grievanceId}'
      },
      grievance_resolved: {
        title: 'Grievance Resolved ✅',
        message: 'Your grievance "_{title}_" has been resolved. Please review the resolution and provide feedback.',
        type: 'grievance_update',
        priority: 'high',
        actionLabel: 'Review Resolution',
        actionUrl: '/dashboard/grievances/{grievanceId}'
      },
      system_maintenance: {
        title: 'System Maintenance Notice 🔧',
        message: 'BharatChain will undergo scheduled maintenance on {date} from {startTime} to {endTime}.',
        type: 'system_announcement',
        priority: 'medium',
        actionLabel: 'Learn More',
        actionUrl: '/announcements'
      },
      policy_update: {
        title: 'Policy Update 📋',
        message: 'New government policy "{policyName}" has been announced. Review how it affects you.',
        type: 'system_announcement',
        priority: 'medium',
        actionLabel: 'Read Policy',
        actionUrl: '/policies/{policyId}'
      },
      service_outage: {
        title: 'Service Alert ⚠️',
        message: 'We are experiencing issues with {serviceName}. Our team is working to resolve this quickly.',
        type: 'system_announcement',
        priority: 'high',
        actionLabel: 'Status Page',
        actionUrl: '/status'
      }
    };
  }

  /**
   * Send notification to a specific user
   * @param {string} recipientAddress - Recipient's wallet address
   * @param {string} templateKey - Template key or custom notification object
   * @param {Object} data - Data to fill template placeholders
   * @param {Object} options - Additional options
   */
  async sendNotification(recipientAddress, templateKey, data = {}, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      let notificationData;

      // Check if templateKey is a template or custom notification
      if (typeof templateKey === 'string' && this.templates[templateKey]) {
        notificationData = { ...this.templates[templateKey] };
        
        // Replace placeholders in title and message
        notificationData.title = this.replacePlaceholders(notificationData.title, data);
        notificationData.message = this.replacePlaceholders(notificationData.message, data);
        notificationData.actionUrl = this.replacePlaceholders(notificationData.actionUrl || '', data);
      } else if (typeof templateKey === 'object') {
        notificationData = templateKey;
      } else {
        throw new Error('Invalid template key or notification object');
      }

      // Merge options
      const finalNotification = {
        ...notificationData,
        ...options,
        recipientAddress: recipientAddress.toLowerCase(),
        data,
        expiresAt: options.expiresAt || this.getDefaultExpiry(notificationData.type)
      };

      // Save to database
      const notification = await Notification.create(finalNotification);

      // Send real-time notification
      this.sendRealTimeNotification(recipientAddress, notification);

      console.log(`📧 Notification sent to ${recipientAddress}: ${notificationData.title}`);
      return notification;

    } catch (error) {
      console.error('❌ Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Send real-time notification via WebSocket
   * @param {string} address - Target address
   * @param {Object} notification - Notification object
   */
  sendRealTimeNotification(address, notification) {
    if (realtimeEventService.isInitialized) {
      realtimeEventService.sendNotificationToAddress(address, {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        actionUrl: notification.actionUrl,
        actionLabel: notification.actionLabel,
        createdAt: notification.createdAt
      });
    }
  }

  /**
   * Get notifications for a user
   * @param {string} address - User's wallet address
   * @param {Object} options - Query options
   */
  async getNotifications(address, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        limit = 50,
        offset = 0,
        unreadOnly = false,
        type = null,
        priority = null
      } = options;

      const whereClause = {
        recipientAddress: address.toLowerCase()
      };

      if (unreadOnly) {
        whereClause.read = false;
      }

      if (type) {
        whereClause.type = type;
      }

      if (priority) {
        whereClause.priority = priority;
      }

      const notifications = await Notification.findAll({
        where: whereClause,
        order: [
          ['priority', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit,
        offset
      });

      const unreadCount = await Notification.count({
        where: {
          recipientAddress: address.toLowerCase(),
          read: false
        }
      });

      return {
        notifications: notifications.map(n => n.toJSON()),
        unreadCount,
        total: notifications.length
      };

    } catch (error) {
      console.error('❌ Failed to get notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userAddress - User's address for security
   */
  async markAsRead(notificationId, userAddress) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const [updatedCount] = await Notification.update(
        { 
          read: true, 
          readAt: new Date() 
        },
        {
          where: {
            id: notificationId,
            recipientAddress: userAddress.toLowerCase()
          }
        }
      );

      return updatedCount > 0;

    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userAddress - User's address
   */
  async markAllAsRead(userAddress) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const [updatedCount] = await Notification.update(
        { 
          read: true, 
          readAt: new Date() 
        },
        {
          where: {
            recipientAddress: userAddress.toLowerCase(),
            read: false
          }
        }
      );

      return updatedCount;

    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @param {string} userAddress - User's address for security
   */
  async deleteNotification(notificationId, userAddress) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const deletedCount = await Notification.destroy({
        where: {
          id: notificationId,
          recipientAddress: userAddress.toLowerCase()
        }
      });

      return deletedCount > 0;

    } catch (error) {
      console.error('❌ Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Broadcast system-wide announcement
   * @param {Object} announcement - Announcement data
   * @param {Array} targetAddresses - Specific addresses (optional, if not provided, broadcasts to all)
   */
  async broadcastAnnouncement(announcement, targetAddresses = null) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const announcementData = {
        title: announcement.title,
        message: announcement.message,
        type: 'system_announcement',
        priority: announcement.priority || 'medium',
        actionUrl: announcement.actionUrl,
        actionLabel: announcement.actionLabel,
        expiresAt: announcement.expiresAt || this.getDefaultExpiry('system_announcement')
      };

      if (targetAddresses && Array.isArray(targetAddresses)) {
        // Send to specific addresses
        const promises = targetAddresses.map(address => 
          this.sendNotification(address, announcementData)
        );
        
        await Promise.all(promises);
        console.log(`📢 Announcement sent to ${targetAddresses.length} specific users`);
      } else {
        // Broadcast to all connected real-time clients
        if (realtimeEventService.isInitialized) {
          realtimeEventService.clients.forEach((client) => {
            if (client.address && client.ws.readyState === 1) { // WebSocket.OPEN
              this.sendNotification(client.address, announcementData);
            }
          });
          
          const connectedUsers = realtimeEventService.clients.size;
          console.log(`📢 Announcement broadcasted to ${connectedUsers} connected users`);
        }
      }

    } catch (error) {
      console.error('❌ Failed to broadcast announcement:', error);
      throw error;
    }
  }

  /**
   * Replace placeholders in text with data
   * @param {string} text - Text with placeholders
   * @param {Object} data - Data to replace placeholders
   */
  replacePlaceholders(text, data) {
    if (!text || typeof text !== 'string') return text;
    
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  }

  /**
   * Get default expiry time for notification type
   * @param {string} type - Notification type
   */
  getDefaultExpiry(type) {
    const now = new Date();
    const expiryHours = {
      'info': 168, // 7 days
      'success': 72, // 3 days
      'warning': 168, // 7 days
      'error': 168, // 7 days
      'citizen_registration': 720, // 30 days
      'document_verification': 168, // 7 days
      'grievance_update': 720, // 30 days
      'system_announcement': 168 // 7 days
    };

    const hours = expiryHours[type] || 168;
    return new Date(now.getTime() + (hours * 60 * 60 * 1000));
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications() {
    try {
      const deletedCount = await Notification.destroy({
        where: {
          expiresAt: {
            [Sequelize.Op.lt]: new Date()
          }
        }
      });

      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} expired notifications`);
      }

    } catch (error) {
      console.error('❌ Failed to cleanup expired notifications:', error);
    }
  }

  /**
   * Get notification statistics for admin
   */
  async getStatistics() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const stats = await Notification.findAll({
        attributes: [
          'type',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
          [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN read = 0 THEN 1 ELSE 0 END')), 'unread']
        ],
        group: ['type'],
        raw: true
      });

      const totalStats = await Notification.findOne({
        attributes: [
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
          [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN read = 0 THEN 1 ELSE 0 END')), 'totalUnread']
        ],
        raw: true
      });

      return {
        byType: stats,
        total: totalStats.total || 0,
        totalUnread: totalStats.totalUnread || 0,
        isInitialized: this.initialized
      };

    } catch (error) {
      console.error('❌ Failed to get notification statistics:', error);
      return {
        byType: [],
        total: 0,
        totalUnread: 0,
        isInitialized: this.initialized
      };
    }
  }

  /**
   * Setup automatic blockchain event notifications
   */
  setupBlockchainEventNotifications() {
    // This will be called when blockchain events occur
    const originalBroadcastEvent = realtimeEventService.broadcastEvent;
    
    realtimeEventService.broadcastEvent = (eventType, eventData) => {
      // Call original broadcast method
      originalBroadcastEvent.call(realtimeEventService, eventType, eventData);
      
      // Send notifications based on event type
      this.handleBlockchainEventNotification(eventType, eventData);
    };

    console.log('🔗 Blockchain event notifications setup complete');
  }

  /**
   * Handle blockchain event notifications
   * @param {string} eventType - Blockchain event type
   * @param {Object} eventData - Event data
   */
  async handleBlockchainEventNotification(eventType, eventData) {
    try {
      switch (eventType) {
        case 'citizen_registered':
          await this.sendNotification(
            eventData.citizenAddress,
            'citizen_registered',
            { name: eventData.name }
          );
          break;

        case 'citizen_verified':
          await this.sendNotification(
            eventData.citizenAddress,
            'citizen_verified'
          );
          break;

        case 'document_uploaded':
          await this.sendNotification(
            eventData.owner,
            'document_uploaded',
            { 
              documentType: eventData.documentType,
              documentId: eventData.documentId
            }
          );
          break;

        case 'document_verified':
          await this.sendNotification(
            eventData.owner,
            'document_verified',
            { 
              documentType: eventData.documentType,
              documentId: eventData.documentId
            }
          );
          break;

        case 'grievance_submitted':
          await this.sendNotification(
            eventData.citizen,
            'grievance_submitted',
            { 
              grievanceId: eventData.grievanceId,
              title: eventData.title || 'Your Grievance'
            }
          );
          break;

        case 'grievance_resolved':
          await this.sendNotification(
            eventData.citizen,
            'grievance_resolved',
            { 
              grievanceId: eventData.grievanceId,
              title: eventData.title || 'Your Grievance'
            }
          );
          break;
      }
    } catch (error) {
      console.error(`❌ Failed to send notification for ${eventType}:`, error);
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;