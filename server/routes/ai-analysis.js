const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/ai-temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${originalName}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow specific file types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/bmp',
      'image/tiff'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and image files are allowed.'), false);
    }
  }
});

// AI Service configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
const AI_SERVICE_TIMEOUT = 60000; // 60 seconds timeout

// Helper function to check AI service health
async function checkAIService() {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    console.error('AI Service health check failed:', error.message);
    return null;
  }
}

// Helper function to clean up temporary files
const unlinkAsync = promisify(fs.unlink);
async function cleanupTempFile(filepath) {
  try {
    if (fs.existsSync(filepath)) {
      await unlinkAsync(filepath);
    }
  } catch (error) {
    console.error('Error cleaning up temp file:', error.message);
  }
}

/**
 * @route   GET /api/ai/health
 * @desc    Check AI service health
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    const aiHealth = await checkAIService();
    
    if (aiHealth) {
      res.json({
        success: true,
        ai_service: {
          status: 'healthy',
          url: AI_SERVICE_URL,
          ...aiHealth
        }
      });
    } else {
      res.status(503).json({
        success: false,
        error: 'AI service is not available',
        ai_service: {
          status: 'unhealthy',
          url: AI_SERVICE_URL
        }
      });
    }
  } catch (error) {
    console.error('Error checking AI service health:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/ai/models/status
 * @desc    Get AI models status
 * @access  Public
 */
