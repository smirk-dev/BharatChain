const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
require('dotenv').config();

// Import middleware
const { 
  errorHandler, 
  notFoundHandler, 
  timeoutHandler,
  asyncHandler 
} = require('./middleware/error');
const { verifyToken, optionalAuth, rateLimit } = require('./middleware/auth');

// Import blockchain and real-time services
const blockchainService = require('./services/blockchain-simple');
const realtimeEventService = require('./services/realtime-events');
const notificationService = require('./services/notification');

// Import routes
const authRoutes = require('./routes/auth');
const citizenRoutes = require('./routes/citizens');
const documentRoutes = require('./routes/documents');
const grievanceRoutes = require('./routes/grievances');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const chatRoutes = require('./routes/chat');
const broadcastRoutes = require('./routes/broadcasts');
const healthRoutes = require('./routes/health');
const aiAnalysisRoutes = require('./routes/ai-analysis');
const qrCodeRoutes = require('./routes/qr-codes');
const mobileAuthRoutes = require('./routes/mobile-auth');
const mobileConfigRoutes = require('./routes/mobile-config');
const governmentAPIsRoutes = require('./routes/government-apis');
const governmentServicesRoutes = require('./routes/government-services');
const governmentPaymentsRoutes = require('./routes/government-payments');
const openDataRoutes = require('./routes/open-data');
const secureExchangeRoutes = require('./routes/secure-data-exchange');
const complianceAuditRoutes = require('./routes/compliance-audit');
// const blockchainRoutes = require('./routes/blockchain');

// Import database and models
const { sequelize } = require('../config/database');
const { User, Document, Grievance } = require('./models');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https:", "wss:"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request timeout middleware
app.use(timeoutHandler(30000)); // 30 second timeout

