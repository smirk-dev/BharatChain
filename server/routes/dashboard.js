const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchain');
const realtimeEventService = require('../services/realtime-events');
const notificationService = require('../services/notification');
const { Sequelize } = require('sequelize');
const { sequelize } = require('../../config/database');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

/**
 * @route GET /api/dashboard/status
 * @desc Get comprehensive system status for dashboard
 * @access Private
 */
router.get('/status', async (req, res) => {
  try {
    const status = await getSystemStatus();
    
    res.json({
      success: true,
      message: 'System status retrieved successfully',
      data: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get system status error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve system status',
      details: error.message
    });
  }
});

/**
 * @route GET /api/dashboard/blockchain-metrics
 * @desc Get detailed blockchain metrics
 * @access Private
 */
router.get('/blockchain-metrics', async (req, res) => {
  try {
    const metrics = await getBlockchainMetrics();
    
    res.json({
      success: true,
      message: 'Blockchain metrics retrieved successfully',
      data: metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get blockchain metrics error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve blockchain metrics',
      details: error.message
    });
  }
});

/**
 * @route GET /api/dashboard/realtime-metrics
 * @desc Get real-time service metrics
 * @access Private
 */
router.get('/realtime-metrics', async (req, res) => {
  try {
    const metrics = await getRealtimeMetrics();
    
    res.json({
      success: true,
      message: 'Real-time metrics retrieved successfully',
      data: metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get real-time metrics error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve real-time metrics',
      details: error.message
    });
  }
});

/**
 * @route GET /api/dashboard/database-metrics
 * @desc Get database performance metrics
 * @access Private
 */
router.get('/database-metrics', async (req, res) => {
  try {
    const metrics = await getDatabaseMetrics();
    
    res.json({
      success: true,
      message: 'Database metrics retrieved successfully',
      data: metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get database metrics error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve database metrics',
      details: error.message
    });
  }
});

/**
 * @route GET /api/dashboard/activity-stats
 * @desc Get activity statistics
 * @access Private
 */
router.get('/activity-stats', async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    const stats = await getActivityStats(period);
    
    res.json({
      success: true,
      message: 'Activity statistics retrieved successfully',
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve activity statistics',
      details: error.message
    });
  }
});

/**
 * @route GET /api/dashboard/health-check
 * @desc Comprehensive health check for all services
 * @access Private
 */
router.get('/health-check', async (req, res) => {
  try {
    const healthCheck = await performHealthCheck();
    
    const overallHealthy = Object.values(healthCheck.services).every(service => service.healthy);
    
    res.status(overallHealthy ? 200 : 503).json({
      success: overallHealthy,
      message: overallHealthy ? 'All services healthy' : 'Some services have issues',
      data: healthCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to perform health check',
      details: error.message
    });
  }
});

// Helper Functions

/**
 * Get comprehensive system status
 */
async function getSystemStatus() {
  const [
    systemInfo,
    blockchainMetrics,
    realtimeMetrics,
    databaseMetrics,
    notificationStats
  ] = await Promise.all([
    getSystemInfo(),
    getBlockchainMetrics(),
    getRealtimeMetrics(),
    getDatabaseMetrics(),
    notificationService.getStatistics()
  ]);

  return {
    system: systemInfo,
    blockchain: blockchainMetrics,
    realtime: realtimeMetrics,
    database: databaseMetrics,
    notifications: notificationStats,
    services: {
      blockchain: blockchainService.isInitialized,
      realtime: realtimeEventService.isInitialized,
      notifications: notificationService.initialized,
      database: true // Assume database is working if we got here
    }
  };
}

/**
 * Get system information
 */
function getSystemInfo() {
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();
  
  return {
    uptime: {
      seconds: Math.floor(uptime),
      formatted: formatUptime(uptime)
    },
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024) // MB
    },
    cpu: {
      cores: os.cpus().length,
      model: os.cpus()[0]?.model || 'Unknown',
      load: os.loadavg()
    },
    platform: {
      type: os.type(),
      release: os.release(),
      architecture: os.arch(),
      hostname: os.hostname()
    },
    node: {
      version: process.version,
      environment: process.env.NODE_ENV || 'development'
    }
  };
}

/**
 * Get blockchain metrics
 */
async function getBlockchainMetrics() {
  if (!blockchainService.isInitialized) {
    return {
      initialized: false,
      network: null,
      contracts: {},
      events: {
        listenersActive: false,
        eventsProcessed: 0
      }
    };
  }

  try {
    const contracts = blockchainService.contracts;
    const contractInfo = {};
    
    // Get contract information
    for (const [name, contract] of Object.entries(contracts)) {
      try {
        contractInfo[name] = {
          address: contract.address,
          deployed: true,
          network: contract.network || process.env.BLOCKCHAIN_NETWORK || 'localhost'
        };
      } catch (error) {
        contractInfo[name] = {
          address: null,
          deployed: false,
          error: error.message
        };
      }
    }

    return {
      initialized: true,
      network: process.env.BLOCKCHAIN_NETWORK || 'localhost',
      contracts: contractInfo,
      events: {
        listenersActive: Object.keys(contracts).length > 0,
        contractsLoaded: Object.keys(contracts).length
      }
    };

  } catch (error) {
    return {
      initialized: false,
      error: error.message,
      network: process.env.BLOCKCHAIN_NETWORK || 'localhost'
    };
  }
}