router.get('/models/status', async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/models/status`, {
      timeout: 10000
    });
    
    res.json({
      success: true,
      models: response.data
    });
  } catch (error) {
    console.error('Error getting models status:', error.message);
    res.status(503).json({
      success: false,
      error: 'Unable to get AI models status',
      message: error.response?.data?.error || error.message
    });
  }
});

/**
 * @route   POST /api/ai/analyze/document
 * @desc    Analyze uploaded document using AI
 * @access  Public
 */
router.post('/analyze/document', upload.single('file'), async (req, res) => {
  let tempFilePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    tempFilePath = req.file.path;
    console.log(`Processing document: ${req.file.originalname} (${req.file.size} bytes)`);

    // Check if AI service is available
    const aiHealth = await checkAIService();
    if (!aiHealth) {
      return res.status(503).json({
        success: false,
        error: 'AI service is currently unavailable'
      });
    }

    // Create form data for AI service
    const FormData = require('form-data');
    const formData = new FormData();
    
    // Read file and append to form data
    const fileStream = fs.createReadStream(tempFilePath);
    formData.append('file', fileStream, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    // Send to AI service
    const response = await axios.post(`${AI_SERVICE_URL}/analyze/document`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: AI_SERVICE_TIMEOUT,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    // Clean up temp file
    await cleanupTempFile(tempFilePath);

    // Return AI analysis results
    res.json({
      success: true,
      file_info: {
        original_name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      },
      analysis: response.data.analysis,
      processed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in document analysis:', error.message);
    
    // Clean up temp file in case of error
    if (tempFilePath) {
      await cleanupTempFile(tempFilePath);
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'AI service is not available',
        message: 'Please ensure the AI service is running on port 5001'
      });
    }

    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: 'AI analysis failed',
        message: error.response.data?.error || error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/ai/analyze/grievance
 * @desc    Analyze grievance text using AI
 * @access  Public
 */
router.post('/analyze/grievance', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text is required for grievance analysis'
      });
    }

    if (text.length > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Text is too long. Maximum 10,000 characters allowed.'
      });
    }

    console.log(`Processing grievance text: ${text.substring(0, 100)}...`);

    // Check if AI service is available
    const aiHealth = await checkAIService();
    if (!aiHealth) {
      return res.status(503).json({
        success: false,
        error: 'AI service is currently unavailable'
      });
    }

    // Send to AI service
    const response = await axios.post(`${AI_SERVICE_URL}/analyze/grievance`, {
      text: text.trim()
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: AI_SERVICE_TIMEOUT
    });

    // Return enhanced AI analysis results
    const aiResult = response.data;
    
    res.json({
      success: true,
      input_text_length: text.length,
      analysis: {
        // Main summary for UI display
        summary: {
          main_issue: aiResult.analysis_summary?.main_issue || 'Service-related complaint',
          severity: aiResult.urgency?.severity || 'medium',
          department: aiResult.category?.department || 'General Administration',
          immediate_action: aiResult.recommendations?.immediate_action || 'Route to appropriate department'
        },
        
        // Enhanced sentiment analysis
        sentiment: {
          overall: aiResult.sentiment?.label || 'neutral',
          score: aiResult.sentiment?.score || 0,
          confidence: aiResult.sentiment?.confidence || 0.5,
          intensity: aiResult.sentiment?.intensity || 'medium',
          breakdown: aiResult.sentiment?.detected_indicators || {}
        },
        
        // Emotional analysis with confidence
        emotion: {
          primary: aiResult.emotion?.primary || 'neutral',
          confidence: aiResult.emotion?.confidence || 0.5,
          intensity: aiResult.emotion?.emotional_intensity || 'medium',
          all_detected: aiResult.emotion?.all_detected || {}
        },
        
        // Smart categorization
        category: {
          main: aiResult.category?.predicted || 'general_complaint',
          subcategory: aiResult.category?.subcategory || 'unspecified',
          department: aiResult.category?.department || 'General Administration',
          priority: aiResult.category?.priority_level || 'medium',
          confidence: aiResult.category?.confidence || 0.5,
          keywords_matched: aiResult.category?.keywords_matched || 0
        },
        
        // Comprehensive urgency assessment
        urgency: {
          level: aiResult.urgency?.level || 'medium',
          severity: aiResult.urgency?.severity || 'moderate',
          score: aiResult.urgency?.score || 0.5,
          response_time: aiResult.urgency?.response_time_recommended || '24 hours',
          indicators: aiResult.urgency?.indicators_found || {},
          total_indicators: aiResult.urgency?.total_indicators || 0
        },
        
        // Specific issues identified by AI
        issues: {
          primary: aiResult.specific_issues?.primary_issue || 'General service issue',
          all_problems: aiResult.specific_issues?.specific_problems || [],
          affected_groups: aiResult.specific_issues?.affected_groups || [],
          has_timeline: aiResult.specific_issues?.has_time_context || false,
          duration_details: aiResult.specific_issues?.duration_details || [],
          frequency_details: aiResult.specific_issues?.frequency_details || []
        },
        
        // AI-generated recommendations
        recommendations: {
          immediate: aiResult.recommendations?.immediate_action || 'Process through standard channels',
          timeline: aiResult.recommendations?.timeline || 'Standard processing time',
          department_actions: aiResult.recommendations?.department_action || [],
          follow_up: aiResult.recommendations?.follow_up || [],
          escalation_path: aiResult.recommendations?.escalation_path || []
        },
        
        // Text analysis metrics
        text_analysis: {
          word_count: aiResult.text_analysis?.word_count || text.split(' ').length,
          complexity_score: aiResult.text_analysis?.complexity_score || 0.5,
          urgency_keywords: aiResult.text_analysis?.urgency_keywords || [],
          time_references: aiResult.text_analysis?.time_references || []
        },
        
        // Analysis confidence and metadata
        metadata: {
          confidence_score: aiResult.processing_metadata?.confidence_score || 0.7,
          processing_time_ms: aiResult.processing_metadata?.processing_time_ms || 200,
          analysis_version: aiResult.processing_metadata?.analysis_version || '2.0',
          timestamp: aiResult.processing_metadata?.timestamp || new Date().toISOString(),
          ai_service: 'Enhanced BharatChain AI v2.0'
        }
      },
      
      // Keep raw analysis for debugging if needed
      raw_ai_response: aiResult,
      processed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in grievance analysis:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'AI service is not available',
        message: 'Please ensure the AI service is running on port 5001'
      });
    }

    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: 'AI analysis failed',
        message: error.response.data?.error || error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/ai/analyze/batch
 * @desc    Analyze multiple grievances in batch
 * @access  Public
 */
router.post('/analyze/batch', async (req, res) => {
  try {
    const { texts } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Array of texts is required for batch analysis'
      });
    }

    if (texts.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 texts allowed per batch'
      });
    }

    // Validate each text
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: `Text at index ${i} is invalid`
        });
      }
      if (text.length > 5000) {
        return res.status(400).json({
          success: false,
          error: `Text at index ${i} is too long. Maximum 5,000 characters allowed per text in batch mode.`
        });
      }
    }

    console.log(`Processing batch of ${texts.length} grievances`);

    // Check if AI service is available
    const aiHealth = await checkAIService();
    if (!aiHealth) {
      return res.status(503).json({
        success: false,
        error: 'AI service is currently unavailable'
      });
    }

    // Process each text individually (could be optimized to batch process in AI service)
    const results = [];
    const errors = [];

    for (let i = 0; i < texts.length; i++) {
      try {
        const response = await axios.post(`${AI_SERVICE_URL}/analyze/grievance`, {
          text: texts[i].trim()
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000 // Shorter timeout for batch processing
        });

        results.push({
          index: i,
          text_length: texts[i].length,
          analysis: response.data.analysis,
          success: true
        });
      } catch (error) {
        errors.push({
          index: i,
          error: error.response?.data?.error || error.message,
          success: false
        });
      }
    }

    res.json({
      success: true,
      batch_size: texts.length,
      successful_analyses: results.length,
      failed_analyses: errors.length,
      results: results,
      errors: errors,
      processed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in batch analysis:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Error handling middleware for this router
router.use((error, req, res, next) => {
  console.error('AI Router Error:', error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'File too large',
        message: 'File size exceeds 10MB limit'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Invalid file',
        message: 'Unexpected file field or file type'
      });
    }
  }

  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type',
      message: 'Only PDF and image files are allowed'
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

module.exports = router;