// Rate limiting using our custom middleware
app.use('/api/', rateLimit(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint (before other routes)
app.use('/api/health', healthRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/citizens', citizenRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/broadcasts', broadcastRoutes);
app.use('/api/ai', aiAnalysisRoutes);
app.use('/api/qr', qrCodeRoutes);
app.use('/api/mobile-auth', mobileAuthRoutes);
app.use('/api/mobile-config', mobileConfigRoutes);
app.use('/api/government', governmentAPIsRoutes);
app.use('/api/gov-services', governmentServicesRoutes);
app.use('/api/payments', governmentPaymentsRoutes);
app.use('/api/open-data', openDataRoutes);
app.use('/api/secure-exchange', secureExchangeRoutes);
app.use('/api/compliance', complianceAuditRoutes);
// app.use('/api/blockchain', blockchainRoutes);

// WebSocket status endpoint
app.get('/api/websocket/status', (req, res) => {
  try {
    const stats = realtimeEventService.getStatistics();
    
    res.json({
      success: true,
      message: 'WebSocket service status',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get WebSocket status'
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'BharatChain Governance Platform API',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    blockchain: {
      enabled: true,
      network: process.env.BLOCKCHAIN_NETWORK || 'localhost',
      isInitialized: blockchainService.isInitialized
    },
    realtime: {
      enabled: true,
      connections: realtimeEventService.getStatistics().totalClients
    },
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      citizens: '/api/citizens',
      documents: '/api/documents',
      grievances: '/api/grievances',
      ai_analysis: '/api/ai',
      blockchain_status: '/api/blockchain/status',
      websocket_status: '/api/websocket/status'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.errors
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File Too Large',
      message: 'File size exceeds the maximum limit'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Invalid File',
      message: 'Unexpected file type or field name'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'POST /api/auth/message',
      'POST /api/auth/connect',
      'GET /api/citizens/profile',
      'POST /api/citizens/register',
      'GET /api/documents',
      'POST /api/documents/upload',
      'GET /api/grievances',
      'POST /api/grievances',
      'POST /api/ai/analyze/document',
      'POST /api/ai/analyze/grievance'
    ]
  });
});

// Database connection and server startup
async function startServer() {
  try {
    console.log('🚀 Starting BharatChain Server...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync database models
    await sequelize.sync({ 
      alter: process.env.NODE_ENV === 'development',
      force: false 
    });
    console.log('✅ Database models synchronized.');

    // Initialize enhanced blockchain service
    try {
      const network = process.env.NETWORK || 'hardhat';
      const privateKey = process.env.PRIVATE_KEY;
      const forceOffline = process.env.FORCE_OFFLINE === 'true';
      
      if (forceOffline) {
        console.log('🔄 Force offline mode enabled via environment variable');
        await blockchainService.initialize(network, privateKey, true);
      } else if (privateKey) {
        await blockchainService.initialize(network, privateKey);
      } else {
        console.log('⚠️ Private key not provided, blockchain will run in read-only mode.');
        await blockchainService.initialize(network);
      }
      
      // Setup blockchain event listeners
      blockchainService.on('connected', (info) => {
        console.log(`🎉 Blockchain connected to ${info.network} (Chain ID: ${info.chainId})`);
      });
      
      blockchainService.on('offline', (info) => {
        console.log(`🔄 Blockchain switched to offline mode: ${info.reason}`);
      });
      
      blockchainService.on('transaction', (tx) => {
        console.log(`📝 Transaction processed: ${tx.transactionHash} (${tx.type})`);
      });

      console.log('✅ Enhanced blockchain service initialized successfully.');
    } catch (blockchainError) {
      console.error('❌ Blockchain initialization failed:', blockchainError.message);
      console.log('⚠️ Server will continue in enhanced offline mode.');
    }

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize real-time event service
    try {
      realtimeEventService.initialize(server);
      console.log('✅ Real-time event service initialized successfully.');
    } catch (realtimeError) {
      console.error('❌ Real-time service initialization failed:', realtimeError.message);
      console.log('⚠️ Server will continue without real-time events.');
    }

    // Initialize notification service
    try {
      await notificationService.initialize();
      console.log('✅ Notification service initialized successfully.');
      
      // Setup blockchain event notifications if both services are available
      if (blockchainService.isInitialized && realtimeEventService.isInitialized) {
        notificationService.setupBlockchainEventNotifications();
        console.log('✅ Blockchain event notifications setup complete.');
      }
    } catch (notificationError) {
      console.error('❌ Notification service initialization failed:', notificationError.message);
      console.log('⚠️ Server will continue without notifications.');
    }

    // Start server
    server.listen(PORT, () => {
      console.log('');
      console.log('🎉 BharatChain Server Status:');
      console.log(`   ├── Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   ├── Port: ${PORT}`);
      console.log(`   ├── Database: ${process.env.NODE_ENV === 'production' ? 'PostgreSQL' : 'SQLite'}`);
      console.log(`   ├── CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
      console.log(`   ├── Blockchain: ${blockchainService.isInitialized ? '✅ Connected' : '❌ Offline'}`);
      console.log(`   ├── Real-time Events: ${realtimeEventService.isInitialized ? '✅ Active' : '❌ Offline'}`);
      console.log(`   ├── Notifications: ${notificationService.initialized ? '✅ Active' : '❌ Offline'}`);
      console.log(`   └── API Base URL: http://localhost:${PORT}/api`);
      console.log('');
      console.log('📋 Available Endpoints:');
      console.log('   ├── GET  /api/health               - Health check');
      console.log('   ├── POST /api/auth/message         - Get signing message');
      console.log('   ├── POST /api/auth/connect         - Authenticate with wallet');
      console.log('   ├── GET  /api/citizens/profile     - Get citizen profile');
      console.log('   ├── POST /api/citizens/register    - Register citizen');
      console.log('   ├── GET  /api/documents            - List documents');
      console.log('   ├── POST /api/documents/upload     - Upload document');
      console.log('   ├── GET  /api/grievances           - List grievances');
      console.log('   ├── POST /api/grievances           - Submit grievance');
      console.log('   ├── GET  /api/notifications        - Get notifications');
      console.log('   ├── PUT  /api/notifications/:id/read - Mark notification as read');
      console.log('   ├── GET  /api/dashboard/status      - System status dashboard');
      console.log('   ├── GET  /api/dashboard/health-check - Comprehensive health check');
      console.log('   ├── GET  /api/chat/rooms            - Get chat rooms');
      console.log('   ├── POST /api/broadcasts            - Create system broadcasts');
      console.log('   ├── GET  /api/broadcasts/public     - Get public announcements');
      console.log('   ├── GET  /api/ai/health            - AI service health');
      console.log('   ├── POST /api/ai/analyze/document  - AI document analysis');
      console.log('   ├── POST /api/ai/analyze/grievance - AI grievance analysis');
      console.log('   ├── GET  /api/blockchain/status    - Blockchain status');
      console.log('   └── GET  /api/websocket/status     - WebSocket status');
      console.log('');
      console.log('🔗 Frontend URL: http://localhost:3000');
      console.log('🔗 Backend API: http://localhost:3001');
      console.log('🔗 WebSocket: ws://localhost:3001 (integrated)');
      console.log('');
      if (blockchainService.isInitialized) {
        console.log('⛓️  Blockchain Integration:');
        console.log(`   ├── Network: ${process.env.BLOCKCHAIN_NETWORK || 'localhost'}`);
        console.log(`   ├── Contracts: ${Object.keys(blockchainService.contracts).length} loaded`);
        console.log('   └── Events: Real-time monitoring active');
      }
      if (realtimeEventService.isInitialized) {
        console.log('📡 Real-time Features:');
        console.log('   ├── Document verification updates');
        console.log('   ├── Grievance status changes');
        console.log('   ├── Citizen registration notifications');
        console.log('   └── Blockchain transaction confirmations');
      }
      console.log('');
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
      console.log('🛑 Shutting down gracefully...');
      
      // Close real-time service
      if (realtimeEventService.isInitialized) {
        realtimeEventService.shutdown();
      }
      
      // Close server
      server.close(() => {
        console.log('✅ HTTP server closed.');
        
        // Close database connection
        sequelize.close().then(() => {
          console.log('✅ Database connection closed.');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      // Don't exit on unhandled rejection, just log it
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      // Don't exit on uncaught exception, just log it
    });

  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;
