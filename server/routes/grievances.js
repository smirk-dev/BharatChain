const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const blockchainService = require('../services/blockchain');

// Initialize blockchain service
let isBlockchainInitialized = false;

async function initializeBlockchain() {
  if (!isBlockchainInitialized) {
    try {
      const network = process.env.BLOCKCHAIN_NETWORK || 'localhost';
      const privateKey = process.env.PRIVATE_KEY;
      
      await blockchainService.initialize(network, privateKey);
      isBlockchainInitialized = true;
      console.log('✅ Blockchain service initialized for grievances module');
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error);
    }
  }
}

// Middleware to ensure blockchain is initialized
const ensureBlockchain = async (req, res, next) => {
  await initializeBlockchain();
  next();
};

// Grievance category mapping
const GrievanceCategory = {
  INFRASTRUCTURE: 0,
  WATER_SUPPLY: 1,
  ELECTRICITY: 2,
  SANITATION: 3,
  ROADS: 4,
  HEALTHCARE: 5,
  EDUCATION: 6,
  CORRUPTION: 7,
  OTHER: 8
};

const GrievancePriority = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  URGENT: 3
};

const GrievanceStatus = {
  SUBMITTED: 0,
  IN_PROGRESS: 1,
  RESOLVED: 2,
  CLOSED: 3,
  ESCALATED: 4
};

// Extract address from request
function extractAddressFromToken(req) {
  return req.body.address || req.query.address || req.headers['x-wallet-address'] || '0x742d35Cc6635C0532925a3b8D07376F0c9fF4c52';
}

/**
 * @route GET /api/grievances
 * @desc Get user's grievances from blockchain
 * @access Private
 */
router.get('/', ensureBlockchain, async (req, res) => {
  try {
    const userAddress = extractAddressFromToken(req);

    if (!isBlockchainInitialized) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Blockchain service not available'
      });
    }

    // Get user's grievance IDs from blockchain
    const grievanceIds = await blockchainService.getCitizenGrievances(userAddress);

    // Fetch detailed information for each grievance
    const grievances = [];
    const stats = { total: 0, submitted: 0, inProgress: 0, resolved: 0, closed: 0, escalated: 0 };

    for (const grievanceId of grievanceIds) {
      try {
        const grievance = await blockchainService.getGrievance(grievanceId);
        
        // Get category, priority, and status names
        const categoryNames = Object.keys(GrievanceCategory);
        const priorityNames = Object.keys(GrievancePriority);
        const statusNames = Object.keys(GrievanceStatus);
        
        const categoryName = categoryNames[grievance.category] || 'OTHER';
        const priorityName = priorityNames[grievance.priority] || 'LOW';
        const statusName = statusNames[grievance.status] || 'SUBMITTED';
        
        const grievanceData = {
          id: grievance.id,
          title: grievance.title,
          description: grievance.description,
          category: categoryName,
          priority: priorityName,
          status: statusName,
          submitDate: grievance.submitDate.toISOString(),
          resolvedDate: grievance.resolvedDate ? grievance.resolvedDate.toISOString() : null,
          assignedOfficer: grievance.assignedOfficer,
          resolution: grievance.resolution,
          satisfactionRating: grievance.satisfactionRating,
          location: grievance.location,
          attachments: grievance.attachments
        };
        
        grievances.push(grievanceData);
        
        // Update stats
        stats.total++;
        switch (grievance.status) {
          case 0: stats.submitted++; break;
          case 1: stats.inProgress++; break;
          case 2: stats.resolved++; break;
          case 3: stats.closed++; break;
          case 4: stats.escalated++; break;
        }
      } catch (error) {
        console.warn(`Could not fetch grievance ${grievanceId}:`, error.message);
      }
    }

    res.json({
      success: true,
      message: 'Grievances retrieved successfully from blockchain',
      data: {
        grievances: grievances.sort((a, b) => new Date(b.submitDate) - new Date(a.submitDate)),
        stats
      }
    });

  } catch (error) {
    console.error('Get grievances error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve grievances from blockchain',
      details: error.message
    });
  }
});

/**
 * @route POST /api/grievances
 * @desc Submit a new grievance to blockchain
 * @access Private
 */
