const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database configuration based on environment
const config = {
  development: {
    dialect: 'sqlite',
    storage: './server/database/bharatchain.db',
    logging: false,
    define: {
      timestamps: true,
      underscored: false,
      paranoid: true
    }
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    define: {
      timestamps: true,
      underscored: false,
      paranoid: true
    }
  },
  production: {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'bharatchain',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'password',
    logging: false,
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false,
    define: {
      timestamps: true,
      underscored: false,
      paranoid: true
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create Sequelize instance
const sequelize = new Sequelize(dbConfig);

// Test database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
}

// Sync database models
async function syncDatabase(options = {}) {
  try {
    await sequelize.sync(options);
    console.log('✅ Database models synchronized successfully.');
    return true;
  } catch (error) {
    console.error('❌ Failed to sync database models:', error);
    return false;
  }
}

// Close database connection
async function closeConnection() {
  try {
    await sequelize.close();
    console.log('✅ Database connection closed successfully.');
    return true;
  } catch (error) {
    console.error('❌ Failed to close database connection:', error);
    return false;
  }
}

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  closeConnection
};
