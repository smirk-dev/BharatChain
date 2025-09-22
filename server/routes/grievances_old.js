const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { User, Grievance } = require('../models');

/**
 * @route GET /api/grievances
 * @desc Get user's grievances
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Wallet address is required'
      });
    }

    // Find or create user
    const [user] = await User.findOrCreate({
      where: { walletAddress: address.toLowerCase() },
      defaults: {
        walletAddress: address.toLowerCase(),
        name: `User ${address.slice(0, 6)}...${address.slice(-4)}`,
        isVerified: false,
        verificationLevel: 'BASIC'
      }
    });

    // Get user's grievances
    const grievances = await Grievance.findAll({
      where: { 
        userId: user.id,
        deletedAt: null 
      },
      order: [['submissionDate', 'DESC']]
    });

    // Format grievances for frontend
    const formattedGrievances = grievances.map(grievance => ({
      id: grievance.id,
      title: grievance.title,
      description: grievance.description,
      category: grievance.category,
      priority: grievance.priority,
      status: grievance.status,
      department: grievance.department,
      assignedTo: grievance.assignedTo,
      resolution: grievance.resolution,
      submissionDate: grievance.submissionDate,
      resolutionDate: grievance.resolutionDate,
      lastUpdated: grievance.lastUpdated
    }));

    // Calculate stats
    const stats = {
      total: formattedGrievances.length,
      open: formattedGrievances.filter(g => g.status === 'OPEN').length,
      inProgress: formattedGrievances.filter(g => g.status === 'IN_PROGRESS').length,
      resolved: formattedGrievances.filter(g => g.status === 'RESOLVED').length,
      closed: formattedGrievances.filter(g => g.status === 'CLOSED').length
    };

    res.json({
      success: true,
      message: 'Grievances retrieved successfully',
      data: {
        grievances: formattedGrievances,
        stats
      }
    });

  } catch (error) {
    console.error('Get grievances error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve grievances'
    });
  }
});

/**
 * @route POST /api/grievances
 * @desc Submit a new grievance
 * @access Private
 */
router.post('/', [
  body('title').isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('description').isLength({ min: 20, max: 2000 }).withMessage('Description must be 20-2000 characters'),
  body('category').isIn([
    'DOCUMENTATION', 'VERIFICATION', 'TECHNICAL', 'POLICY', 'OTHER'
  ]).withMessage('Invalid category'),
  body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  body('address').notEmpty().withMessage('Wallet address is required')
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

    const { title, description, category, priority, address, department } = req.body;

    // Find or create user
    const [user] = await User.findOrCreate({
      where: { walletAddress: address.toLowerCase() },
      defaults: {
        walletAddress: address.toLowerCase(),
        name: `User ${address.slice(0, 6)}...${address.slice(-4)}`,
        isVerified: false,
        verificationLevel: 'BASIC'
      }
    });

    // Auto-assign department based on category
    const departmentMapping = {
      'DOCUMENTATION': 'Document Services',
      'VERIFICATION': 'Verification Department',
      'TECHNICAL': 'IT Support',
      'POLICY': 'Policy Department',
      'OTHER': 'General Services'
    };

    // Create new grievance
    const newGrievance = await Grievance.create({
      userId: user.id,
      title,
      description,
      category,
      priority,
      status: 'OPEN',
      department: department || departmentMapping[category],
      assignedTo: null,
      resolution: null,
      resolutionDate: null,
      submissionDate: new Date(),
      lastUpdated: new Date()
    });

    // Format response
    const formattedGrievance = {
      id: newGrievance.id,
      title: newGrievance.title,
      description: newGrievance.description,
      category: newGrievance.category,
      priority: newGrievance.priority,
      status: newGrievance.status,
      department: newGrievance.department,
      assignedTo: newGrievance.assignedTo,
      submissionDate: newGrievance.submissionDate,
      lastUpdated: newGrievance.lastUpdated
    };

    res.status(201).json({
      success: true,
      message: 'Grievance submitted successfully',
      data: formattedGrievance
    });

  } catch (error) {
    console.error('Submit grievance error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to submit grievance'
    });
  }
});

