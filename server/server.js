const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
require('dotenv').config();

// Import blockchain and real-time services
const blockchainService = require('./services/blockchain');
const realtimeEventService = require('./services/realtime-events');

// Import routes
const authRoutes = require('./routes/auth');
const citizenRoutes = require('./routes/citizens');
const documentRoutes = require('./routes/documents');
const grievanceRoutes = require('./routes/grievances');
const healthRoutes = require('./routes/health');
const aiAnalysisRoutes = require('./routes/ai-analysis');

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
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

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
app.use('/api/ai', aiAnalysisRoutes);

// Blockchain status endpoint
app.get('/api/blockchain/status', (req, res) => {
  try {
    const stats = {
      isInitialized: blockchainService.isInitialized,
      network: process.env.BLOCKCHAIN_NETWORK || 'localhost',
      contractsLoaded: Object.keys(blockchainService.contracts).length,
      realtimeConnections: realtimeEventService.getStatistics().totalClients
    };
    
    res.json({
      success: true,
      message: 'Blockchain service status',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get blockchain status'
    });
  }
});

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
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync database models
    await sequelize.sync({ 
      alter: process.env.NODE_ENV === 'development',
      force: false 
    });
    console.log('✅ Database models synchronized.');

    // Start server
    const server = app.listen(PORT, () => {
      console.log('🚀 BharatChain Server Status:');
      console.log(`   ├── Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   ├── Port: ${PORT}`);
      console.log(`   ├── Database: ${process.env.NODE_ENV === 'production' ? 'PostgreSQL' : 'SQLite'}`);
      console.log(`   ├── CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
      console.log(`   └── API Base URL: http://localhost:${PORT}/api`);
      console.log('');
      console.log('📋 Available Endpoints:');
      console.log('   ├── GET  /api/health           - Health check');
      console.log('   ├── POST /api/auth/message     - Get signing message');
      console.log('   ├── POST /api/auth/connect     - Authenticate with wallet');
      console.log('   ├── GET  /api/citizens/profile - Get citizen profile');
      console.log('   ├── POST /api/citizens/register- Register citizen');
      console.log('   ├── GET  /api/documents        - List documents');
      console.log('   ├── POST /api/documents/upload - Upload document');
      console.log('   ├── GET  /api/grievances       - List grievances');
      console.log('   ├── POST /api/grievances       - Submit grievance');
      console.log('   ├── GET  /api/ai/health        - AI service health');
      console.log('   ├── POST /api/ai/analyze/document - AI document analysis');
      console.log('   └── POST /api/ai/analyze/grievance - AI grievance analysis');
      console.log('');
      console.log('🔗 Frontend URL: http://localhost:3000');
      console.log('🔗 Backend URL: http://localhost:3001');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed successfully.');
        sequelize.close();
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed successfully.');
        sequelize.close();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;
