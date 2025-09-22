const express = require('express');
const router = express.Router();
const qrCodeService = require('../services/qr-code');

/**
 * @route POST /api/qr/generate
 * @desc Generate QR code for entity
 * @access Public (with authentication)
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      entityType,
      entityId,
      ownerAddress,
      purpose,
      permissions = [],
      metadata = {},
      expiryHours = 24,
      maxUsage = null,
      qrCodeOptions = {}
    } = req.body;

    // Validate required fields
    if (!entityType || !entityId || !ownerAddress || !purpose) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: entityType, entityId, ownerAddress, purpose'
      });
    }

    // Validate entity type
    const validEntityTypes = ['document', 'grievance', 'citizen_profile', 'verification', 'payment', 'service_access'];
    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid entity type. Must be one of: ${validEntityTypes.join(', ')}`
      });
    }

    // Validate purpose
    const validPurposes = ['share', 'verify', 'authenticate', 'pay', 'access'];
    if (!validPurposes.includes(purpose)) {
      return res.status(400).json({
        success: false,
        error: `Invalid purpose. Must be one of: ${validPurposes.join(', ')}`
      });
    }

    // Generate QR code
    const qrResult = await qrCodeService.generateQRCode(
      entityType,
      entityId,
      ownerAddress,
      purpose,
      {
        permissions,
        metadata,
        expiryHours,
        maxUsage,
        qrCodeOptions
      }
    );

    res.json({
      success: true,
      data: qrResult,
      message: 'QR code generated successfully'
    });

  } catch (error) {
    console.error('❌ QR code generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate QR code'
    });
  }
});

/**
 * @route POST /api/qr/scan
 * @desc Scan and validate QR code
 * @access Public
 */
router.post('/scan', async (req, res) => {
  try {
    const {
      qrData,
      scannerAddress,
      context = {}
    } = req.body;

    if (!qrData || !scannerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: qrData, scannerAddress'
      });
    }

    // Add request context
    const scanContext = {
      ...context,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };

    // Scan QR code
    const scanResult = await qrCodeService.scanQRCode(qrData, scannerAddress, scanContext);

    if (scanResult.success) {
      res.json({
        success: true,
        data: scanResult,
        message: 'QR code scanned successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: scanResult.error,
        data: scanResult
      });
    }

  } catch (error) {
    console.error('❌ QR code scan error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to scan QR code'
    });
  }
});

/**
 * @route GET /api/qr/mobile/:tokenId
 * @desc Mobile-friendly QR code landing page
 * @access Public
 */
router.get('/mobile/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const scannerAddress = req.query.scanner || 'anonymous';

    // Scan QR code with token ID
    const scanResult = await qrCodeService.scanQRCode(tokenId, scannerAddress, {
      mobile: true,
      source: 'mobile_web',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    if (scanResult.success) {
      // Return mobile-friendly HTML page
      const html = generateMobilePage(scanResult);
      res.send(html);
    } else {
      // Return error page
      const errorHtml = generateErrorPage(scanResult.error);
      res.status(400).send(errorHtml);
    }

  } catch (error) {
    console.error('❌ Mobile QR scan error:', error);
    const errorHtml = generateErrorPage('Failed to process QR code');
    res.status(500).send(errorHtml);
  }
});

/**
 * @route POST /api/qr/revoke
 * @desc Revoke QR code
 * @access Private
 */
router.post('/revoke', async (req, res) => {
  try {
    const { tokenId, ownerAddress } = req.body;

    if (!tokenId || !ownerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: tokenId, ownerAddress'
      });
    }

    await qrCodeService.revokeQRCode(tokenId, ownerAddress);

    res.json({
      success: true,
      message: 'QR code revoked successfully'
    });

  } catch (error) {
    console.error('❌ QR code revoke error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to revoke QR code'
    });
  }
});

/**
 * @route GET /api/qr/stats/:tokenId
 * @desc Get QR code usage statistics
 * @access Private
 */
router.get('/stats/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { ownerAddress } = req.query;

    if (!ownerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: ownerAddress'
      });
    }

    const stats = await qrCodeService.getQRCodeStats(tokenId, ownerAddress);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ QR code stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get QR code statistics'
    });
  }
});

/**
 * @route GET /api/qr/list
 * @desc List user's QR codes
 * @access Private
 */
router.get('/list', async (req, res) => {
  try {
    const {
      ownerAddress,
      entityType,
      purpose,
      isActive,
      limit = 50,
      offset = 0
    } = req.query;

    if (!ownerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: ownerAddress'
      });
    }

    const qrCodes = await qrCodeService.listUserQRCodes(ownerAddress, {
      entityType,
      purpose,
      isActive: isActive !== undefined ? isActive === 'true' : null,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: qrCodes,
      meta: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: qrCodes.length
      }
    });

  } catch (error) {
    console.error('❌ QR code list error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list QR codes'
    });
  }
});

/**
 * @route GET /api/qr/system/stats
 * @desc Get system-wide QR code statistics
 * @access Public
 */
router.get('/system/stats', async (req, res) => {
  try {
    const stats = await qrCodeService.getStatistics();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ QR code system stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get system statistics'
    });
  }
});

/**
 * @route POST /api/qr/batch/generate
 * @desc Generate multiple QR codes
 * @access Private
 */
