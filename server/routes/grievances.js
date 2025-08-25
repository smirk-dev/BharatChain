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
    // TODO: Add JWT middleware to get user address
    const mockGrievances = [
      {
        id: 1,
        title: 'Water Supply Issue',
        description: 'No water supply for the past 3 days in my area. This is causing major inconvenience.',
        category: 'WATER_SUPPLY',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        submitDate: '2024-01-15T09:30:00.000Z',
        resolvedDate: null,
        location: 'Sector 15, Gurgaon, Haryana',
        assignedOfficer: '0xofficer123',
        citizen: '0x1234567890123456789012345678901234567890',
        attachments: ['QmWater123', 'QmPhoto456'],
        comments: [
          {
            author: '0x1234567890123456789012345678901234567890',
            content: 'This issue is urgent, please resolve quickly.',
            timestamp: '2024-01-15T10:00:00.000Z',
            isOfficial: false
          },
          {
            author: '0xofficer123',
            content: 'We have received your complaint and assigned a team to investigate.',
            timestamp: '2024-01-16T14:30:00.000Z',
            isOfficial: true
          }
        ],
        satisfactionRating: 0
      },
      {
        id: 2,
        title: 'Street Light Not Working',
        description: 'Street lights in our locality have been non-functional for over a week.',
        category: 'INFRASTRUCTURE',
        priority: 'MEDIUM',
        status: 'RESOLVED',
        submitDate: '2024-01-10T18:45:00.000Z',
        resolvedDate: '2024-01-14T12:00:00.000Z',
        location: 'MG Road, Bangalore, Karnataka',
        assignedOfficer: '0xofficer456',
        citizen: '0x1234567890123456789012345678901234567890',
        resolution: 'Street lights have been repaired and are now functional.',
        attachments: ['QmLight789'],
        comments: [
          {
            author: '0xofficer456',
            content: 'Issue has been resolved. New LED lights installed.',
            timestamp: '2024-01-14T12:00:00.000Z',
            isOfficial: true
          }
        ],
        satisfactionRating: 5
      }
    ];

    res.json({
      success: true,
      message: 'Grievances retrieved successfully',
      data: {
        grievances: mockGrievances,
        total: mockGrievances.length,
        resolved: mockGrievances.filter(g => g.status === 'RESOLVED').length,
        pending: mockGrievances.filter(g => g.status !== 'RESOLVED').length
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
    'INFRASTRUCTURE', 'WATER_SUPPLY', 'ELECTRICITY', 'SANITATION', 
    'ROADS', 'HEALTHCARE', 'EDUCATION', 'CORRUPTION', 'OTHER'
  ]).withMessage('Invalid category'),
  body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  body('location').isLength({ min: 5, max: 500 }).withMessage('Location must be 5-500 characters')
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

    const { title, description, category, priority, location, attachments } = req.body;

    // Mock AI sentiment analysis
    const sentimentAnalysis = {
      sentiment: Math.random() > 0.7 ? 'negative' : 'neutral',
      urgencyScore: Math.random(),
      keywords: ['water', 'supply', 'urgent', 'days'],
      suggestedCategory: category,
      estimatedResolutionTime: priority === 'URGENT' ? '24 hours' : priority === 'HIGH' ? '72 hours' : '7 days'
    };

    // Auto-assign to category officer (mock)
    const mockOfficers = {
      'WATER_SUPPLY': '0xwater_officer123',
      'INFRASTRUCTURE': '0xinfra_officer456',
      'ELECTRICITY': '0xpower_officer789',
      'SANITATION': '0xsanitation_officer012',
      'OTHER': '0xgeneral_officer345'
    };

    const newGrievance = {
      id: Date.now(),
      title,
      description,
      category,
      priority,
      status: 'SUBMITTED',
      submitDate: new Date().toISOString(),
      resolvedDate: null,
      location,
      citizen: req.body.address || '0x1234567890123456789012345678901234567890',
      assignedOfficer: mockOfficers[category] || mockOfficers.OTHER,
      attachments: attachments || [],
      comments: [],
      satisfactionRating: 0,
      aiAnalysis: sentimentAnalysis
    };

    // TODO: Implement actual submission logic
    // 1. Save to database
    // 2. Call smart contract
    // 3. Send notification to assigned officer
    // 4. Upload attachments to IPFS

    res.status(201).json({
      success: true,
      message: 'Grievance submitted successfully',
      data: newGrievance
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

    // Mock grievance details
    const mockGrievance = {
      id: parseInt(id),
      title: 'Water Supply Issue',
      description: 'No water supply for the past 3 days in my area. This is causing major inconvenience to all residents.',
      category: 'WATER_SUPPLY',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      submitDate: '2024-01-15T09:30:00.000Z',
      resolvedDate: null,
      location: 'Sector 15, Gurgaon, Haryana',
      assignedOfficer: '0xofficer123',
      citizen: '0x1234567890123456789012345678901234567890',
      attachments: [
        {
          ipfsHash: 'QmWater123',
          filename: 'water_shortage.jpg',
          uploadDate: '2024-01-15T09:35:00.000Z'
        }
      ],
      comments: [
        {
          id: 1,
          author: '0x1234567890123456789012345678901234567890',
          content: 'This issue is urgent, please resolve quickly.',
          timestamp: '2024-01-15T10:00:00.000Z',
          isOfficial: false
        },
        {
          id: 2,
          author: '0xofficer123',
          content: 'We have received your complaint and assigned a team to investigate.',
          timestamp: '2024-01-16T14:30:00.000Z',
          isOfficial: true
        }
      ],
      timeline: [
        {
          date: '2024-01-15T09:30:00.000Z',
          event: 'Grievance submitted',
          actor: 'Citizen'
        },
        {
          date: '2024-01-15T11:00:00.000Z',
          event: 'Assigned to Water Department',
          actor: 'System'
        },
        {
          date: '2024-01-16T14:30:00.000Z',
          event: 'Officer acknowledged',
          actor: 'Officer'
        }
      ],
      satisfactionRating: 0,
      estimatedResolution: '2024-01-18T00:00:00.000Z'
    };

    res.json({
      success: true,
      message: 'Grievance details retrieved successfully',
      data: mockGrievance
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
 * @route PUT /api/grievances/:id/status
 * @desc Update grievance status (for officials)
 * @access Private (Officials only)
 */
router.put('/:id/status', [
  body('status').isIn(['SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED'])
    .withMessage('Invalid status'),
  body('resolution').optional().isLength({ max: 1000 }).withMessage('Resolution too long')
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
    const { status, resolution } = req.body;

    // TODO: Implement actual status update logic
    const statusUpdate = {
      id: parseInt(id),
      status,
      resolution: resolution || null,
      updatedDate: new Date().toISOString(),
      updatedBy: '0xofficer123',
      resolvedDate: status === 'RESOLVED' ? new Date().toISOString() : null
    };

    res.json({
      success: true,
      message: `Grievance status updated to ${status}`,
      data: statusUpdate
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
