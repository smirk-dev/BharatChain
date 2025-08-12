const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Database configuration
const config = require('../../config/database');
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Initialize Sequelize
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    ssl: dbConfig.ssl
  }
);

// Import models
const Citizen = require('./citizen')(sequelize, DataTypes);
const Document = require('./document')(sequelize, DataTypes);
const Grievance = require('./grievance')(sequelize, DataTypes);

// Model associations
const models = {
  Citizen,
  Document,
  Grievance,
  sequelize,
  Sequelize
};

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;
