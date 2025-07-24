module.exports = (sequelize, DataTypes) => {
  const Citizen = sequelize.define('Citizen', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    address: {
      type: DataTypes.STRING(42),
      allowNull: false,
      unique: true,
      validate: {
        isEthereumAddress(value) {
          if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
            throw new Error('Invalid Ethereum address format');
          }
        },
      },
    },
    aadharHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      field: 'aadhar_hash',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [2, 255],
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: true,
      validate: {
        is: /^[+]?[1-9][\d\s\-()]+$/,
      },
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'date_of_birth',
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: true,
    },
    address_line1: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    address_line2: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verified_at',
    },
    verifiedBy: {
      type: DataTypes.STRING(42),
      allowNull: true,
      field: 'verified_by',
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login',
    },
    profilePicture: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'profile_picture',
    },
    preferences: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
  }, {
    tableName: 'citizens',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['address'],
      },
      {
        unique: true,
        fields: ['aadhar_hash'],
      },
      {
        fields: ['email'],
      },
      {
        fields: ['is_verified'],
      },
      {
        fields: ['created_at'],
      },
    ],
  });

  Citizen.associate = function(models) {
    Citizen.hasMany(models.Document, {
      foreignKey: 'citizenAddress',
      sourceKey: 'address',
      as: 'documents',
    });
    
    Citizen.hasMany(models.Grievance, {
      foreignKey: 'citizenAddress',
      sourceKey: 'address',
      as: 'grievances',
    });
  };

  return Citizen;
};
