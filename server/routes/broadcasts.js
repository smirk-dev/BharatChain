const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const notificationService = require('../services/notification');
const realtimeEventService = require('../services/realtime-events');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Initialize database for broadcasting
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/broadcasts.db'),
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Broadcast model
const Broadcast = sequelize.define('Broadcast', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
      'policy_update', 'service_announcement', 'system_maintenance', 
      'emergency_alert', 'feature_update', 'general_notice'
    ),
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  targetAudience: {
    type: DataTypes.ENUM('all', 'citizens', 'officers', 'specific_addresses'),
    defaultValue: 'all'
  },
  targetAddresses: {
    type: DataTypes.JSON,
    allowNull: true
  },
  scheduledFor: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'sent', 'cancelled'),
    defaultValue: 'draft'
  },
  actionUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  actionLabel: {
    type: DataTypes.STRING,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.STRING,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  recipientCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'broadcasts',
  timestamps: true,
  indexes: [
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['scheduledFor'] },
    { fields: ['createdAt'] }
  ]
});

// Initialize database
let dbInitialized = false;

async function initializeDatabase() {
  if (!dbInitialized) {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ alter: true });
      dbInitialized = true;
      console.log('✅ Broadcast database initialized');
    } catch (error) {
      console.error('❌ Failed to initialize broadcast database:', error);
      throw error;
    }
  }
}

// Extract address from request
function extractAddressFromToken(req) {
  return req.body.address || req.query.address || req.headers['x-wallet-address'] || '0x742d35Cc6635C0532925a3b8D07376F0c9fF4c52';
}

/**
 * @route POST /api/broadcasts
 * @desc Create a new broadcast
 * @access Private (Admin only)
 */
router.post('/', [
  body('title').isLength({ min: 1, max: 200 }).withMessage('Title is required (1-200 characters)'),
  body('message').isLength({ min: 1, max: 5000 }).withMessage('Message is required (1-5000 characters)'),
  body('type').isIn(['policy_update', 'service_announcement', 'system_maintenance', 'emergency_alert', 'feature_update', 'general_notice']).withMessage('Invalid broadcast type'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('targetAudience').optional().isIn(['all', 'citizens', 'officers', 'specific_addresses']).withMessage('Invalid target audience'),
  body('scheduledFor').optional().isISO8601().withMessage('Invalid scheduled date'),
  body('expiresAt').optional().isISO8601().withMessage('Invalid expiry date')
], async (req, res) => {
  try {
    await initializeDatabase();

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    // TODO: Add admin authorization check
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    const createdBy = extractAddressFromToken(req);
    const {
      title,
      message,
      type,
      priority = 'medium',
      targetAudience = 'all',
      targetAddresses,
      scheduledFor,
      actionUrl,
      actionLabel,
      expiresAt,
      metadata
    } = req.body;

    // Validate target addresses if specified
    if (targetAudience === 'specific_addresses' && (!targetAddresses || !Array.isArray(targetAddresses))) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Target addresses required for specific audience'
      });
    }

    const broadcast = await Broadcast.create({
      title,
      message,
      type,
      priority,
      targetAudience,
      targetAddresses: targetAudience === 'specific_addresses' ? targetAddresses : null,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      actionUrl,
      actionLabel,
      expiresAt: expiresAt ? new Date(expiresAt) : getDefaultExpiry(type),
      createdBy,
      metadata,
      status: scheduledFor ? 'scheduled' : 'draft'
    });

    // If not scheduled, send immediately
    if (!scheduledFor) {
      await sendBroadcast(broadcast);
    }

    res.status(201).json({
      success: true,
      message: scheduledFor ? 'Broadcast scheduled successfully' : 'Broadcast sent successfully',
      data: broadcast
    });

  } catch (error) {
    console.error('Create broadcast error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create broadcast',
      details: error.message
    });
  }
});

/**
 * @route GET /api/broadcasts
 * @desc Get broadcasts list
 * @access Private (Admin only)
 */
