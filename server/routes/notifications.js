const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const notificationService = require('../services/notification');

// Extract address from request
function extractAddressFromToken(req) {
  return req.body.address || req.query.address || req.headers['x-wallet-address'] || '0x742d35Cc6635C0532925a3b8D07376F0c9fF4c52';
}

/**
 * @route GET /api/notifications
 * @desc Get user's notifications
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const userAddress = extractAddressFromToken(req);
    const {
      limit = 50,
      offset = 0,
      unreadOnly = false,
      type = null,
      priority = null
    } = req.query;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true',
      type,
      priority
    };

    const result = await notificationService.getNotifications(userAddress, options);

    res.json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: result
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve notifications',
      details: error.message
    });
  }
});

/**
 * @route GET /api/notifications/unread-count
 * @desc Get unread notification count
 * @access Private
 */
router.get('/unread-count', async (req, res) => {
  try {
    const userAddress = extractAddressFromToken(req);
    const result = await notificationService.getNotifications(userAddress, { limit: 1, unreadOnly: true });

    res.json({
      success: true,
      message: 'Unread count retrieved successfully',
      data: {
        unreadCount: result.unreadCount
      }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve unread count',
      details: error.message
    });
  }
});

/**
 * @route PUT /api/notifications/:id/read
 * @desc Mark notification as read
 * @access Private
 */
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userAddress = extractAddressFromToken(req);

    const success = await notificationService.markAsRead(id, userAddress);

    if (success) {
      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } else {
      res.status(404).json({
        error: 'Not Found',
        message: 'Notification not found or already read'
      });
    }

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to mark notification as read',
      details: error.message
    });
  }
});

/**
 * @route PUT /api/notifications/mark-all-read
 * @desc Mark all notifications as read
 * @access Private
 */
router.put('/mark-all-read', async (req, res) => {
  try {
    const userAddress = extractAddressFromToken(req);
    const updatedCount = await notificationService.markAllAsRead(userAddress);

    res.json({
      success: true,
      message: `${updatedCount} notifications marked as read`,
      data: { updatedCount }
    });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to mark all notifications as read',
      details: error.message
    });
  }
});

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete notification
 * @access Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userAddress = extractAddressFromToken(req);

    const success = await notificationService.deleteNotification(id, userAddress);

    if (success) {
      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } else {
      res.status(404).json({
        error: 'Not Found',
        message: 'Notification not found'
      });
    }

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete notification',
      details: error.message
    });
  }
});

/**
 * @route POST /api/notifications/test
 * @desc Send test notification (for development)
 * @access Private
 */
router.post('/test', [
  body('title').isLength({ min: 1, max: 200 }).withMessage('Title is required (1-200 characters)'),
  body('message').isLength({ min: 1, max: 1000 }).withMessage('Message is required (1-1000 characters)'),
  body('type').optional().isIn(['info', 'success', 'warning', 'error']).withMessage('Invalid type'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
], async (req, res) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Test notifications not available in production'
      });
    }

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
    const { title, message, type = 'info', priority = 'medium', actionUrl, actionLabel } = req.body;

    const customNotification = {
      title,
      message,
      type,
      priority,
      actionUrl,
      actionLabel
    };

    const notification = await notificationService.sendNotification(
      userAddress,
      customNotification
    );

    res.status(201).json({
      success: true,
      message: 'Test notification sent successfully',
      data: notification
    });

  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to send test notification',
      details: error.message
    });
  }
});

/**
 * @route POST /api/notifications/broadcast
 * @desc Broadcast system announcement (admin only)
 * @access Private (Admin only)
 */
router.post('/broadcast', [
  body('title').isLength({ min: 1, max: 200 }).withMessage('Title is required (1-200 characters)'),
  body('message').isLength({ min: 1, max: 2000 }).withMessage('Message is required (1-2000 characters)'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('targetAddresses').optional().isArray().withMessage('Target addresses must be an array')
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

    // TODO: Add admin authorization check here
    // For now, allow any authenticated user in development
    if (process.env.NODE_ENV === 'production') {
      // In production, add proper admin verification
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    const { title, message, priority = 'medium', actionUrl, actionLabel, targetAddresses, expiresAt } = req.body;

    const announcement = {
      title,
      message,
      priority,
      actionUrl,
      actionLabel,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    };

    await notificationService.broadcastAnnouncement(announcement, targetAddresses);

    res.status(201).json({
      success: true,
      message: targetAddresses 
        ? `Announcement sent to ${targetAddresses.length} specific users`
        : 'Announcement broadcasted to all connected users',
      data: announcement
    });

  } catch (error) {
    console.error('Broadcast announcement error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to broadcast announcement',
      details: error.message
    });
  }
});

/**
 * @route GET /api/notifications/stats
 * @desc Get notification statistics (admin only)
 * @access Private (Admin only)
 */
router.get('/stats', async (req, res) => {
  try {
    // TODO: Add admin authorization check here
    // For now, allow any authenticated user in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    const stats = await notificationService.getStatistics();

    res.json({
      success: true,
      message: 'Notification statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('Get notification statistics error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve notification statistics',
      details: error.message
    });
  }
});

/**
 * @route GET /api/notifications/templates
 * @desc Get available notification templates
 * @access Private
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = notificationService.templates;

    res.json({
      success: true,
      message: 'Notification templates retrieved successfully',
      data: { templates }
    });

  } catch (error) {
    console.error('Get notification templates error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve notification templates',
      details: error.message
    });
  }
});

module.exports = router;