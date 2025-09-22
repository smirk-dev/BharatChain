const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const realtimeEventService = require('../services/realtime-events');
const notificationService = require('../services/notification');

// Initialize database for chat
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/chat.db'),
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Chat Room model
const ChatRoom = sequelize.define('ChatRoom', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  grievanceId: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  citizenAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  officerAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    index: true
  },
  status: {
    type: DataTypes.ENUM('active', 'closed', 'archived'),
    defaultValue: 'active'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'chat_rooms',
  timestamps: true,
  indexes: [
    { fields: ['grievanceId'] },
    { fields: ['citizenAddress'] },
    { fields: ['officerAddress'] },
    { fields: ['status'] }
  ]
});

// Chat Message model
const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  roomId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: ChatRoom,
      key: 'id'
    }
  },
  senderAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  senderType: {
    type: DataTypes.ENUM('citizen', 'officer', 'system'),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  messageType: {
    type: DataTypes.ENUM('text', 'status_update', 'file_attachment', 'system_notice'),
    defaultValue: 'text'
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true
  },
  readBy: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'chat_messages',
  timestamps: true,
  indexes: [
    { fields: ['roomId'] },
    { fields: ['senderAddress'] },
    { fields: ['createdAt'] }
  ]
});

// Set up associations
ChatRoom.hasMany(ChatMessage, { foreignKey: 'roomId', as: 'messages' });
ChatMessage.belongsTo(ChatRoom, { foreignKey: 'roomId', as: 'room' });

// Initialize database
let dbInitialized = false;

async function initializeDatabase() {
  if (!dbInitialized) {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ alter: true });
      dbInitialized = true;
      console.log('✅ Chat database initialized');
    } catch (error) {
      console.error('❌ Failed to initialize chat database:', error);
      throw error;
    }
  }
}

// Extract address from request
function extractAddressFromToken(req) {
  return req.body.address || req.query.address || req.headers['x-wallet-address'] || '0x742d35Cc6635C0532925a3b8D07376F0c9fF4c52';
}

/**
 * @route GET /api/chat/rooms
 * @desc Get user's chat rooms
 * @access Private
 */
router.get('/rooms', async (req, res) => {
  try {
    await initializeDatabase();
    
    const userAddress = extractAddressFromToken(req);
    const { status = 'active' } = req.query;

    const whereClause = {
      [Sequelize.Op.or]: [
        { citizenAddress: userAddress.toLowerCase() },
        { officerAddress: userAddress.toLowerCase() }
      ]
    };

    if (status !== 'all') {
      whereClause.status = status;
    }

    const rooms = await ChatRoom.findAll({
      where: whereClause,
      include: [{
        model: ChatMessage,
        as: 'messages',
        limit: 1,
        order: [['createdAt', 'DESC']],
        required: false
      }],
      order: [['lastMessageAt', 'DESC']]
    });

    // Get unread message counts for each room
    const roomsWithUnread = await Promise.all(rooms.map(async (room) => {
      const unreadCount = await ChatMessage.count({
        where: {
          roomId: room.id,
          senderAddress: { [Sequelize.Op.ne]: userAddress.toLowerCase() },
          readBy: {
            [Sequelize.Op.not]: {
              [Sequelize.Op.contains]: userAddress.toLowerCase()
            }
          }
        }
      });

      return {
        ...room.toJSON(),
        unreadCount,
        lastMessage: room.messages && room.messages.length > 0 ? room.messages[0] : null
      };
    }));

    res.json({
      success: true,
      message: 'Chat rooms retrieved successfully',
      data: {
        rooms: roomsWithUnread,
        total: roomsWithUnread.length
      }
    });

  } catch (error) {
    console.error('Get chat rooms error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve chat rooms',
      details: error.message
    });
  }
});

/**
 * @route POST /api/chat/rooms
 * @desc Create or get chat room for grievance
 * @access Private
 */