router.get('/', async (req, res) => {
  try {
    await initializeDatabase();

    // TODO: Add admin authorization check
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    const { status, type, limit = 50, offset = 0 } = req.query;
    
    const whereClause = {};
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;

    const broadcasts = await Broadcast.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await Broadcast.count({ where: whereClause });

    res.json({
      success: true,
      message: 'Broadcasts retrieved successfully',
      data: {
        broadcasts: broadcasts.map(b => b.toJSON()),
        total,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + broadcasts.length < total
        }
      }
    });

  } catch (error) {
    console.error('Get broadcasts error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve broadcasts',
      details: error.message
    });
  }
});

/**
 * @route GET /api/broadcasts/public
 * @desc Get public broadcasts for users
 * @access Public
 */
router.get('/public', async (req, res) => {
  try {
    await initializeDatabase();

    const { type, limit = 20 } = req.query;
    
    const whereClause = {
      status: 'sent',
      [Sequelize.Op.or]: [
        { expiresAt: null },
        { expiresAt: { [Sequelize.Op.gt]: new Date() } }
      ]
    };

    if (type) whereClause.type = type;

    const broadcasts = await Broadcast.findAll({
      where: whereClause,
      attributes: ['id', 'title', 'message', 'type', 'priority', 'actionUrl', 'actionLabel', 'sentAt'],
      order: [['sentAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      message: 'Public broadcasts retrieved successfully',
      data: { broadcasts: broadcasts.map(b => b.toJSON()) }
    });

  } catch (error) {
    console.error('Get public broadcasts error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve public broadcasts',
      details: error.message
    });
  }
});

/**
 * @route POST /api/broadcasts/:id/send
 * @desc Send a draft broadcast immediately
 * @access Private (Admin only)
 */
router.post('/:id/send', async (req, res) => {
  try {
    await initializeDatabase();

    // TODO: Add admin authorization check
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    const { id } = req.params;
    
    const broadcast = await Broadcast.findByPk(id);
    if (!broadcast) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Broadcast not found'
      });
    }

    if (broadcast.status !== 'draft' && broadcast.status !== 'scheduled') {
      return res.status(400).json({
        error: 'Invalid Status',
        message: 'Only draft or scheduled broadcasts can be sent'
      });
    }

    await sendBroadcast(broadcast);

    res.json({
      success: true,
      message: 'Broadcast sent successfully',
      data: broadcast
    });

  } catch (error) {
    console.error('Send broadcast error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to send broadcast',
      details: error.message
    });
  }
});

/**
 * @route DELETE /api/broadcasts/:id
 * @desc Cancel/delete a broadcast
 * @access Private (Admin only)
 */
router.delete('/:id', async (req, res) => {
  try {
    await initializeDatabase();

    // TODO: Add admin authorization check
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    const { id } = req.params;
    
    const broadcast = await Broadcast.findByPk(id);
    if (!broadcast) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Broadcast not found'
      });
    }

    if (broadcast.status === 'sent') {
      // Can't delete sent broadcasts, only cancel
      await broadcast.update({ status: 'cancelled' });
      return res.json({
        success: true,
        message: 'Broadcast cancelled successfully'
      });
    }

    await broadcast.destroy();

    res.json({
      success: true,
      message: 'Broadcast deleted successfully'
    });

  } catch (error) {
    console.error('Delete broadcast error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete broadcast',
      details: error.message
    });
  }
});

/**
 * @route GET /api/broadcasts/stats
 * @desc Get broadcast statistics
 * @access Private (Admin only)
 */
router.get('/stats', async (req, res) => {
  try {
    await initializeDatabase();

    // TODO: Add admin authorization check
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    const stats = await getBroadcastStatistics();

    res.json({
      success: true,
      message: 'Broadcast statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('Get broadcast statistics error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve broadcast statistics',
      details: error.message
    });
  }
});

// Helper Functions

/**
 * Send broadcast to target audience
 */
