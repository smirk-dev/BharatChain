const { sequelize } = require('./models');

async function testDatabaseConnection() {
  try {
    console.log('🔗 Testing database connection...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Sync models (create tables if they don't exist)
    await sequelize.sync({ force: false });
    console.log('✅ Database models synchronized');
    
    // Test basic operations
    const { Citizen } = require('./models');
    const testCount = await Citizen.count();
    console.log(`✅ Current citizen count: ${testCount}`);
    
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
    if (error.original && error.original.code === 'ECONNREFUSED') {
      console.log('💡 Tip: Make sure PostgreSQL is running and accessible');
      console.log('   - Check if PostgreSQL service is started');
      console.log('   - Verify connection details in .env file');
      console.log('   - Create database if it doesn\'t exist');
    }
    
    // For development, we'll continue without database
    console.log('⚠️ Continuing without database connection...');
  }
}

// Run test if called directly
if (require.main === module) {
  testDatabaseConnection()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = testDatabaseConnection;
