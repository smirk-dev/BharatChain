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
const { sequelize, Citizen, Document, Grievance } = require('./models');

// Demo data seeding function
const seedDemoData = async () => {
  try {
    // Check if demo data already exists
    const existingCitizens = await Citizen.count();
    if (existingCitizens > 0) {
      console.log('Demo data already exists, skipping seeding.');
      return;
    }

    // Create demo citizens
    const demoCitizens = [
      {
        address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'.toLowerCase(),
        aadharHash: 'demo_aadhar_hash_1',
        name: 'Demo Citizen 1',
        email: 'demo1@bharatchain.gov.in',
        phone: '+91-9876543210',
        isVerified: true,
        isActive: true
      },
      {
        address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'.toLowerCase(),
        aadharHash: 'demo_aadhar_hash_2',
        name: 'Demo Citizen 2',
        email: 'demo2@bharatchain.gov.in',
        phone: '+91-9876543211',
        isVerified: false,
        isActive: true
      }
    ];

    await Citizen.bulkCreate(demoCitizens);
    console.log('Demo citizens created');

    // Create demo documents
    const demoDocuments = [
      {
        citizenAddress: demoCitizens[0].address,
        documentType: 'aadhar',
        ipfsHash: 'QmDemoAadharHash1',
        isVerified: true,
        issuerAddress: '0x0000000000000000000000000000000000000001',
        issuerName: 'Government Authority'
      },
      {
        citizenAddress: demoCitizens[0].address,
        documentType: 'pan',
        ipfsHash: 'QmDemoPanHash1',
        isVerified: true,
        issuerAddress: '0x0000000000000000000000000000000000000001',
        issuerName: 'Income Tax Department'
      }
    ];

    await Document.bulkCreate(demoDocuments);
    console.log('Demo documents created');

    // Create demo grievances
    const demoGrievances = [
      {
        citizenAddress: demoCitizens[0].address,
        title: 'Road Repair Request',
        description: 'The road near my area needs urgent repair due to potholes.',
        category: 'infrastructure',
        priority: 'medium',
        status: 'pending'
      }
    ];

    await Grievance.bulkCreate(demoGrievances);
    console.log('Demo grievances created');

  } catch (error) {
    console.error('Error seeding demo data:', error);
  }
};

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
    // Initialize database
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync database (create tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized.');
    
    // Seed demo data if needed
    await seedDemoData();
    console.log('✅ Demo data seeded successfully');
    
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