async function sendBroadcast(broadcast) {
  try {
    let recipientCount = 0;

    const announcement = {
      title: broadcast.title,
      message: broadcast.message,
      type: 'system_announcement',
      priority: broadcast.priority,
      actionUrl: broadcast.actionUrl,
      actionLabel: broadcast.actionLabel,
      expiresAt: broadcast.expiresAt
    };

    switch (broadcast.targetAudience) {
      case 'all':
        // Broadcast to all connected users
        await notificationService.broadcastAnnouncement(announcement);
        recipientCount = realtimeEventService.isInitialized ? 
          realtimeEventService.getStatistics().totalClients : 0;
        break;

      case 'specific_addresses':
        // Send to specific addresses
        if (broadcast.targetAddresses && Array.isArray(broadcast.targetAddresses)) {
          await notificationService.broadcastAnnouncement(announcement, broadcast.targetAddresses);
          recipientCount = broadcast.targetAddresses.length;
        }
        break;

      case 'citizens':
      case 'officers':
        // For now, broadcast to all (could be enhanced with role-based filtering)
        await notificationService.broadcastAnnouncement(announcement);
        recipientCount = realtimeEventService.isInitialized ? 
          realtimeEventService.getStatistics().totalClients : 0;
        break;
    }

    // Update broadcast status
    await broadcast.update({
      status: 'sent',
      sentAt: new Date(),
      recipientCount
    });

    // Broadcast the event via WebSocket for real-time updates
    if (realtimeEventService.isInitialized) {
      realtimeEventService.broadcastEvent('system_broadcast', {
        id: broadcast.id,
        title: broadcast.title,
        message: broadcast.message,
        type: broadcast.type,
        priority: broadcast.priority,
        actionUrl: broadcast.actionUrl,
        actionLabel: broadcast.actionLabel,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`📢 Broadcast sent: "${broadcast.title}" to ${recipientCount} recipients`);
    return recipientCount;

  } catch (error) {
    console.error('❌ Failed to send broadcast:', error);
    await broadcast.update({ status: 'draft' }); // Reset status on failure
    throw error;
  }
}

/**
 * Get default expiry time for broadcast type
 */
function getDefaultExpiry(type) {
  const now = new Date();
  const expiryDays = {
    'policy_update': 90,      // 3 months
    'service_announcement': 30, // 1 month
    'system_maintenance': 7,   // 1 week
    'emergency_alert': 3,      // 3 days
    'feature_update': 30,      // 1 month
    'general_notice': 14       // 2 weeks
  };

  const days = expiryDays[type] || 30;
  return new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
}

/**
 * Get broadcast statistics
 */
async function getBroadcastStatistics() {
  const [statusStats, typeStats] = await Promise.all([
    Broadcast.findAll({
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    }),
    Broadcast.findAll({
      attributes: [
        'type',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('recipientCount')), 'totalRecipients']
      ],
      group: ['type'],
      raw: true
    })
  ]);

  const totalBroadcasts = await Broadcast.count();
  const totalSent = await Broadcast.count({ where: { status: 'sent' } });
  const totalRecipients = await Broadcast.sum('recipientCount') || 0;

  return {
    total: totalBroadcasts,
    sent: totalSent,
    totalRecipients,
    byStatus: statusStats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count);
      return acc;
    }, {}),
    byType: typeStats.reduce((acc, stat) => {
      acc[stat.type] = {
        count: parseInt(stat.count),
        totalRecipients: parseInt(stat.totalRecipients) || 0
      };
      return acc;
    }, {})
  };
}

// Check for scheduled broadcasts (this could be run as a cron job)
async function processScheduledBroadcasts() {
  try {
    await initializeDatabase();

    const scheduledBroadcasts = await Broadcast.findAll({
      where: {
        status: 'scheduled',
        scheduledFor: {
          [Sequelize.Op.lte]: new Date()
        }
      }
    });

    for (const broadcast of scheduledBroadcasts) {
      try {
        await sendBroadcast(broadcast);
      } catch (error) {
        console.error(`❌ Failed to send scheduled broadcast ${broadcast.id}:`, error);
      }
    }

  } catch (error) {
    console.error('❌ Failed to process scheduled broadcasts:', error);
  }
}

// Start scheduled broadcast processor (every 5 minutes)
setInterval(processScheduledBroadcasts, 5 * 60 * 1000);

module.exports = router;