/**
 * Get real-time service metrics
 */
function getRealtimeMetrics() {
  if (!realtimeEventService.isInitialized) {
    return {
      initialized: false,
      connections: 0,
      statistics: {}
    };
  }

  try {
    const stats = realtimeEventService.getStatistics();
    
    return {
      initialized: true,
      connections: {
        total: stats.totalClients,
        authenticated: stats.authenticatedClients
      },
      subscriptions: {
        total: stats.totalSubscriptions,
        byEvent: stats.subscriptionsByEvent
      },
      websocket: {
        active: true,
        protocol: 'ws'
      }
    };

  } catch (error) {
    return {
      initialized: false,
      error: error.message
    };
  }
}

/**
 * Get database metrics
 */
async function getDatabaseMetrics() {
  try {
    // Test database connection
    await sequelize.authenticate();
    
    // Get table statistics
    const models = sequelize.models;
    const tableStats = {};
    
    for (const [modelName, model] of Object.entries(models)) {
      try {
        const count = await model.count();
        tableStats[modelName] = {
          records: count,
          tableName: model.tableName
        };
      } catch (error) {
        tableStats[modelName] = {
          records: 0,
          error: error.message
        };
      }
    }

    // Get database size (SQLite specific)
    let databaseSize = null;
    try {
      const dbPath = path.join(__dirname, '../database/bharatchain.db');
      const stats = await fs.stat(dbPath);
      databaseSize = Math.round(stats.size / 1024 / 1024 * 100) / 100; // MB with 2 decimal places
    } catch (error) {
      // Database might not be SQLite or file might not exist
    }

    return {
      connected: true,
      dialect: sequelize.getDialect(),
      tables: tableStats,
      size: databaseSize ? `${databaseSize} MB` : 'Unknown',
      pool: {
        max: sequelize.config.pool?.max || 5,
        min: sequelize.config.pool?.min || 0,
        acquire: sequelize.config.pool?.acquire || 30000,
        idle: sequelize.config.pool?.idle || 10000
      }
    };

  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
}

/**
 * Get activity statistics
 */
async function getActivityStats(period) {
  try {
    const timeframes = {
      '1h': 1,
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30
    };

    const hours = timeframes[period] || 24;
    const since = new Date(Date.now() - (hours * 60 * 60 * 1000));

    // Get notification statistics
    const notificationStats = await notificationService.getStatistics();
    
    // Get real-time connections
    const realtimeStats = realtimeEventService.isInitialized ? 
      realtimeEventService.getStatistics() : { totalClients: 0 };

    return {
      period,
      timeframe: `Last ${hours} hours`,
      metrics: {
        notifications: {
          total: notificationStats.total,
          unread: notificationStats.totalUnread,
          byType: notificationStats.byType
        },
        realtime: {
          currentConnections: realtimeStats.totalClients,
          authenticatedConnections: realtimeStats.authenticatedClients || 0
        },
        system: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
        }
      }
    };

  } catch (error) {
    return {
      period,
      error: error.message,
      metrics: {}
    };
  }
}

/**
 * Perform comprehensive health check
 */
async function performHealthCheck() {
  const services = {};

  // Check blockchain service
  try {
    services.blockchain = {
      healthy: blockchainService.isInitialized,
      status: blockchainService.isInitialized ? 'Connected' : 'Disconnected',
      network: process.env.BLOCKCHAIN_NETWORK || 'localhost',
      contracts: Object.keys(blockchainService.contracts).length
    };
  } catch (error) {
    services.blockchain = {
      healthy: false,
      status: 'Error',
      error: error.message
    };
  }

  // Check real-time service
  try {
    services.realtime = {
      healthy: realtimeEventService.isInitialized,
      status: realtimeEventService.isInitialized ? 'Active' : 'Inactive',
      connections: realtimeEventService.isInitialized ? 
        realtimeEventService.getStatistics().totalClients : 0
    };
  } catch (error) {
    services.realtime = {
      healthy: false,
      status: 'Error',
      error: error.message
    };
  }

  // Check notification service
  try {
    services.notifications = {
      healthy: notificationService.initialized,
      status: notificationService.initialized ? 'Active' : 'Inactive'
    };
  } catch (error) {
    services.notifications = {
      healthy: false,
      status: 'Error',
      error: error.message
    };
  }

  // Check database
  try {
    await sequelize.authenticate();
    services.database = {
      healthy: true,
      status: 'Connected',
      dialect: sequelize.getDialect()
    };
  } catch (error) {
    services.database = {
      healthy: false,
      status: 'Disconnected',
      error: error.message
    };
  }

  const healthyServices = Object.values(services).filter(s => s.healthy).length;
  const totalServices = Object.keys(services).length;

  return {
    overall: {
      healthy: healthyServices === totalServices,
      score: `${healthyServices}/${totalServices}`,
      percentage: Math.round((healthyServices / totalServices) * 100)
    },
    services,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format uptime in human readable format
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

module.exports = router;