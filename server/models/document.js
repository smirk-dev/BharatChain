module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    blockchainId: {
      type: DataTypes.STRING(66), // 0x + 64 hex characters
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
    documentType: {
      type: DataTypes.ENUM('aadhar', 'pan', 'voter_id', 'driving_license', 'passport', 'birth_certificate', 'other'),
      allowNull: false,
      field: 'document_type',
    },
    ipfsHash: {
      type: DataTypes.STRING(46), // IPFS hash length
      allowNull: false,
      field: 'ipfs_hash',
    },
    metadataHash: {
      type: DataTypes.STRING(46), // IPFS hash length
      allowNull: false,
      field: 'metadata_hash',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    aiAnalysis: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'ai_analysis',
      defaultValue: {},
    },
    status: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected', 'expired'),
      allowNull: false,
      defaultValue: 'pending',
    },
    verifiedBy: {
      type: DataTypes.STRING(42),
      allowNull: true,
      field: 'verified_by',
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verified_at',
    },
    rejectedBy: {
      type: DataTypes.STRING(42),
      allowNull: true,
      field: 'rejected_by',
    },
    rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'rejected_at',
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason',
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expiry_date',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'file_size',
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'mime_type',
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'original_name',
    },
  }, {
    tableName: 'documents',
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
        fields: ['document_type'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['ipfs_hash'],
      },
    ],
  });

  Document.associate = function(models) {
    Document.belongsTo(models.Citizen, {
      foreignKey: 'citizenAddress',
      targetKey: 'address',
      as: 'citizen',
    });
  };

  return Document;
};