router.post('/', ensureBlockchain, [
  body('title').isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('description').isLength({ min: 20, max: 2000 }).withMessage('Description must be 20-2000 characters'),
  body('category').isIn([
    'INFRASTRUCTURE', 'WATER_SUPPLY', 'ELECTRICITY', 'SANITATION', 'ROADS', 
    'HEALTHCARE', 'EDUCATION', 'CORRUPTION', 'OTHER'
  ]).withMessage('Invalid category'),
  body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  body('location').isLength({ min: 3, max: 500 }).withMessage('Location must be 3-500 characters'),
  body('attachments').optional().isArray().withMessage('Attachments must be an array')
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

    const { title, description, category, priority, location, attachments = [] } = req.body;
    const userAddress = extractAddressFromToken(req);

    if (!isBlockchainInitialized) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Blockchain service not available'
      });
    }

    // Check if citizen is registered
    const isRegistered = await blockchainService.isCitizenRegistered(userAddress);
    if (!isRegistered) {
      return res.status(400).json({
        error: 'Not Registered',
        message: 'Citizen must be registered before submitting grievances'
      });
    }

    // Submit grievance to blockchain
    const result = await blockchainService.submitGrievance(
      title,
      description,
      GrievanceCategory[category],
      GrievancePriority[priority],
      location,
      attachments
    );

    const grievanceData = {
      id: result.grievanceId,
      title,
      description,
      category,
      priority,
      status: 'SUBMITTED',
      location,
      attachments,
      submitDate: new Date().toISOString(),
      citizen: userAddress,
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      gasUsed: result.gasUsed
    };

    res.status(201).json({
      success: true,
      message: 'Grievance submitted successfully to blockchain',
      data: grievanceData
    });

  } catch (error) {
    console.error('Submit grievance error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to submit grievance to blockchain',
      details: error.message
    });
  }
});

/**
 * @route GET /api/grievances/:id
 * @desc Get grievance details from blockchain
 * @access Private
 */
router.get('/:id', ensureBlockchain, async (req, res) => {
  try {
    const { id } = req.params;
    const userAddress = extractAddressFromToken(req);

    if (!isBlockchainInitialized) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Blockchain service not available'
      });
    }

    // Get grievance from blockchain
    const grievance = await blockchainService.getGrievance(id);

    // Check if user has permission to view this grievance
    if (grievance.citizen.toLowerCase() !== userAddress.toLowerCase()) {
      // Additional check: allow if user is an officer assigned to this grievance
      if (grievance.assignedOfficer && grievance.assignedOfficer.toLowerCase() !== userAddress.toLowerCase()) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to view this grievance'
        });
      }
    }

    // Get category, priority, and status names
    const categoryNames = Object.keys(GrievanceCategory);
    const priorityNames = Object.keys(GrievancePriority);
    const statusNames = Object.keys(GrievanceStatus);
    
    const categoryName = categoryNames[grievance.category] || 'OTHER';
    const priorityName = priorityNames[grievance.priority] || 'LOW';
    const statusName = statusNames[grievance.status] || 'SUBMITTED';

    // Get comments from blockchain
    const contract = blockchainService.getContract('GrievanceSystem');
    const comments = await contract.getGrievanceComments(id);

    const grievanceData = {
      id: grievance.id,
      citizen: grievance.citizen,
      title: grievance.title,
      description: grievance.description,
      category: categoryName,
      priority: priorityName,
      status: statusName,
      submitDate: grievance.submitDate.toISOString(),
      resolvedDate: grievance.resolvedDate ? grievance.resolvedDate.toISOString() : null,
      assignedOfficer: grievance.assignedOfficer,
      resolution: grievance.resolution,
      satisfactionRating: grievance.satisfactionRating,
      location: grievance.location,
      attachments: grievance.attachments,
      comments: comments.map(comment => ({
        author: comment.author,
        content: comment.content,
        timestamp: new Date(Number(comment.timestamp) * 1000).toISOString(),
        isOfficial: comment.isOfficial
      }))
    };

    res.json({
      success: true,
      message: 'Grievance details retrieved successfully from blockchain',
      data: grievanceData
    });

  } catch (error) {
    console.error('Get grievance details error:', error);
    
    if (error.message.includes('Grievance does not exist')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Grievance not found'
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve grievance details from blockchain',
      details: error.message
    });
  }
});

/**
 * @route POST /api/grievances/:id/comments
 * @desc Add comment to grievance on blockchain
 * @access Private
 */
router.post('/:id/comments', ensureBlockchain, [
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
    const userAddress = extractAddressFromToken(req);

    if (!isBlockchainInitialized) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Blockchain service not available'
      });
    }

    // Add comment to blockchain
    const contract = blockchainService.getContract('GrievanceSystem');
    const tx = await contract.addComment(id, content);
    const receipt = await tx.wait();

    const commentData = {
      grievanceId: id,
      author: userAddress,
      content,
      timestamp: new Date().toISOString(),
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };

    res.status(201).json({
      success: true,
      message: 'Comment added successfully to blockchain',
      data: commentData
    });

  } catch (error) {
    console.error('Add comment error:', error);
    
    if (error.message.includes('Not authorized to access this grievance')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Not authorized to comment on this grievance'
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to add comment to blockchain',
      details: error.message
    });
  }
});

/**
 * @route PUT /api/grievances/:id/assign
 * @desc Assign grievance to an officer (officers only)
 * @access Private (Officers only)
 */
