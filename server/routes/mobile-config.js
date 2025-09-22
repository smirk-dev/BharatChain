const express = require('express');
const router = express.Router();
const mobileConfigService = require('../services/mobile-config');

/**
 * @route GET /api/mobile-config/app
 * @desc Get app configuration for user/device
 * @access Public
 */
router.get('/app', async (req, res) => {
  try {
    const {
      userAddress,
      deviceId,
      platform = 'all',
      appVersion,
      environment = 'production'
    } = req.query;

    if (!userAddress || !deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: userAddress, deviceId'
      });
    }

    // Validate platform
    const validPlatforms = ['ios', 'android', 'web', 'all'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        success: false,
        error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}`
      });
    }

    // Validate environment
    const validEnvironments = ['development', 'staging', 'production'];
    if (!validEnvironments.includes(environment)) {
      return res.status(400).json({
        success: false,
        error: `Invalid environment. Must be one of: ${validEnvironments.join(', ')}`
      });
    }

    const config = await mobileConfigService.getAppConfiguration(
      userAddress,
      deviceId,
      platform,
      appVersion,
      environment
    );

    res.json({
      success: true,
      data: config,
      message: 'App configuration retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Get app config error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get app configuration'
    });
  }
});

/**
 * @route GET /api/mobile-config/features
 * @desc Get feature flags for user
 * @access Public
 */
router.get('/features', async (req, res) => {
  try {
    const {
      userAddress,
      platform = 'all',
      environment = 'production'
    } = req.query;

    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: userAddress'
      });
    }

    const featureFlags = await mobileConfigService.getFeatureFlags(userAddress, platform, environment);

    res.json({
      success: true,
      data: featureFlags,
      message: 'Feature flags retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Get feature flags error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get feature flags'
    });
  }
});

/**
 * @route GET /api/mobile-config/version
 * @desc Get app version information
 * @access Public
 */
router.get('/version', async (req, res) => {
  try {
    const {
      platform,
      currentVersion
    } = req.query;

    if (!platform) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: platform'
      });
    }

    const validPlatforms = ['ios', 'android', 'web'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        success: false,
        error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}`
      });
    }

    const versionInfo = await mobileConfigService.getAppVersionInfo(platform, currentVersion);

    res.json({
      success: true,
      data: versionInfo,
      message: 'Version information retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Get version info error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get version information'
    });
  }
});

/**
 * @route POST /api/mobile-config/user
 * @desc Save user configuration
 * @access Private
 */
router.post('/user', async (req, res) => {
  try {
    const {
      userAddress,
      deviceId,
      configKey,
      configValue,
      category
    } = req.body;

    if (!userAddress || !deviceId || !configKey || configValue === undefined || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userAddress, deviceId, configKey, configValue, category'
      });
    }

    // Validate category
    const validCategories = ['accessibility', 'language', 'theme', 'notifications', 'privacy', 'security'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    const userConfig = await mobileConfigService.saveUserConfig(
      userAddress,
      deviceId,
      configKey,
      configValue,
      category
    );

    res.json({
      success: true,
      data: userConfig,
      message: 'User configuration saved successfully'
    });

  } catch (error) {
    console.error('❌ Save user config error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save user configuration'
    });
  }
});

/**
 * @route PUT /api/mobile-config/user/batch
 * @desc Save multiple user configurations
 * @access Private
 */
router.put('/user/batch', async (req, res) => {
  try {
    const {
      userAddress,
      deviceId,
      configs
    } = req.body;

    if (!userAddress || !deviceId || !configs || !Array.isArray(configs)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userAddress, deviceId, configs (array)'
      });
    }

    if (configs.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 configurations can be saved in a single batch'
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < configs.length; i++) {
      try {
        const config = configs[i];
        
        if (!config.configKey || config.configValue === undefined || !config.category) {
          errors.push({
            index: i,
            error: 'Missing required fields: configKey, configValue, category'
          });
          continue;
        }

        const userConfig = await mobileConfigService.saveUserConfig(
          userAddress,
          deviceId,
          config.configKey,
          config.configValue,
          config.category
        );

        results.push({
          index: i,
          success: true,
          data: userConfig
        });

      } catch (error) {
        errors.push({
          index: i,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        results,
        errors,
        total: configs.length,
        successful: results.length,
        failed: errors.length
      },
      message: `Batch configuration save completed: ${results.length} successful, ${errors.length} failed`
    });

  } catch (error) {
    console.error('❌ Batch user config error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save user configurations'
    });
  }
});

/**
 * @route GET /api/mobile-config/languages
 * @desc Get supported languages
 * @access Public
 */
