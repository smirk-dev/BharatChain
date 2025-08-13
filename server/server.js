const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const citizenRoutes = require('./routes/citizens');
const documentRoutes = require('./routes/documents');
const grievanceRoutes = require('./routes/grievances');
const aiProcessingRoutes = require('./routes/ai-processing');

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

// Import services
const blockchainService = require('./services/blockchainService');
const ipfsService = require('./services/ipfsService');
const dataStore = require('./services/dataStore');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room ${room}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/citizens', authMiddleware, citizenRoutes);
app.use('/api/documents', authMiddleware, documentRoutes);
app.use('/api/grievances', authMiddleware, grievanceRoutes);
app.use('/api/ai-processing', authMiddleware, aiProcessingRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', notFoundHandler);

// Initialize services and start server
const startServer = async () => {
  try {
    // Initialize data store with demo data
    dataStore.seedDemoData();
    console.log('In-memory data store initialized with demo data.');
    
    // Initialize blockchain service
    try {
      await blockchainService.initialize();
      console.log('Blockchain service initialized.');
    } catch (blockchainError) {
      console.log('Blockchain service initialization failed, continuing in demo mode:', blockchainError.message);
    }
    
    // Initialize IPFS service
    try {
      await ipfsService.initialize();
      console.log('IPFS service initialized.');
    } catch (ipfsError) {
      console.log('IPFS service initialization failed, continuing with mock implementation:', ipfsError.message);
    }
    
    // Start server
    server.listen(PORT, () => {
      console.log(`✅ BharatChain server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
      console.log('');
      console.log('Available endpoints:');
      console.log('  GET  /api/health - Health check');
      console.log('  POST /api/auth/login - User login');
      console.log('  GET  /api/citizens/profile - Get citizen profile');
      console.log('  POST /api/citizens/register - Register new citizen');
      console.log('  GET  /api/documents - Get citizen documents');
      console.log('  POST /api/documents/upload - Upload new document');
      console.log('  GET  /api/grievances - Get citizen grievances');
      console.log('  POST /api/grievances - Submit new grievance');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

startServer();

module.exports = app;