router.put('/:id/assign', ensureBlockchain, [
  body('officerAddress').isEthereumAddress().withMessage('Valid Ethereum address required')
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
    const { officerAddress } = req.body;

    if (!isBlockchainInitialized) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Blockchain service not available'
      });
    }

    // Assign grievance on blockchain
    const result = await blockchainService.assignGrievance(id, officerAddress);

    const assignmentData = {
      grievanceId: id,
      officerAddress,
      assignedBy: extractAddressFromToken(req),
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      gasUsed: result.gasUsed,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Grievance assigned successfully on blockchain',
      data: assignmentData
    });

  } catch (error) {
    console.error('Assign grievance error:', error);
    
    if (error.message.includes('Not authorized officer')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Not authorized to assign grievances'
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to assign grievance on blockchain',
      details: error.message
    });
  }
});

/**
 * @route PUT /api/grievances/:id/resolve
 * @desc Resolve a grievance (officers only)
 * @access Private (Officers only)
 */
router.put('/:id/resolve', ensureBlockchain, [
  body('resolution').isLength({ min: 10, max: 2000 }).withMessage('Resolution must be 10-2000 characters')
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
    const { resolution } = req.body;
    const officerAddress = extractAddressFromToken(req);

    if (!isBlockchainInitialized) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Blockchain service not available'
      });
    }

    // Resolve grievance on blockchain
    const result = await blockchainService.resolveGrievance(id, resolution);

    const resolutionData = {
      grievanceId: id,
      resolution,
      resolvedBy: officerAddress,
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      gasUsed: result.gasUsed,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Grievance resolved successfully on blockchain',
      data: resolutionData
    });

  } catch (error) {
    console.error('Resolve grievance error:', error);
    
    if (error.message.includes('Not authorized officer')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Not authorized to resolve grievances'
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to resolve grievance on blockchain',
      details: error.message
    });
  }
});

/**
 * @route PUT /api/grievances/:id/rating
 * @desc Rate grievance resolution satisfaction (citizens only)
 * @access Private
 */
router.put('/:id/rating', ensureBlockchain, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
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
    const { rating } = req.body;
    const userAddress = extractAddressFromToken(req);

    if (!isBlockchainInitialized) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Blockchain service not available'
      });
    }

    // Rate satisfaction on blockchain
    const contract = blockchainService.getContract('GrievanceSystem');
    const tx = await contract.rateSatisfaction(id, rating);
    const receipt = await tx.wait();

    const ratingData = {
      grievanceId: id,
      rating,
      ratedBy: userAddress,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Grievance rated successfully on blockchain',
      data: ratingData
    });

  } catch (error) {
    console.error('Rate grievance error:', error);
    
    if (error.message.includes('Only citizen can rate')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the grievance submitter can rate satisfaction'
      });
    }
    
    if (error.message.includes('Already rated')) {
      return res.status(409).json({
        error: 'Already Rated',
        message: 'Grievance has already been rated'
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to rate grievance on blockchain',
      details: error.message
    });
  }
});

/**
 * @route GET /api/grievances/status/:status
 * @desc Get grievances by status (for officers)
 * @access Private (Officers only)
 */
router.get('/status/:status', ensureBlockchain, async (req, res) => {
  try {
    const { status } = req.params;
    
    // Validate status
    const statusValue = GrievanceStatus[status.toUpperCase()];
    if (statusValue === undefined) {
      return res.status(400).json({
        error: 'Invalid Status',
        message: 'Invalid grievance status'
      });
    }

    if (!isBlockchainInitialized) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Blockchain service not available'
      });
    }

    // Get grievances by status from blockchain
    const contract = blockchainService.getContract('GrievanceSystem');
    const grievanceIds = await contract.getGrievancesByStatus(statusValue);

    const grievances = [];
    
    for (const grievanceId of grievanceIds) {
      try {
        const grievance = await blockchainService.getGrievance(grievanceId.toString());
        
        const categoryNames = Object.keys(GrievanceCategory);
        const priorityNames = Object.keys(GrievancePriority);
        
        const categoryName = categoryNames[grievance.category] || 'OTHER';
        const priorityName = priorityNames[grievance.priority] || 'LOW';
        
        grievances.push({
          id: grievance.id,
          title: grievance.title,
          description: grievance.description.substring(0, 100) + '...',
          category: categoryName,
          priority: priorityName,
          citizen: grievance.citizen,
          submitDate: grievance.submitDate.toISOString(),
          assignedOfficer: grievance.assignedOfficer,
          location: grievance.location
        });
      } catch (error) {
        console.warn(`Could not fetch grievance ${grievanceId}:`, error.message);
      }
    }

    res.json({
      success: true,
      message: `Grievances with status ${status} retrieved successfully`,
      data: {
        grievances: grievances.sort((a, b) => new Date(a.submitDate) - new Date(b.submitDate)),
        count: grievances.length,
        status: status.toUpperCase()
      }
    });

  } catch (error) {
    console.error('Get grievances by status error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve grievances by status',
      details: error.message
    });
  }
});

module.exports = router;