router.post('/rooms', [
  body('grievanceId').notEmpty().withMessage('Grievance ID is required'),
  body('title').isLength({ min: 1, max: 200 }).withMessage('Title is required (1-200 characters)')
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

    const userAddress = extractAddressFromToken(req);
    const { grievanceId, title, officerAddress } = req.body;

    // Check if room already exists
    let room = await ChatRoom.findOne({
      where: { grievanceId }
    });

    if (room) {
      return res.json({
        success: true,
        message: 'Chat room already exists',
        data: room
      });
    }

    // Create new room
    room = await ChatRoom.create({
      grievanceId,
      citizenAddress: userAddress.toLowerCase(),
      officerAddress: officerAddress ? officerAddress.toLowerCase() : null,
      title,
      status: 'active'
    });

    // Send system welcome message
    await ChatMessage.create({
      roomId: room.id,
      senderAddress: 'system',
      senderType: 'system',
      message: `Chat room created for grievance #${grievanceId}. Feel free to ask questions or provide updates.`,
      messageType: 'system_notice'
    });

    // Send notification to officer if assigned
    if (officerAddress) {
      await notificationService.sendNotification(
        officerAddress,
        {
          title: 'New Chat Room Created',
          message: `A new chat room has been created for grievance #${grievanceId}`,
          type: 'grievance_update',
          priority: 'medium',
          actionUrl: `/chat/rooms/${room.id}`,
          actionLabel: 'Join Chat'
        }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Chat room created successfully',
      data: room
    });

  } catch (error) {
    console.error('Create chat room error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create chat room',
      details: error.message
    });
  }
});

/**
 * @route GET /api/chat/rooms/:roomId/messages
 * @desc Get messages from a chat room
 * @access Private
 */
router.get('/rooms/:roomId/messages', async (req, res) => {
  try {
    await initializeDatabase();

    const { roomId } = req.params;
    const userAddress = extractAddressFromToken(req);
    const { limit = 50, offset = 0, before } = req.query;

    // Check if user has access to this room
    const room = await ChatRoom.findOne({
      where: {
        id: roomId,
        [Sequelize.Op.or]: [
          { citizenAddress: userAddress.toLowerCase() },
          { officerAddress: userAddress.toLowerCase() }
        ]
      }
    });

    if (!room) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Chat room not found or access denied'
      });
    }

    const whereClause = { roomId };
    
    if (before) {
      whereClause.createdAt = {
        [Sequelize.Op.lt]: new Date(before)
      };
    }

    const messages = await ChatMessage.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Mark messages as read by current user
    await ChatMessage.update(
      {
        readBy: Sequelize.fn(
          'JSON_SET',
          Sequelize.col('readBy'),
          '$[#]',
          userAddress.toLowerCase()
        )
      },
      {
        where: {
          roomId,
          senderAddress: { [Sequelize.Op.ne]: userAddress.toLowerCase() },
          readBy: {
            [Sequelize.Op.not]: {
              [Sequelize.Op.contains]: userAddress.toLowerCase()
            }
          }
        }
      }
    );

    res.json({
      success: true,
      message: 'Messages retrieved successfully',
      data: {
        room,
        messages: messages.reverse(), // Return in chronological order
        hasMore: messages.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve chat messages',
      details: error.message
    });
  }
});

/**
 * @route POST /api/chat/rooms/:roomId/messages
 * @desc Send message to chat room
 * @access Private
 */
router.post('/rooms/:roomId/messages', [
  body('message').isLength({ min: 1, max: 2000 }).withMessage('Message is required (1-2000 characters)'),
  body('messageType').optional().isIn(['text', 'status_update', 'file_attachment']).withMessage('Invalid message type')
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

    const { roomId } = req.params;
    const userAddress = extractAddressFromToken(req);
    const { message, messageType = 'text', attachments } = req.body;

    // Check if user has access to this room
    const room = await ChatRoom.findOne({
      where: {
        id: roomId,
        [Sequelize.Op.or]: [
          { citizenAddress: userAddress.toLowerCase() },
          { officerAddress: userAddress.toLowerCase() }
        ]
      }
    });

    if (!room) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Chat room not found or access denied'
      });
    }

    // Determine sender type
    const senderType = room.citizenAddress.toLowerCase() === userAddress.toLowerCase() 
      ? 'citizen' 
      : 'officer';

    // Create message
    const chatMessage = await ChatMessage.create({
      roomId,
      senderAddress: userAddress.toLowerCase(),
      senderType,
      message,
      messageType,
      attachments: attachments || null,
      readBy: [userAddress.toLowerCase()]
    });

    // Update room's last message timestamp
    await room.update({ lastMessageAt: new Date() });

    // Send real-time message to room participants
    this.broadcastMessageToRoom(room, chatMessage);

    // Send notification to other participant
    const otherParticipant = senderType === 'citizen' 
      ? room.officerAddress 
      : room.citizenAddress;

    if (otherParticipant) {
      await notificationService.sendNotification(
        otherParticipant,
        {
          title: 'New Chat Message',
          message: `New message in grievance #${room.grievanceId}: "${message.substring(0, 50)}..."`,
          type: 'grievance_update',
          priority: 'medium',
          actionUrl: `/chat/rooms/${room.id}`,
          actionLabel: 'View Message'
        }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: chatMessage
    });

  } catch (error) {
    console.error('Send chat message error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to send message',
      details: error.message
    });
  }
});

