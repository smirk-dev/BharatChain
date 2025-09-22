const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Initialize database for mobile configuration
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/mobile_config.db'),
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// App Configuration model
const AppConfig = sequelize.define('AppConfig', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  configKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    index: true
  },
  configValue: {
    type: DataTypes.JSON,
    allowNull: false
  },
  configType: {
    type: DataTypes.ENUM('feature_flag', 'app_setting', 'ui_config', 'api_config', 'security_setting'),
    allowNull: false,
    index: true
  },
  environment: {
    type: DataTypes.ENUM('development', 'staging', 'production', 'all'),
    allowNull: false,
    defaultValue: 'all',
    index: true
  },
  platform: {
    type: DataTypes.ENUM('ios', 'android', 'web', 'all'),
    allowNull: false,
    defaultValue: 'all',
    index: true
  },
  minAppVersion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  maxAppVersion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  targetUsers: {
    type: DataTypes.JSON,
    defaultValue: [], // Array of user addresses or roles
    comment: 'Specific users or roles this config applies to'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    index: true
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Higher priority configs override lower priority ones'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'app_configs',
  timestamps: true,
  indexes: [
    { fields: ['configKey'] },
    { fields: ['configType'] },
    { fields: ['environment'] },
    { fields: ['platform'] },
    { fields: ['isActive'] },
    { fields: ['priority'] }
  ]
});

// User Configuration model (personalized settings)
const UserConfig = sequelize.define('UserConfig', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  deviceId: {
    type: DataTypes.STRING,
    allowNull: true,
    index: true
  },
  configKey: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  configValue: {
    type: DataTypes.JSON,
    allowNull: false
  },
  configCategory: {
    type: DataTypes.ENUM('accessibility', 'language', 'theme', 'notifications', 'privacy', 'security'),
    allowNull: false,
    index: true
  },
  isSystemDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastModified: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_configs',
  timestamps: true,
  indexes: [
    { fields: ['userAddress'] },
    { fields: ['deviceId'] },
    { fields: ['configKey'] },
    { fields: ['configCategory'] },
    { unique: true, fields: ['userAddress', 'deviceId', 'configKey'] }
  ]
});

// Feature Flag model
const FeatureFlag = sequelize.define('FeatureFlag', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  flagName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    index: true
  },
  isEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    index: true
  },
  rolloutPercentage: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    validate: { min: 0, max: 100 },
    comment: 'Percentage of users who should see this feature (0-100)'
  },
  conditions: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Conditions for enabling the feature (user roles, regions, etc.)'
  },
  variants: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Different variants of the feature for A/B testing'
  },
  environment: {
    type: DataTypes.ENUM('development', 'staging', 'production', 'all'),
    allowNull: false,
    defaultValue: 'all'
  },
  platform: {
    type: DataTypes.ENUM('ios', 'android', 'web', 'all'),
    allowNull: false,
    defaultValue: 'all'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  modifiedBy: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'feature_flags',
  timestamps: true,
  indexes: [
    { fields: ['flagName'] },
    { fields: ['isEnabled'] },
    { fields: ['environment'] },
    { fields: ['platform'] }
  ]
});

// App Version model
const AppVersion = sequelize.define('AppVersion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  version: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  platform: {
    type: DataTypes.ENUM('ios', 'android', 'web'),
    allowNull: false,
    index: true
  },
  buildNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  isLatest: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    index: true
  },
  isSupported: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    index: true
  },
  minOSVersion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  releaseNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  downloadUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  forceUpdate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  updateMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  releaseDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  features: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'New features in this version'
  },
  bugFixes: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Bug fixes in this version'
  }
}, {
  tableName: 'app_versions',
  timestamps: true,
  indexes: [
    { fields: ['version'] },
    { fields: ['platform'] },
    { fields: ['isLatest'] },
    { fields: ['isSupported'] },
    { unique: true, fields: ['version', 'platform'] }
  ]
});

class MobileConfigService {
  constructor() {
    this.initialized = false;
    this.configCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Initialize mobile config service
   */
  async initialize() {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ alter: true });
      
      // Load default configurations
      await this.loadDefaultConfigurations();
      