/**
 * @route GET /api/grievances/:id
 * @desc Get grievance details
 * @access Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Wallet address is required'
      });
    }

    // Find user
    const user = await User.findOne({
      where: { walletAddress: address.toLowerCase() }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Find grievance
    const grievance = await Grievance.findOne({
      where: { 
        id: parseInt(id),
        userId: user.id,
        deletedAt: null 
      }
    });

    if (!grievance) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Grievance not found'
      });
    }

    // Format grievance
    const formattedGrievance = {
      id: grievance.id,
      title: grievance.title,
      description: grievance.description,
      category: grievance.category,
      priority: grievance.priority,
      status: grievance.status,
      department: grievance.department,
      assignedTo: grievance.assignedTo,
      resolution: grievance.resolution,
      submissionDate: grievance.submissionDate,
      resolutionDate: grievance.resolutionDate,
      lastUpdated: grievance.lastUpdated
    };

    res.json({
      success: true,
      message: 'Grievance details retrieved successfully',
      data: formattedGrievance
    });

  } catch (error) {
    console.error('Get grievance details error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve grievance details'
    });
  }
});

/**
 * @route POST /api/grievances/:id/comments
 * @desc Add comment to grievance
 * @access Private
 */
router.post('/:id/comments', [
  body('content').isLength({ min: 5, max: 1000 }).withMessage('Comment must be 5-1000 characters')
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

    const { id } = req.params;
    const { content } = req.body;

    // TODO: Implement actual comment logic
    const newComment = {
      id: Date.now(),
      author: req.body.address || '0x1234567890123456789012345678901234567890',
      content,
      timestamp: new Date().toISOString(),
      isOfficial: false, // Determine based on user role
      grievanceId: parseInt(id)
    };

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: newComment
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to add comment'
    });
  }
});

/**
 * @route DELETE /api/grievances/:id
 * @desc Delete a grievance (soft delete)
 * @access Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Wallet address is required'
      });
    }

    // Find user
    const user = await User.findOne({
      where: { walletAddress: address.toLowerCase() }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Find and delete grievance
    const grievance = await Grievance.findOne({
      where: { 
        id: parseInt(id),
        userId: user.id,
        deletedAt: null 
      }
    });

    if (!grievance) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Grievance not found'
      });
    }

    // Soft delete
    await grievance.destroy();

    res.json({
      success: true,
      message: 'Grievance deleted successfully'
    });

  } catch (error) {
    console.error('Delete grievance error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete grievance'
    });
  }
});

/**
 * @route PUT /api/grievances/:id/status
 * @desc Update grievance status
 * @access Private
 */
router.put('/:id/status', [
  body('status').isIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED'])
    .withMessage('Invalid status'),
  body('resolution').optional().isLength({ max: 1000 }).withMessage('Resolution too long'),
  body('address').notEmpty().withMessage('Wallet address is required')
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

    const { id } = req.params;
    const { status, resolution, address } = req.body;

    // Find user
    const user = await User.findOne({
      where: { walletAddress: address.toLowerCase() }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Find grievance
    const grievance = await Grievance.findOne({
      where: { 
        id: parseInt(id),
        userId: user.id,
        deletedAt: null 
      }
    });

    if (!grievance) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Grievance not found'
      });
    }

    // Update status
    const updateData = {
      status,
      lastUpdated: new Date()
    };

    if (resolution) {
      updateData.resolution = resolution;
    }

    if (status === 'RESOLVED' || status === 'CLOSED') {
      updateData.resolutionDate = new Date();
    }

    await grievance.update(updateData);

    res.json({
      success: true,
      message: `Grievance status updated to ${status}`,
      data: {
        id: grievance.id,
        status: grievance.status,
        resolution: grievance.resolution,
        resolutionDate: grievance.resolutionDate,
        lastUpdated: grievance.lastUpdated
      }
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update grievance status'
    });
  }
});

/**
 * @route PUT /api/grievances/:id/rating
 * @desc Rate grievance resolution (for citizens)
 * @access Private
 */
router.put('/:id/rating', [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().isLength({ max: 500 }).withMessage('Feedback too long')
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

    const { id } = req.params;
    const { rating, feedback } = req.body;

    // TODO: Implement actual rating logic
    const ratingResult = {
      id: parseInt(id),
      rating,
      feedback: feedback || '',
      ratedDate: new Date().toISOString(),
      ratedBy: req.body.address || '0x1234567890123456789012345678901234567890'
    };

    res.json({
      success: true,
      message: 'Grievance rated successfully',
      data: ratingResult
    });

  } catch (error) {
    console.error('Rate grievance error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to rate grievance'
    });
  }
});

module.exports = router;