router.get('/languages', async (req, res) => {
  try {
    // This would typically be retrieved from the configuration service
    const languages = [
      { code: 'en', name: 'English', nativeName: 'English', isDefault: true, isRTL: false },
      { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', isDefault: false, isRTL: false },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', isDefault: false, isRTL: false },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', isDefault: false, isRTL: false },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी', isDefault: false, isRTL: false },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', isDefault: false, isRTL: false },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', isDefault: false, isRTL: false },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', isDefault: false, isRTL: false },
      { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', isDefault: false, isRTL: false },
      { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', isDefault: false, isRTL: false },
      { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', isDefault: false, isRTL: false },
      { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', isDefault: false, isRTL: false }
    ];

    res.json({
      success: true,
      data: languages,
      message: 'Supported languages retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Get languages error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get supported languages'
    });
  }
});

/**
 * @route GET /api/mobile-config/themes
 * @desc Get available themes
 * @access Public
 */
router.get('/themes', async (req, res) => {
  try {
    const themes = [
      {
        id: 'bharatchain_light',
        name: 'BharatChain Light',
        description: 'Default light theme with government colors',
        isDefault: true,
        colors: {
          primary: '#4F46E5',
          secondary: '#10B981',
          background: '#FFFFFF',
          surface: '#F8FAFC',
          text: '#1F2937',
          textSecondary: '#6B7280',
          accent: '#F59E0B',
          error: '#EF4444',
          warning: '#F59E0B',
          success: '#10B981',
          info: '#3B82F6'
        }
      },
      {
        id: 'bharatchain_dark',
        name: 'BharatChain Dark',
        description: 'Dark theme for low-light usage',
        isDefault: false,
        colors: {
          primary: '#6366F1',
          secondary: '#34D399',
          background: '#111827',
          surface: '#1F2937',
          text: '#F9FAFB',
          textSecondary: '#D1D5DB',
          accent: '#FBBF24',
          error: '#F87171',
          warning: '#FBBF24',
          success: '#34D399',
          info: '#60A5FA'
        }
      },
      {
        id: 'high_contrast',
        name: 'High Contrast',
        description: 'High contrast theme for accessibility',
        isDefault: false,
        isAccessibility: true,
        colors: {
          primary: '#000000',
          secondary: '#FFFFFF',
          background: '#FFFFFF',
          surface: '#F0F0F0',
          text: '#000000',
          textSecondary: '#333333',
          accent: '#0000FF',
          error: '#FF0000',
          warning: '#FF8800',
          success: '#008800',
          info: '#0088FF'
        }
      },
      {
        id: 'saffron_theme',
        name: 'Saffron Theme',
        description: 'Theme inspired by Indian flag colors',
        isDefault: false,
        colors: {
          primary: '#FF9933',
          secondary: '#138808',
          background: '#FFFFFF',
          surface: '#FFF8F0',
          text: '#1F2937',
          textSecondary: '#6B7280',
          accent: '#000080',
          error: '#EF4444',
          warning: '#F59E0B',
          success: '#138808',
          info: '#3B82F6'
        }
      }
    ];

    res.json({
      success: true,
      data: themes,
      message: 'Available themes retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Get themes error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get available themes'
    });
  }
});

/**
 * @route GET /api/mobile-config/accessibility
 * @desc Get accessibility options
 * @access Public
 */
router.get('/accessibility', async (req, res) => {
  try {
    const accessibilityOptions = {
      textSize: {
        options: [
          { id: 'small', name: 'Small', scale: 0.85 },
          { id: 'normal', name: 'Normal', scale: 1.0, isDefault: true },
          { id: 'large', name: 'Large', scale: 1.15 },
          { id: 'extra_large', name: 'Extra Large', scale: 1.3 },
          { id: 'huge', name: 'Huge', scale: 1.5 }
        ]
      },
      contrast: {
        options: [
          { id: 'normal', name: 'Normal', isDefault: true },
          { id: 'high', name: 'High Contrast' },
          { id: 'reverse', name: 'Reverse Contrast' }
        ]
      },
      motion: {
        options: [
          { id: 'full', name: 'Full Motion', isDefault: true },
          { id: 'reduced', name: 'Reduced Motion' },
          { id: 'none', name: 'No Motion' }
        ]
      },
      screenReader: {
        options: [
          { id: 'enabled', name: 'Screen Reader Optimized' },
          { id: 'disabled', name: 'Standard Interface', isDefault: true }
        ]
      },
      colorBlind: {
        options: [
          { id: 'none', name: 'No Color Adjustment', isDefault: true },
          { id: 'protanopia', name: 'Protanopia (Red-Blind)' },
          { id: 'deuteranopia', name: 'Deuteranopia (Green-Blind)' },
          { id: 'tritanopia', name: 'Tritanopia (Blue-Blind)' },
          { id: 'monochrome', name: 'Monochrome' }
        ]
      },
      hapticFeedback: {
        options: [
          { id: 'full', name: 'Full Haptic Feedback', isDefault: true },
          { id: 'light', name: 'Light Haptic Feedback' },
          { id: 'disabled', name: 'No Haptic Feedback' }
        ]
      },
      audioDescriptions: {
        options: [
          { id: 'enabled', name: 'Audio Descriptions Enabled' },
          { id: 'disabled', name: 'Audio Descriptions Disabled', isDefault: true }
        ]
      }
    };

    res.json({
      success: true,
      data: accessibilityOptions,
      message: 'Accessibility options retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Get accessibility options error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get accessibility options'
    });
  }
});

/**
 * @route POST /api/mobile-config/cache/clear
 * @desc Clear configuration cache
 * @access Admin
 */
router.post('/cache/clear', async (req, res) => {
  try {
    // In production, add admin authentication here
    
    mobileConfigService.clearCache();

    res.json({
      success: true,
      message: 'Configuration cache cleared successfully'
    });

  } catch (error) {
    console.error('❌ Clear cache error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear cache'
    });
  }
});

/**
 * @route GET /api/mobile-config/stats
 * @desc Get mobile configuration statistics
 * @access Public
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await mobileConfigService.getStatistics();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Mobile config stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get mobile config statistics'
    });
  }
});

/**
 * @route GET /api/mobile-config/health
 * @desc Health check endpoint for mobile config service
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    const stats = await mobileConfigService.getStatistics();
    
    const health = {
      status: stats.isInitialized ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'mobile-config',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      stats
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health
    });

  } catch (error) {
    console.error('❌ Mobile config health check error:', error);
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'mobile-config',
        error: error.message
      }
    });
  }
});

module.exports = router;