router.post('/batch/generate', async (req, res) => {
  try {
    const { requests, ownerAddress } = req.body;

    if (!requests || !Array.isArray(requests) || !ownerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request format. Expected: { requests: [...], ownerAddress: "..." }'
      });
    }

    if (requests.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 QR codes can be generated in a single batch'
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < requests.length; i++) {
      try {
        const request = requests[i];
        const qrResult = await qrCodeService.generateQRCode(
          request.entityType,
          request.entityId,
          ownerAddress,
          request.purpose,
          {
            permissions: request.permissions || [],
            metadata: request.metadata || {},
            expiryHours: request.expiryHours || 24,
            maxUsage: request.maxUsage || null,
            qrCodeOptions: request.qrCodeOptions || {}
          }
        );

        results.push({
          index: i,
          success: true,
          data: qrResult
        });

      } catch (error) {
        errors.push({
          index: i,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        results,
        errors,
        total: requests.length,
        successful: results.length,
        failed: errors.length
      },
      message: `Batch generation completed: ${results.length} successful, ${errors.length} failed`
    });

  } catch (error) {
    console.error('❌ Batch QR generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate QR codes in batch'
    });
  }
});

/**
 * Generate mobile-friendly HTML page for QR scan results
 */
function generateMobilePage(scanResult) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BharatChain - QR Code Scan</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      color: #333;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: #4F46E5;
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      font-size: 24px;
      margin-bottom: 10px;
    }
    .header p {
      opacity: 0.9;
      font-size: 16px;
    }
    .content {
      padding: 30px 20px;
    }
    .info-card {
      background: #F8FAFC;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      border-left: 4px solid #4F46E5;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }
    .info-row:last-child {
      margin-bottom: 0;
    }
    .label {
      font-weight: 600;
      color: #64748B;
      min-width: 100px;
    }
    .value {
      color: #1E293B;
      word-break: break-word;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-success {
      background: #DCFCE7;
      color: #166534;
    }
    .actions {
      display: grid;
      gap: 15px;
      margin-top: 30px;
    }
    .btn {
      padding: 15px 20px;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      text-align: center;
      transition: all 0.3s ease;
    }
    .btn-primary {
      background: #4F46E5;
      color: white;
    }
    .btn-primary:hover {
      background: #4338CA;
      transform: translateY(-2px);
    }
    .btn-secondary {
      background: #F1F5F9;
      color: #475569;
      border: 2px solid #E2E8F0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #64748B;
      font-size: 14px;
    }
    @media (max-width: 480px) {
      .container { margin: 10px; }
      .info-row { flex-direction: column; }
      .label { margin-bottom: 5px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🇮🇳 BharatChain</h1>
      <p>QR Code Verification</p>
    </div>
    
    <div class="content">
      <div class="info-card">
        <div class="info-row">
          <span class="label">Status:</span>
          <span class="value">
            <span class="status-badge status-success">✓ Verified</span>
          </span>
        </div>
        <div class="info-row">
          <span class="label">Type:</span>
          <span class="value">${scanResult.entityType}</span>
        </div>
        <div class="info-row">
          <span class="label">Purpose:</span>
          <span class="value">${scanResult.purpose}</span>
        </div>
        <div class="info-row">
          <span class="label">Entity ID:</span>
          <span class="value">${scanResult.entityId}</span>
        </div>
        <div class="info-row">
          <span class="label">Scan Time:</span>
          <span class="value">${new Date(scanResult.scanTime).toLocaleString()}</span>
        </div>
        ${scanResult.usageCount ? `
        <div class="info-row">
          <span class="label">Usage Count:</span>
          <span class="value">${scanResult.usageCount}${scanResult.maxUsage ? ` / ${scanResult.maxUsage}` : ''}</span>
        </div>
        ` : ''}
      </div>

      ${scanResult.entityData ? `
      <div class="info-card">
        <h3 style="margin-bottom: 15px; color: #1E293B;">Entity Information</h3>
        ${Object.entries(scanResult.entityData).map(([key, value]) => `
          <div class="info-row">
            <span class="label">${key}:</span>
            <span class="value">${typeof value === 'object' ? JSON.stringify(value) : value}</span>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <div class="actions">
        <button class="btn btn-primary" onclick="window.close()">
          Close
        </button>
        <a href="bharatchain://qr/${scanResult.tokenId}" class="btn btn-secondary">
          Open in BharatChain App
        </a>
      </div>
    </div>

    <div class="footer">
      <p>Powered by BharatChain<br>
      Government of India Digital Initiative</p>
    </div>
  </div>

  <script>
    // Auto-close after 30 seconds
    setTimeout(() => {
      if (confirm('Auto-closing in 5 seconds. Close now?')) {
        window.close();
      }
    }, 25000);

    // Deep link handling
    setTimeout(() => {
      const deepLink = 'bharatchain://qr/${scanResult.tokenId}';
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = deepLink;
      document.body.appendChild(iframe);
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 1000);
  </script>
</body>
</html>
  `;
}

/**
 * Generate error page for failed scans
 */
function generateErrorPage(error) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BharatChain - QR Code Error</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      min-height: 100vh;
      padding: 20px;
      color: #333;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 400px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      text-align: center;
      padding: 40px 20px;
    }
    .error-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    h1 {
      color: #dc2626;
      margin-bottom: 15px;
      font-size: 24px;
    }
    .error-message {
      color: #64748B;
      margin-bottom: 30px;
      font-size: 16px;
      line-height: 1.5;
    }
    .btn {
      padding: 15px 30px;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      background: #4F46E5;
      color: white;
      text-decoration: none;
      display: inline-block;
      transition: all 0.3s ease;
    }
    .btn:hover {
      background: #4338CA;
      transform: translateY(-2px);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="error-icon">❌</div>
    <h1>QR Code Error</h1>
    <p class="error-message">${error}</p>
    <button class="btn" onclick="window.close()">Close</button>
  </div>
</body>
</html>
  `;
}

module.exports = router;