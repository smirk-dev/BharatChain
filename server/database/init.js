const { sequelize, syncDatabase } = require('../../config/database');
const { User, Document, Grievance } = require('../models');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs').promises;

// Seed data
const seedUsers = [
  {
    walletAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
    name: 'Demo User',
    email: 'demo@bharatchain.gov.in',
    phone: '+91-9876543210',
    address: 'Mumbai, Maharashtra, India',
    isVerified: true,
    verificationLevel: 'VERIFIED'
  },
  {
    walletAddress: '0x5aeda56215b167893e80b4fe645ba6d5bab767de',
    name: 'Test Citizen',
    email: 'citizen@example.com',
    phone: '+91-9876543211',
    address: 'Delhi, India',
    isVerified: false,
    verificationLevel: 'BASIC'
  }
];

const seedDocuments = [
  {
    userId: 1,
    title: 'Aadhaar Card',
    type: 'AADHAR',
    filename: 'aadhar_demo.pdf',
    originalName: 'aadhar_card.pdf',
    filePath: '/uploads/documents/aadhar_demo.pdf',
    fileSize: 1024000,
    mimeType: 'application/pdf',
    description: 'Demo Aadhaar card for testing',
    status: 'VERIFIED',
    verificationDate: new Date(),
    verifiedBy: 'System Admin',
    aiAnalysis: {
      isValid: true,
      confidence: 0.95,
      extractedName: 'Demo User',
      extractedId: 'XXXX-XXXX-1234'
    }
  },
  {
    userId: 1,
    title: 'PAN Card',
    type: 'PAN',
    filename: 'pan_demo.pdf',
    originalName: 'pan_card.pdf',
    filePath: '/uploads/documents/pan_demo.pdf',
    fileSize: 512000,
    mimeType: 'application/pdf',
    description: 'Demo PAN card for testing',
    status: 'PENDING',
    aiAnalysis: null
  }
];

const seedGrievances = [
  {
    userId: 1,
    title: 'Document Verification Delay',
    description: 'My passport verification has been pending for over 2 weeks. Please expedite the process.',
    category: 'VERIFICATION',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    department: 'Ministry of External Affairs',
    assignedTo: 'Officer_001'
  },
  {
    userId: 2,
    title: 'Unable to Upload Documents',
    description: 'Getting error while uploading birth certificate. The system shows "File format not supported" even though it is PDF.',
    category: 'TECHNICAL',
    priority: 'MEDIUM',
    status: 'OPEN',
    department: 'Technical Support'
  }
];

async function initDatabase() {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Create necessary directories first
    await createDirectories();
    
    // Sync database (force: true will drop existing tables)
    const forceSync = process.env.NODE_ENV === 'development' && process.argv.includes('--force');
    
    if (forceSync) {
      console.log('⚠️  Force syncing database (will drop existing tables)...');
    }
    
    await syncDatabase({ force: forceSync, alter: !forceSync });
    console.log('✅ Database schema synchronized');
    
    // Create additional models
    await createAdditionalModels();
    
    // Check if we should seed data
    if (process.argv.includes('--seed') || forceSync) {
      console.log('🌱 Seeding database...');
      
      // Create users
      const userCount = await User.count();
      if (userCount === 0) {
        const users = await User.bulkCreate(seedUsers);
        console.log(`✅ Created ${users.length} demo users`);
        
        // Create documents
        const documents = await Document.bulkCreate(seedDocuments);
        console.log(`✅ Created ${documents.length} demo documents`);
        
        // Create grievances
        const grievances = await Grievance.bulkCreate(seedGrievances);
        console.log(`✅ Created ${grievances.length} demo grievances`);
      } else {
        console.log('ℹ️  Database already has data, skipping seed');
      }
    }
    
    console.log('🎉 Database initialization complete!');
    console.log('📊 Database Statistics:');
    console.log(`   - Users: ${await User.count()}`);
    console.log(`   - Documents: ${await Document.count()}`);
    console.log(`   - Grievances: ${await Grievance.count()}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Create necessary directories for file uploads
 */
async function createDirectories() {
  const directories = [
    path.join(__dirname, '..', 'uploads'),
    path.join(__dirname, '..', 'uploads', 'documents'),
    path.join(__dirname, '..', 'uploads', 'profiles'),
    path.join(__dirname, '..', 'uploads', 'temp'),
    path.join(__dirname, '..', 'uploads', 'qr-codes')
  ];

  console.log('📁 Creating upload directories...');
  
  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`   ✅ Created: ${path.relative(process.cwd(), dir)}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error(`   ❌ Failed to create directory ${dir}:`, error);
      }
    }
  }
}

async function createAdditionalModels() {
  // Create additional tables that might be needed
  const { DataTypes } = require('sequelize');
  
  // Notifications table
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('INFO', 'WARNING', 'ERROR', 'SUCCESS'),
      defaultValue: 'INFO'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'notifications'
  });
  
  // Transactions table for blockchain records
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    txHash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED'),
      defaultValue: 'PENDING'
    },
    gasUsed: {
      type: DataTypes.STRING,
      allowNull: true
    },
    blockNumber: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'transactions'
  });
  
  // Payment records
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    orderId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'INR'
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'),
      defaultValue: 'PENDING'
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paymentGateway: {
      type: DataTypes.STRING,
      allowNull: true
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'payments'
  });
  
  await sequelize.sync();
  console.log('✅ Additional models created successfully');
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initDatabase();
}

module.exports = {
  initDatabase,
  seedUsers,
  seedDocuments,
  seedGrievances
};
