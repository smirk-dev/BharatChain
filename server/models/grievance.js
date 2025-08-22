module.exports = (sequelize, DataTypes) => {
  const Grievance = sequelize.define('Grievance', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    blockchainId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'blockchain_id',
    },
    citizenAddress: {
      type: DataTypes.STRING(42),
      allowNull: false,
      field: 'citizen_address',
      references: {
        model: 'citizens',
        key: 'address',
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium',
    },
    status: {
      type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed', 'escalated'),
      allowNull: false,
      defaultValue: 'open',
    },
    assignedOfficer: {
      type: DataTypes.STRING(42),
      allowNull: true,
      field: 'assigned_officer',
    },
    resolution: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'resolved_at',
    },
    sentimentScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'sentiment_score',
      validate: {
        min: -100,
        max: 100,
      },
    },
    aiAnalysis: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'ai_analysis',
      defaultValue: {},
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    urgencyLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'urgency_level',
      validate: {
        min: 1,
        max: 10,
      },
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    location: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
  }, {
    tableName: 'grievances',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['blockchain_id'],
      },
      {
        fields: ['citizen_address'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['priority'],
      },
      {
        fields: ['category'],
      },
      {
        fields: ['assigned_officer'],
      },
      {
        fields: ['created_at'],
      },
    ],
  });

  Grievance.associate = function(models) {
    Grievance.belongsTo(models.Citizen, {
      foreignKey: 'citizenAddress',
      targetKey: 'address',
      as: 'citizen',
    });
  };

  return Grievance;
};
