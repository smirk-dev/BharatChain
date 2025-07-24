const { ethers } = require('hardhat');
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

// Sample data for seeding
const sampleCitizens = [
  {
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@example.com',
    phone: '+91-9876543210',
    aadharHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes('123456789012')),
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '+91-9876543211',
    aadharHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes('123456789013')),
  },
  {
    name: 'Amit Patel',
    email: 'amit.patel@example.com',
    phone: '+91-9876543212',
    aadharHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes('123456789014')),
  },
];

const sampleGrievances = [
  {
    title: 'Road Repair Request',
    description: 'The main road in sector 15 has multiple potholes that need immediate attention.',
    category: 'Infrastructure',
    priority: 1, // Medium
  },
  {
    title: 'Water Supply Issue',
    description: 'Irregular water supply in our locality for the past two weeks.',
    category: 'Utilities',
    priority: 2, // High
  },
];

async function seedBlockchainData() {
  console.log('🌱 Seeding blockchain with sample data...');
  
  const [deployer, ...accounts] = await ethers.getSigners();
  
  // Get contract instances
  const deploymentFile = require('../deployments/localhost-latest.json');
  
  const CitizenRegistry = await ethers.getContractAt('CitizenRegistry', deploymentFile.contracts.CitizenRegistry.address);
  const GrievanceSystem = await ethers.getContractAt('GrievanceSystem', deploymentFile.contracts.GrievanceSystem.address);

  // Register sample citizens
  for (let i = 0; i < sampleCitizens.length; i++) {
    const citizen = sampleCitizens[i];
    const account = accounts[i];
    
    try {
      // Register citizen
      const tx = await CitizenRegistry.connect(account).registerCitizen(
        citizen.name,
        citizen.aadharHash,
        citizen.email,
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(citizen.phone))
      );
      await tx.wait();
      
      // Verify citizen (as system admin)
      const verifyTx = await CitizenRegistry.connect(deployer).verifyCitizen(account.address);
      await verifyTx.wait();
      
      console.log(`✅ Registered and verified citizen: ${citizen.name} (${account.address})`);
      
      // Submit sample grievances
      if (i < sampleGrievances.length) {
        const grievance = sampleGrievances[i];
        const grievanceTx = await GrievanceSystem.connect(account).submitGrievance(
          grievance.title,
          grievance.description,
          grievance.category,
          grievance.priority,
          Math.floor(Math.random() * 201) - 100 // Random sentiment score
        );
        await grievanceTx.wait();
        
        console.log(`✅ Submitted grievance: ${grievance.title}`);
      }
      
    } catch (error) {
      console.error(`❌ Error seeding data for ${citizen.name}:`, error.message);
    }
  }
}

async function seedDatabaseData() {
  console.log('🌱 Seeding database with sample data...');
  
  const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false,
  });

  try {
    // Test connection
    await sequelize.authenticate();
    
    // Import models
    const { Citizen, Admin } = require('../server/models');
    
    // Create sample admin users
    const admins = [
      {
        address: '0x1234567890123456789012345678901234567890',
        name: 'System Administrator',
        email: 'admin@bharatchain.gov.in',
        role: 'super_admin',
        department: 'IT Department',
        passwordHash: await bcrypt.hash('admin123', 10),
      },
      {
        address: '0x2234567890123456789012345678901234567890',
        name: 'Document Verifier',
        email: 'verifier@bharatchain.gov.in',
        role: 'document_verifier',
        department: 'Registration Department',
        passwordHash: await bcrypt.hash('verifier123', 10),
      },
    ];

    for (const admin of admins) {
      await Admin.findOrCreate({
        where: { address: admin.address },
        defaults: admin,
      });
      console.log(`✅ Created admin: ${admin.name}`);
    }

    console.log('✅ Database seeding completed');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

async function main() {
  console.log('🌱 Starting BharatChain Data Seeding Process');
  console.log('===========================================');
  
  await seedBlockchainData();
  await seedDatabaseData();
  
  console.log('\n🎉 Data seeding completed successfully!');
  console.log('\n📋 Sample accounts created:');
  console.log('- 3 verified citizens with sample grievances');
  console.log('- 2 admin users (super_admin and document_verifier)');
  console.log('\n🔐 Admin credentials:');
  console.log('- admin@bharatchain.gov.in / admin123');
  console.log('- verifier@bharatchain.gov.in / verifier123');
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedBlockchainData, seedDatabaseData };