/**
 * @route PUT /api/chat/rooms/:roomId/close
 * @desc Close chat room
 * @access Private
 */
router.put('/rooms/:roomId/close', async (req, res) => {
  try {
    await initializeDatabase();

    const { roomId } = req.params;
    const userAddress = extractAddressFromToken(req);

    // Check if user has access to this room
    const room = await ChatRoom.findOne({
      where: {
        id: roomId,
        [Sequelize.Op.or]: [
          { citizenAddress: userAddress.toLowerCase() },
          { officerAddress: userAddress.toLowerCase() }
        ]
      }
    });

    if (!room) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Chat room not found or access denied'
      });
    }

    // Update room status
    await room.update({ status: 'closed' });

    // Send system message
    await ChatMessage.create({
      roomId,
      senderAddress: 'system',
      senderType: 'system',
      message: `Chat room closed by ${userAddress}`,
      messageType: 'system_notice'
    });

    // Broadcast closure to room participants
    this.broadcastRoomStatusUpdate(room, 'closed');

    res.json({
      success: true,
      message: 'Chat room closed successfully',
      data: room
    });

  } catch (error) {
    console.error('Close chat room error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to close chat room',
      details: error.message
    });
  }
});

/**
 * @route GET /api/chat/stats
 * @desc Get chat statistics (admin only)
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

    const stats = await getChatStatistics();

    res.json({
      success: true,
      message: 'Chat statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('Get chat statistics error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve chat statistics',
      details: error.message
    });
  }
});

// Helper Functions

/**
 * Broadcast message to room participants via WebSocket
 */
function broadcastMessageToRoom(room, message) {
  if (!realtimeEventService.isInitialized) return;

  const participants = [room.citizenAddress, room.officerAddress].filter(Boolean);
  
  participants.forEach(address => {
    realtimeEventService.sendNotificationToAddress(address, {
      type: 'chat_message',
      roomId: room.id,
      grievanceId: room.grievanceId,
      message: {
        id: message.id,
        senderAddress: message.senderAddress,
        senderType: message.senderType,
        message: message.message,
        messageType: message.messageType,
        createdAt: message.createdAt
      }
    });
  });
}

/**
 * Broadcast room status update via WebSocket
 */
function broadcastRoomStatusUpdate(room, status) {
  if (!realtimeEventService.isInitialized) return;

  const participants = [room.citizenAddress, room.officerAddress].filter(Boolean);
  
  participants.forEach(address => {
    realtimeEventService.sendNotificationToAddress(address, {
      type: 'chat_room_status',
      roomId: room.id,
      grievanceId: room.grievanceId,
      status,
      timestamp: new Date().toISOString()
    });
  });
}

/**
 * Get chat statistics
 */
async function getChatStatistics() {
  const [roomStats, messageStats] = await Promise.all([
    ChatRoom.findAll({
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    }),
    ChatMessage.findAll({
      attributes: [
        'senderType',
        'messageType',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['senderType', 'messageType'],
      raw: true
    })
  ]);

  const totalRooms = await ChatRoom.count();
  const totalMessages = await ChatMessage.count();
  const activeRooms = await ChatRoom.count({ where: { status: 'active' } });

  return {
    rooms: {
      total: totalRooms,
      active: activeRooms,
      byStatus: roomStats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.count);
        return acc;
      }, {})
    },
    messages: {
      total: totalMessages,
      byType: messageStats.reduce((acc, stat) => {
        const key = `${stat.senderType}_${stat.messageType}`;
        acc[key] = parseInt(stat.count);
        return acc;
      }, {})
    }
  };
}

module.exports = router;