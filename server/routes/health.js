const express = require('express');
const router = express.Router();
const { asyncHandler, sendResponse, sendError, healthCheck } = require('../middleware/enhanced-error');

/**
 * @route GET /api/health
 * @desc System health check endpoint
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const { sequelize } = require('../../config/database');
    
    // Check database connection
    let dbStatus = 'connected';
    let dbError = null;
    
    try {
      await sequelize.authenticate();
    } catch (error) {
      dbStatus = 'disconnected';
      dbError = error.message;
    }

    // System information
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        rss: Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100
      },
      database: {
        status: dbStatus,
        error: dbError
      },
      services: {
        api: 'operational',
        auth: 'operational',
        fileUpload: 'operational'
      }
    };

    // Determine overall health status
    if (dbStatus === 'disconnected') {
      healthData.status = 'degraded';
      res.status(503);
    }

    res.json({
      success: true,
      message: 'BharatChain API Health Check',
      data: healthData
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/health/detailed
 * @desc Detailed system health information
 * @access Public
 */
router.get('/detailed', async (req, res) => {
  try {
    const os = require('os');
    const { sequelize } = require('../../config/database');

    // Database health check
    let dbHealth = { status: 'healthy', responseTime: null };
    const dbStart = Date.now();
    
    try {
      await sequelize.authenticate();
      dbHealth.responseTime = Date.now() - dbStart;
    } catch (error) {
      dbHealth = {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - dbStart
      };
    }

    const detailedHealth = {
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        uptime: {
          process: process.uptime(),
          system: os.uptime()
        },
        loadAverage: os.loadavg(),
        cpuCount: os.cpus().length,
        totalMemory: Math.round((os.totalmem() / 1024 / 1024 / 1024) * 100) / 100,
        freeMemory: Math.round((os.freemem() / 1024 / 1024 / 1024) * 100) / 100
      },
      process: {
        pid: process.pid,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        versions: process.versions
      },
      database: dbHealth,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        corsOrigin: process.env.CORS_ORIGIN
      },
      endpoints: {
        auth: '/api/auth',
        citizens: '/api/citizens',
        documents: '/api/documents',
        grievances: '/api/grievances'
      }
    };

    res.json({
      success: true,
      message: 'Detailed system health information',
      data: detailedHealth,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Detailed health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Detailed health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/health/metrics
 * @desc Basic metrics for monitoring
 * @access Public
 */
router.get('/metrics', (req, res) => {
  try {
    const metrics = {
      timestamp: Date.now(),
      uptime_seconds: process.uptime(),
      memory_usage_bytes: process.memoryUsage().heapUsed,
      memory_total_bytes: process.memoryUsage().heapTotal,
      cpu_usage: process.cpuUsage(),
      environment: process.env.NODE_ENV || 'development'
    };

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
