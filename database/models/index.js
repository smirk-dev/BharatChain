const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: env === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import models
const Citizen = require('./citizen')(sequelize, DataTypes);
const Document = require('./document')(sequelize, DataTypes);
const Grievance = require('./grievance')(sequelize, DataTypes);
const Admin = require('./admin')(sequelize, DataTypes);
const AuditLog = require('./auditLog')(sequelize, DataTypes);

// Define associations
Citizen.hasMany(Document, { foreignKey: 'citizenAddress', sourceKey: 'address' });
Document.belongsTo(Citizen, { foreignKey: 'citizenAddress', targetKey: 'address' });

Citizen.hasMany(Grievance, { foreignKey: 'citizenAddress', sourceKey: 'address' });
Grievance.belongsTo(Citizen, { foreignKey: 'citizenAddress', targetKey: 'address' });

Admin.hasMany(Grievance, { foreignKey: 'assignedTo', sourceKey: 'address' });
Grievance.belongsTo(Admin, { foreignKey: 'assignedTo', targetKey: 'address' });

// Export models and sequelize instance
module.exports = {
  sequelize,
  Sequelize,
  Citizen,
  Document,
  Grievance,
  Admin,
  AuditLog,
};
