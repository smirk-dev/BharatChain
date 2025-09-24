const express = require('express');
const blockchainService = require('../services/enhanced-blockchain');

const router = express.Router();

/**
 * @route GET /api/blockchain/status
 * @desc Get comprehensive blockchain status
 * @access Public
 */
router.get('/status', (req, res) => {
  try {
    const status = blockchainService.getConnectionStatus();
    const mockStats = blockchainService.getMockStats();
    
    const response = {
      service: 'Enhanced Blockchain Service',
      timestamp: new Date().toISOString(),
      status: {
        ...status,
        mode: status.offline ? 'Offline (Enhanced)' : 'Online (Connected)'
      },
      capabilities: {
        citizenRegistry: true,
        documentRegistry: true,
        grievanceSystem: true,
        eventEmission: true,
        transactionSimulation: status.offline,
        realTimeUpdates: true
      },
      features: {
        offlineMode: {
          enabled: true,
          description: 'Full functionality available without blockchain connection'
        },
        mockData: {
          enabled: status.offline,
          description: 'Realistic sample data for testing and development'
        },
        eventSystem: {
          enabled: true,
          description: 'Real-time event emission for blockchain operations'
        },
        autoFallback: {
          enabled: true,
          description: 'Automatic fallback to offline mode on connection failure'
        }
      },
      statistics: mockStats || {
        message: 'Statistics available only in offline mode'
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Failed to get blockchain status:', error);
    res.status(500).json({
      error: 'Failed to get blockchain status',
      details: error.message
    });
  }
});

/**
 * @route GET /api/blockchain/mock-data
 * @desc Export mock data (development/testing)
 * @access Public
 */
router.get('/mock-data', (req, res) => {
  try {
    if (!blockchainService.isOffline()) {
      return res.status(400).json({
        error: 'Mock data only available in offline mode'
      });
    }

    const mockData = blockchainService.exportMockData();
    
    res.json({
      exportDate: new Date().toISOString(),
      dataVersion: '1.0',
      ...mockData
    });
  } catch (error) {
    console.error('Failed to export mock data:', error);
    res.status(500).json({
      error: 'Failed to export mock data',
      details: error.message
    });
  }
});

/**
 * @route POST /api/blockchain/mock-data
 * @desc Import mock data (development/testing)
 * @access Public
 */
router.post('/mock-data', (req, res) => {
  try {
    if (!blockchainService.isOffline()) {
      return res.status(400).json({
        error: 'Mock data import only available in offline mode'
      });
    }

    const { body } = req;
    
    if (!body || typeof body !== 'object') {
      return res.status(400).json({
        error: 'Invalid mock data format'
      });
    }

    blockchainService.importMockData(body);
    
    res.json({
      message: 'Mock data imported successfully',
      importDate: new Date().toISOString(),
      status: blockchainService.getConnectionStatus()
    });
  } catch (error) {
    console.error('Failed to import mock data:', error);
    res.status(500).json({
      error: 'Failed to import mock data',
      details: error.message
    });
  }
});

/**
 * @route GET /api/blockchain/transactions
 * @desc Get transaction history (offline mode)
 * @access Public
 */
router.get('/transactions', (req, res) => {
  try {
    if (!blockchainService.isOffline()) {
      return res.status(400).json({
        error: 'Transaction history only available in offline mode'
      });
    }

    const mockData = blockchainService.exportMockData();
    const transactions = mockData.transactions || [];
    
    // Apply pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const paginatedTransactions = transactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(offset, offset + limit);
    
    res.json({
      transactions: paginatedTransactions,
      pagination: {
        page,
        limit,
        total: transactions.length,
        pages: Math.ceil(transactions.length / limit)
      }
    });
  } catch (error) {
    console.error('Failed to get transactions:', error);
    res.status(500).json({
      error: 'Failed to get transactions',
      details: error.message
    });
  }
});

/**
 * @route POST /api/blockchain/force-offline
 * @desc Force blockchain into offline mode
 * @access Public
 */
router.post('/force-offline', (req, res) => {
  try {
    blockchainService.enableOfflineMode();
    
    res.json({
      message: 'Blockchain forced into offline mode',
      status: blockchainService.getConnectionStatus(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to force offline mode:', error);
    res.status(500).json({
      error: 'Failed to force offline mode',
      details: error.message
    });
  }
});

/**
 * @route GET /api/blockchain/health
 * @desc Comprehensive blockchain health check
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    const status = blockchainService.getConnectionStatus();
    const mockStats = blockchainService.getMockStats();
    
    let balance = null;
    try {
      balance = await blockchainService.getBalance();
    } catch (balanceError) {
      balance = 'Unable to retrieve balance';
    }

    const healthCheck = {
      service: 'Enhanced Blockchain Service',
      healthy: true,
      timestamp: new Date().toISOString(),
      mode: status.offline ? 'offline' : 'online',
      details: {
        initialized: status.initialized,
        hasProvider: status.hasProvider,
        hasSigner: status.hasSigner,
        mockDataLoaded: status.offline && mockStats ? true : false,
        balance
      },
      performance: {
        mockDataSize: status.mockDataSize,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      },
      capabilities: {
        citizenOperations: true,
        documentOperations: true,
        grievanceOperations: true,
        eventEmission: true,
        offlineFunctionality: true
      }
    };

    res.json(healthCheck);
  } catch (error) {
    console.error('Blockchain health check failed:', error);
    res.status(500).json({
      service: 'Enhanced Blockchain Service',
      healthy: false,
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;