      this.initialized = true;
      console.log('✅ Mobile Configuration service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Mobile Config service:', error);
      throw error;
    }
  }

  /**
   * Load default configurations
   */
  async loadDefaultConfigurations() {
    try {
      const defaultConfigs = [
        // Feature flags
        {
          configKey: 'qr_code_scanning',
          configValue: { enabled: true, maxScanHistory: 50 },
          configType: 'feature_flag',
          description: 'Enable QR code scanning functionality'
        },
        {
          configKey: 'biometric_auth',
          configValue: { enabled: true, fallbackToPin: true },
          configType: 'feature_flag',
          description: 'Enable biometric authentication'
        },
        {
          configKey: 'offline_mode',
          configValue: { enabled: true, syncInterval: 300000 },
          configType: 'feature_flag',
          description: 'Enable offline mode with automatic sync'
        },
        {
          configKey: 'real_time_notifications',
          configValue: { enabled: true, soundEnabled: true, vibrationEnabled: true },
          configType: 'feature_flag',
          description: 'Enable real-time push notifications'
        },
        
        // App settings
        {
          configKey: 'session_timeout',
          configValue: { minutes: 30, warningMinutes: 5 },
          configType: 'app_setting',
          description: 'Session timeout configuration'
        },
        {
          configKey: 'auto_sync_interval',
          configValue: { minutes: 15, onlyOnWifi: false },
          configType: 'app_setting',
          description: 'Automatic data sync interval'
        },
        {
          configKey: 'max_file_upload_size',
          configValue: { bytes: 10485760, displayMB: 10 },
          configType: 'app_setting',
          description: 'Maximum file upload size (10MB)'
        },
        
        // UI configuration
        {
          configKey: 'default_theme',
          configValue: { 
            name: 'bharatchain_light',
            primaryColor: '#4F46E5',
            secondaryColor: '#10B981',
            backgroundColor: '#FFFFFF',
            textColor: '#1F2937'
          },
          configType: 'ui_config',
          description: 'Default app theme configuration'
        },
        {
          configKey: 'supported_languages',
          configValue: [
            { code: 'en', name: 'English', isDefault: true },
            { code: 'hi', name: 'हिंदी (Hindi)', isDefault: false },
            { code: 'bn', name: 'বাংলা (Bengali)', isDefault: false },
            { code: 'te', name: 'తెలుగు (Telugu)', isDefault: false },
            { code: 'mr', name: 'मराठी (Marathi)', isDefault: false },
            { code: 'ta', name: 'தமிழ் (Tamil)', isDefault: false },
            { code: 'gu', name: 'ગુજરાતી (Gujarati)', isDefault: false },
            { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', isDefault: false }
          ],
          configType: 'ui_config',
          description: 'Supported languages for the mobile app'
        },
        
        // API configuration
        {
          configKey: 'api_endpoints',
          configValue: {
            base: process.env.API_BASE_URL || 'https://api.bharatchain.gov.in',
            websocket: process.env.WS_URL || 'wss://ws.bharatchain.gov.in',
            timeout: 30000,
            retryAttempts: 3
          },
          configType: 'api_config',
          description: 'API endpoint configuration'
        },
        
        // Security settings
        {
          configKey: 'security_policies',
          configValue: {
            minPasswordLength: 8,
            requireSpecialCharacters: true,
            sessionTimeout: 1800,
            maxLoginAttempts: 5,
            lockoutDuration: 900,
            requireTwoFactor: false
          },
          configType: 'security_setting',
          description: 'Security policy configuration'
        }
      ];

      for (const config of defaultConfigs) {
        const existing = await AppConfig.findOne({
          where: { configKey: config.configKey }
        });

        if (!existing) {
          await AppConfig.create(config);
        }
      }

      console.log('📋 Default mobile configurations loaded');

    } catch (error) {
      console.error('❌ Failed to load default configurations:', error);
    }
  }

  /**
   * Get app configuration for user/device
   * @param {string} userAddress - User's wallet address
   * @param {string} deviceId - Device ID
   * @param {string} platform - Platform (ios/android/web)
   * @param {string} appVersion - App version
   * @param {string} environment - Environment
   */
  async getAppConfiguration(userAddress, deviceId, platform = 'all', appVersion = null, environment = 'production') {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const cacheKey = `config_${userAddress}_${deviceId}_${platform}_${environment}`;
      
      // Check cache
      if (this.configCache.has(cacheKey)) {
        const cached = this.configCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      // Get app-level configurations
      const appConfigs = await AppConfig.findAll({
        where: {
          isActive: true,
          [Sequelize.Op.or]: [
            { environment },
            { environment: 'all' }
          ],
          [Sequelize.Op.or]: [
            { platform },
            { platform: 'all' }
          ]
        },
        order: [['priority', 'DESC']]
      });

      // Get user-specific configurations
      const userConfigs = await UserConfig.findAll({
        where: {
          userAddress: userAddress.toLowerCase(),
          [Sequelize.Op.or]: [
            { deviceId },
            { deviceId: null }
          ]
        }
      });

      // Get feature flags
      const featureFlags = await this.getFeatureFlags(userAddress, platform, environment);

      // Merge configurations
      const config = {
        app: {},
        user: {},
        features: featureFlags,
        metadata: {
          userAddress: userAddress.toLowerCase(),
          deviceId,
          platform,
          environment,
          appVersion,
          lastUpdated: new Date().toISOString()
        }
      };

      // Process app configurations
      for (const appConfig of appConfigs) {
        if (this.shouldApplyConfig(appConfig, userAddress, appVersion)) {
          config.app[appConfig.configKey] = {
            value: appConfig.configValue,
            type: appConfig.configType,
            priority: appConfig.priority
          };
        }
      }

      // Process user configurations
      for (const userConfig of userConfigs) {
        if (!config.user[userConfig.configCategory]) {
          config.user[userConfig.configCategory] = {};
        }
        config.user[userConfig.configCategory][userConfig.configKey] = {
          value: userConfig.configValue,
          lastModified: userConfig.lastModified,
          isSystemDefault: userConfig.isSystemDefault
        };
      }

      // Cache the result
      this.configCache.set(cacheKey, {
        data: config,
        timestamp: Date.now()
      });

      return config;

    } catch (error) {
      console.error('❌ Failed to get app configuration:', error);
      throw error;
    }
  }

  /**
   * Check if config should be applied to user/version
   * @param {Object} config - App configuration
   * @param {string} userAddress - User's address
   * @param {string} appVersion - App version
   */
  shouldApplyConfig(config, userAddress, appVersion) {
    // Check target users
    if (config.targetUsers && config.targetUsers.length > 0) {
      const isTargeted = config.targetUsers.some(target => {
        if (typeof target === 'string') {
          return target.toLowerCase() === userAddress.toLowerCase();
        }
        if (target.type === 'address') {
          return target.value.toLowerCase() === userAddress.toLowerCase();
        }
        if (target.type === 'role') {
          // Check user role (would integrate with your auth system)
          return this.checkUserRole(userAddress, target.value);
        }
        return false;
      });
      
      if (!isTargeted) {
        return false;
      }
    }

    // Check version constraints
    if (config.minAppVersion && appVersion) {
      if (this.compareVersions(appVersion, config.minAppVersion) < 0) {
        return false;
      }
    }

    if (config.maxAppVersion && appVersion) {
      if (this.compareVersions(appVersion, config.maxAppVersion) > 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get feature flags for user
   * @param {string} userAddress - User's address
   * @param {string} platform - Platform
   * @param {string} environment - Environment
   */
  async getFeatureFlags(userAddress, platform = 'all', environment = 'production') {
    try {
      const flags = await FeatureFlag.findAll({
        where: {
          [Sequelize.Op.or]: [
            { environment },
            { environment: 'all' }
          ],
          [Sequelize.Op.or]: [
            { platform },
            { platform: 'all' }
          ]
        }
      });

      const result = {};

      for (const flag of flags) {
        const isEnabled = this.evaluateFeatureFlag(flag, userAddress);
        
        result[flag.flagName] = {
          enabled: isEnabled,
          variant: this.getFeatureFlagVariant(flag, userAddress),
          rolloutPercentage: flag.rolloutPercentage,
          conditions: flag.conditions
        };
      }

      return result;

    } catch (error) {
      console.error('❌ Failed to get feature flags:', error);
      return {};
    }
  }

  /**
   * Evaluate if feature flag should be enabled for user
   * @param {Object} flag - Feature flag
   * @param {string} userAddress - User's address
   */
  evaluateFeatureFlag(flag, userAddress) {
    if (!flag.isEnabled) {
      return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const userHash = this.hashString(userAddress + flag.flagName);
      const userPercentile = userHash % 100;
      if (userPercentile >= flag.rolloutPercentage) {
        return false;
      }
    }

    // Check conditions
    if (flag.conditions && Object.keys(flag.conditions).length > 0) {
      return this.evaluateConditions(flag.conditions, userAddress);
    }

    return true;
  }

  /**
   * Get feature flag variant for A/B testing
   * @param {Object} flag - Feature flag
   * @param {string} userAddress - User's address
   */
  getFeatureFlagVariant(flag, userAddress) {
    if (!flag.variants || Object.keys(flag.variants).length === 0) {
      return 'default';
    }

    const userHash = this.hashString(userAddress + flag.flagName + 'variant');
    const variantNames = Object.keys(flag.variants);
    const variantIndex = userHash % variantNames.length;
    
    return variantNames[variantIndex];
  }

  /**
   * Save user configuration
   * @param {string} userAddress - User's address
   * @param {string} deviceId - Device ID
   * @param {string} configKey - Configuration key
   * @param {*} configValue - Configuration value
   * @param {string} category - Configuration category
   */
  async saveUserConfig(userAddress, deviceId, configKey, configValue, category) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const [userConfig, created] = await UserConfig.findOrCreate({
        where: {
          userAddress: userAddress.toLowerCase(),
          deviceId,
          configKey
        },
        defaults: {
          configValue,
          configCategory: category,
          lastModified: new Date()
        }
      });

      if (!created) {
        await userConfig.update({
          configValue,
          configCategory: category,
          lastModified: new Date()
        });
      }

      // Clear cache for this user
      const cachePattern = `config_${userAddress.toLowerCase()}_${deviceId}`;
      for (const [key] of this.configCache) {
        if (key.startsWith(cachePattern)) {
          this.configCache.delete(key);
        }
      }

      console.log(`📱 User config saved: ${configKey} for ${userAddress}`);
      return userConfig.toJSON();

    } catch (error) {
      console.error('❌ Failed to save user config:', error);
      throw error;
    }
  }

  /**
   * Get app version info
   * @param {string} platform - Platform
   * @param {string} currentVersion - Current app version
   */
  async getAppVersionInfo(platform, currentVersion = null) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const latestVersion = await AppVersion.findOne({
        where: { platform, isLatest: true }
      });

      if (!latestVersion) {
        return {
          hasUpdate: false,
          isSupported: true,
          message: 'No version information available'
        };
      }

      let needsUpdate = false;
      let forceUpdate = false;
      let isSupported = true;

      if (currentVersion) {
        const currentVersionInfo = await AppVersion.findOne({
          where: { platform, version: currentVersion }
        });

        needsUpdate = this.compareVersions(currentVersion, latestVersion.version) < 0;
        forceUpdate = currentVersionInfo ? currentVersionInfo.forceUpdate : false;
        isSupported = currentVersionInfo ? currentVersionInfo.isSupported : false;
      }

      return {
        current: currentVersion,
        latest: latestVersion.version,
        hasUpdate: needsUpdate,
        forceUpdate,
        isSupported,
        downloadUrl: latestVersion.downloadUrl,
        releaseNotes: latestVersion.releaseNotes,
        updateMessage: latestVersion.updateMessage,
        features: latestVersion.features,
        bugFixes: latestVersion.bugFixes,
        releaseDate: latestVersion.releaseDate
      };

    } catch (error) {
      console.error('❌ Failed to get app version info:', error);
      return {
        hasUpdate: false,
        isSupported: true,
        error: error.message
      };
    }
  }

  /**
   * Utility functions
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  compareVersions(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part < v2Part) return -1;
      if (v1Part > v2Part) return 1;
    }
    
    return 0;
  }

  checkUserRole(userAddress, role) {
    // Placeholder - integrate with your auth system
    return role === 'citizen';
  }

  evaluateConditions(conditions, userAddress) {
    // Placeholder for complex condition evaluation
    // Could include user roles, geographic location, etc.
    return true;
  }

  /**
   * Clear configuration cache
   */
  clearCache() {
    this.configCache.clear();
    console.log('🧹 Mobile config cache cleared');
  }

  /**
   * Get service statistics
   */
  async getStatistics() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const [appConfigStats, userConfigStats, featureFlagStats, versionStats] = await Promise.all([
        AppConfig.count({ where: { isActive: true } }),
        UserConfig.count(),
        FeatureFlag.count({ where: { isEnabled: true } }),
        AppVersion.count({ where: { isSupported: true } })
      ]);

      return {
        appConfigs: appConfigStats,
        userConfigs: userConfigStats,
        activeFeatureFlags: featureFlagStats,
        supportedVersions: versionStats,
        cacheSize: this.configCache.size,
        isInitialized: this.initialized
      };

    } catch (error) {
      console.error('❌ Failed to get mobile config statistics:', error);
      return {
        appConfigs: 0,
        userConfigs: 0,
        activeFeatureFlags: 0,
        supportedVersions: 0,
        cacheSize: 0,
        isInitialized: this.initialized
      };
    }
  }
}

// Create singleton instance
const mobileConfigService = new MobileConfigService();

module.exports = mobileConfigService;