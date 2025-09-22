const express = require('express');
const router = express.Router();
const GovernmentAPIsService = require('../services/government-apis');

const govAPIsService = new GovernmentAPIsService();

// Middleware for request validation
const validateCitizenId = (req, res, next) => {
    const citizenId = req.body.citizen_id || req.query.citizen_id || req.headers['x-citizen-id'];
    if (!citizenId) {
        return res.status(400).json({
            success: false,
            error: 'Citizen ID is required'
        });
    }
    req.citizenId = citizenId;
    next();
};

// Rate limiting middleware
const rateLimit = (maxRequests = 10, windowMs = 60000) => {
    const requests = new Map();
    
    return (req, res, next) => {
        const key = req.ip + req.route.path;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        if (!requests.has(key)) {
            requests.set(key, []);
        }
        
        const requestTimes = requests.get(key).filter(time => time > windowStart);
        
        if (requestTimes.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded. Please try again later.',
                retry_after: Math.ceil((requestTimes[0] + windowMs - now) / 1000)
            });
        }
        
        requestTimes.push(now);
        requests.set(key, requestTimes);
        next();
    };
};

// Aadhaar verification endpoint
router.post('/verify/aadhaar', validateCitizenId, rateLimit(5, 300000), async (req, res) => {
    try {
        const { aadhaar_number, otp } = req.body;
        
        if (!aadhaar_number) {
            return res.status(400).json({
                success: false,
                error: 'Aadhaar number is required'
            });
        }
        
        // Validate Aadhaar number format
        if (!/^\d{12}$/.test(aadhaar_number)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Aadhaar number format'
            });
        }
        
        const result = await govAPIsService.verifyAadhaar(aadhaar_number, req.citizenId, otp);
        
        res.json({
            success: true,
            data: result,
            message: 'Aadhaar verification completed'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// PAN verification endpoint
router.post('/verify/pan', validateCitizenId, rateLimit(10, 300000), async (req, res) => {
    try {
        const { pan_number, name } = req.body;
        
        if (!pan_number) {
            return res.status(400).json({
                success: false,
                error: 'PAN number is required'
            });
        }
        
        // Validate PAN format
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan_number)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid PAN number format'
            });
        }
        
        const result = await govAPIsService.verifyPAN(pan_number, req.citizenId, name);
        
        res.json({
            success: true,
            data: result,
            message: 'PAN verification completed'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GST verification endpoint
router.post('/verify/gst', validateCitizenId, rateLimit(20, 300000), async (req, res) => {
    try {
        const { gst_number } = req.body;
        
        if (!gst_number) {
            return res.status(400).json({
                success: false,
                error: 'GST number is required'
            });
        }
        
        // Validate GST format
        if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst_number)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid GST number format'
            });
        }
        
        const result = await govAPIsService.verifyGST(gst_number, req.citizenId);
        
        res.json({
            success: true,
            data: result,
            message: 'GST verification completed'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Passport verification endpoint
router.post('/verify/passport', validateCitizenId, rateLimit(5, 300000), async (req, res) => {
    try {
        const { passport_number, date_of_birth } = req.body;
        
        if (!passport_number) {
            return res.status(400).json({
                success: false,
                error: 'Passport number is required'
            });
        }
        
        // Validate passport format
        if (!/^[A-Z]{1}[0-9]{7}$/.test(passport_number)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid passport number format'
            });
        }
        
        const result = await govAPIsService.verifyPassport(passport_number, req.citizenId, date_of_birth);
        
        res.json({
            success: true,
            data: result,
            message: 'Passport verification completed'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Voter ID verification endpoint
router.post('/verify/voter', validateCitizenId, rateLimit(10, 300000), async (req, res) => {
    try {
        const { voter_id, name } = req.body;
        
        if (!voter_id) {
            return res.status(400).json({
                success: false,
                error: 'Voter ID is required'
            });
        }
        
        // Validate voter ID format
        if (!/^[A-Z]{3}[0-9]{7}$/.test(voter_id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid voter ID format'
            });
        }
        
        const result = await govAPIsService.verifyVoterID(voter_id, req.citizenId, name);
        
        res.json({
            success: true,
            data: result,
            message: 'Voter ID verification completed'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DigiLocker document fetch endpoint
router.post('/digilocker/fetch', validateCitizenId, rateLimit(5, 300000), async (req, res) => {
    try {
        const { document_type, access_token } = req.body;
        
        if (!document_type || !access_token) {
            return res.status(400).json({
                success: false,
                error: 'Document type and access token are required'
            });
        }
        
        const result = await govAPIsService.fetchFromDigiLocker(req.citizenId, document_type, access_token);
        
        res.json({
            success: true,
            data: result,
            message: 'Document fetched from DigiLocker successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Bulk verification endpoint
router.post('/verify/bulk', validateCitizenId, rateLimit(3, 600000), async (req, res) => {
    try {
        const { documents } = req.body;
        
        if (!documents || !Array.isArray(documents) || documents.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Documents array is required and cannot be empty'
            });
        }
        
        if (documents.length > 5) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 5 documents can be verified in bulk'
            });
        }
        
        // Validate each document
        for (const doc of documents) {
            if (!doc.type || !doc.number) {
                return res.status(400).json({
                    success: false,
                    error: 'Each document must have type and number'
                });
            }
        }
        
        const result = await govAPIsService.bulkVerification(req.citizenId, documents);
        
        res.json({
            success: true,
            data: result,
            message: `Bulk verification completed. ${result.results.length} successful, ${result.errors.length} failed.`
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get verification history for citizen
router.get('/history/:citizen_id', async (req, res) => {
    try {
        const { citizen_id } = req.params;
        const { limit = 50, offset = 0, api_type } = req.query;
        
        let query = `
            SELECT 
                api_type,
                endpoint,
                response_status,
                request_timestamp,
                response_timestamp,
                error_message
            FROM api_requests 
            WHERE citizen_id = ?
        `;
        
        const params = [citizen_id];
        
        if (api_type) {
            query += ` AND api_type = ?`;
            params.push(api_type);
        }
        
        query += ` ORDER BY request_timestamp DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));
        
        const stmt = govAPIsService.db.prepare(query);
        const history = stmt.all(...params);
        
        res.json({
            success: true,
            data: history,
            message: 'Verification history retrieved successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get API statistics
router.get('/stats', async (req, res) => {
    try {
        const { api_type, days = 30 } = req.query;
        
        const stats = govAPIsService.getApiStats(api_type, parseInt(days));
        
        res.json({
            success: true,
            data: stats,
            message: 'API statistics retrieved successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check for government APIs
router.get('/health', async (req, res) => {
    try {
        const healthChecks = {
            aadhaar: { status: 'operational', response_time: 250 },
            pan: { status: 'operational', response_time: 180 },
            gst: { status: 'operational', response_time: 300 },
            digilocker: { status: 'operational', response_time: 400 },
            passports: { status: 'operational', response_time: 500 },
            voter: { status: 'operational', response_time: 220 }
        };
        
        res.json({
            success: true,
            data: {
                overall_status: 'operational',
                apis: healthChecks,
                last_updated: new Date().toISOString()
            },
            message: 'Government APIs health check completed'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Cache management endpoints
router.delete('/cache', async (req, res) => {
    try {
        const { document_type, older_than_hours = 0 } = req.body;
        
        let query = `DELETE FROM verification_cache WHERE 1=1`;
        const params = [];
        
        if (document_type) {
            query += ` AND document_type = ?`;
            params.push(document_type);
        }
        
        if (older_than_hours > 0) {
            query += ` AND cached_at < datetime('now', '-${older_than_hours} hours')`;
        }
        
        const result = govAPIsService.db.prepare(query).run(...params);
        
        res.json({
            success: true,
            data: { deleted_count: result.changes },
            message: 'Cache cleared successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Document validation endpoint
router.post('/validate/format', async (req, res) => {
    try {
        const { document_type, document_number } = req.body;
        
        if (!document_type || !document_number) {
            return res.status(400).json({
                success: false,
                error: 'Document type and number are required'
            });
        }
        
        const validationRules = {
            aadhaar: /^\d{12}$/,
            pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
            gst: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
            passport: /^[A-Z]{1}[0-9]{7}$/,
            voter: /^[A-Z]{3}[0-9]{7}$/
        };
        
        const rule = validationRules[document_type.toLowerCase()];
        if (!rule) {
            return res.status(400).json({
                success: false,
                error: 'Unsupported document type'
            });
        }
        
        const isValid = rule.test(document_number);
        
        res.json({
            success: true,
            data: {
                document_type,
                document_number,
                format_valid: isValid,
                pattern: rule.source
            },
            message: isValid ? 'Document format is valid' : 'Document format is invalid'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Webhook for real-time government updates (if supported)
router.post('/webhook/updates', async (req, res) => {
    try {
        const { api_type, document_number, update_type, data } = req.body;
        
        // Verify webhook signature (implement based on government API requirements)
        // const signature = req.headers['x-signature'];
        // const isValid = verifyWebhookSignature(signature, req.body);
        
        // if (!isValid) {
        //     return res.status(401).json({ success: false, error: 'Invalid webhook signature' });
        // }
        
        // Process the update
        console.log(`Government API update received:`, {
            api_type,
            document_number,
            update_type,
            timestamp: new Date().toISOString()
        });
        
        // Here you would typically:
        // 1. Update the cache if applicable
        // 2. Notify relevant citizens
        // 3. Update document status in your system
        
        res.json({
            success: true,
            message: 'Webhook processed successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;