const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Services
const { Citizen, Document, Grievance } = require('../models');
const blockchainService = require('../services/blockchainService');

// Validation middleware
const validateGrievance = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .isIn(['government_services', 'infrastructure', 'healthcare', 'education', 'corruption', 'other'])
    .withMessage('Invalid category'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
];

// Get all grievances for a citizen
router.get('/', async (req, res) => {
  try {
    const citizenAddress = req.user.address;
    const { status, category, page = 1, limit = 10 } = req.query;
    
    // Get grievances from database
    const whereClause = { citizenAddress };
    if (status) whereClause.status = status;
    if (category) whereClause.category = category;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const grievances = await Grievance.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: grievances.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: grievances.count,
        totalPages: Math.ceil(grievances.count / parseInt(limit))
      },
    });
  } catch (error) {
    console.error('Error fetching grievances:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grievances',
      error: error.message,
    });
  }
});

// Submit a new grievance
router.post('/', validateGrievance, async (req, res) => {
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
    
    const { title, description, category, priority = 'medium', location } = req.body;
    const citizenAddress = req.user.address;
    
    // Submit to blockchain
    let blockchainId;
    try {
      blockchainId = await blockchainService.submitGrievance(
        citizenAddress,
        title,
        description,
        category
      );
    } catch (blockchainError) {
      console.log('Blockchain submission failed, using local ID:', blockchainError.message);
      blockchainId = `grv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Store in database
    const grievance = await Grievance.create({
      blockchainId,
      citizenAddress,
      title,
      description,
      category,
      priority,
      location,
      status: 'submitted',
    });
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`citizen-${citizenAddress}`).emit('grievance-submitted', {
        grievanceId: blockchainId,
        title,
        status: 'submitted',
      });
      
      // Notify relevant authorities (mock)
      io.to('authorities').emit('new-grievance', {
        grievanceId: blockchainId,
        title,
        category,
        priority,
        location,
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Grievance submitted successfully',
      data: {
        id: blockchainId,
        title: grievance.title,
        status: grievance.status,
        submittedAt: grievance.createdAt,
      },
    });
  } catch (error) {
    console.error('Error submitting grievance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit grievance',
      error: error.message,
    });
  }
});

// Get grievance details
router.get('/:grievanceId', async (req, res) => {
  try {
    const { grievanceId } = req.params;
    const citizenAddress = req.user.address;
    
    // Get grievance from database
    const grievance = await Grievance.findByPk(grievanceId);
    
    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found',
      });
    }
    
    // Verify ownership or check if user is authority
    const isOwner = grievance.citizenAddress.toLowerCase() === citizenAddress.toLowerCase();
    const isAuthority = req.user.role === 'authority'; // This would come from auth middleware
    
    if (!isOwner && !isAuthority) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to view this grievance.',
      });
    }
    
    res.json({
      success: true,
      data: grievance,
    });
  } catch (error) {
    console.error('Error fetching grievance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grievance',
      error: error.message,
    });
  }
});

// Update grievance status (for authorities)
router.patch('/:grievanceId/status', async (req, res) => {
  try {
    const { grievanceId } = req.params;
    const { status, response, estimatedResolution } = req.body;
    const authorityAddress = req.user.address;
    
    // Validate status
    const validStatuses = ['submitted', 'under_review', 'in_progress', 'resolved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }
    
    // Check if user is authorized (mock check)
    const isAuthority = req.user.role === 'authority';
    if (!isAuthority) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only authorities can update grievance status.',
      });
    }
    
    // Update on blockchain
    try {
      await blockchainService.updateGrievanceStatus(grievanceId, status);
    } catch (blockchainError) {
      console.log('Blockchain update failed:', blockchainError.message);
    }
    
    // Update in data store
    const updateData = {
      status,
      handledBy: authorityAddress,
      lastUpdated: new Date(),
    };
    
    if (response) updateData.response = response;
    if (estimatedResolution) updateData.estimatedResolution = estimatedResolution;
    if (status === 'resolved') updateData.resolvedAt = new Date();
    
    const [affectedRows] = await Grievance.update(updateData, {
      where: { id: grievanceId }
    });
    
    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found',
      });
    }
    
    // Get the updated grievance
    const updatedGrievance = await Grievance.findByPk(grievanceId);
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`citizen-${updatedGrievance.citizenAddress}`).emit('grievance-updated', {
        grievanceId,
        status,
        response,
        handledBy: authorityAddress,
      });
    }
    
    res.json({
      success: true,
      message: 'Grievance status updated successfully',
      data: {
        id: grievanceId,
        status: updatedGrievance.status,
        response: updatedGrievance.response,
        lastUpdated: updatedGrievance.lastUpdated,
      },
    });
  } catch (error) {
    console.error('Error updating grievance status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update grievance status',
      error: error.message,
    });
  }
});

// Add comment to grievance
router.post('/:grievanceId/comments', async (req, res) => {
  try {
    const { grievanceId } = req.params;
    const { comment } = req.body;
    const userAddress = req.user.address;
    
    if (!comment || comment.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be at least 5 characters long',
      });
    }
    
    // Get grievance
    const grievance = await Grievance.findByPk(grievanceId);
    
    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found',
      });
    }
    
    // Check if user can comment (owner or authority)
    const isOwner = grievance.citizenAddress.toLowerCase() === userAddress.toLowerCase();
    const isAuthority = req.user.role === 'authority';
    
    if (!isOwner && !isAuthority) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to comment on this grievance.',
      });
    }
    
    // Add comment
    const commentData = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      grievanceId,
      userAddress,
      userType: isAuthority ? 'authority' : 'citizen',
      comment: comment.trim(),
      createdAt: new Date(),
    };
    
    // Add comment to grievance
    const existingComments = grievance.comments || [];
    existingComments.push(commentData);
    
    const [affectedRows] = await Grievance.update(
      { comments: existingComments },
      { where: { id: grievanceId } }
    );
    
    if (affectedRows === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to add comment',
      });
    }
    
    // Get updated grievance
    const updatedGrievance = await Grievance.findByPk(grievanceId);
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      const targetRoom = isAuthority ? `citizen-${grievance.citizenAddress}` : 'authorities';
      io.to(targetRoom).emit('grievance-comment-added', {
        grievanceId,
        comment: commentData,
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: commentData,
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message,
    });
  }
});

// Get grievance statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = dataStore.getGrievanceStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching grievance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
});

module.exports = router;
