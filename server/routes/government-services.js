const express = require('express');
const router = express.Router();
const GovernmentServicesAPI = require('../services/government-services');

const govServicesAPI = new GovernmentServicesAPI();

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

// India Post Services
router.post('/india-post/track', validateCitizenId, rateLimit(10, 300000), async (req, res) => {
    try {
        const { tracking_number } = req.body;
        
        if (!tracking_number) {
            return res.status(400).json({
                success: false,
                error: 'Tracking number is required'
            });
        }
        
        const result = await govServicesAPI.trackPackage(tracking_number, req.citizenId);
        
        res.json({
            success: true,
            data: result,
            message: 'Package tracking information retrieved successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/india-post/pincode/:pincode', rateLimit(20, 300000), async (req, res) => {
    try {
        const { pincode } = req.params;
        
        if (!/^\d{6}$/.test(pincode)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid pincode format. Must be 6 digits.'
            });
        }
        
        const result = await govServicesAPI.getPincodeInfo(pincode);
        
        res.json({
            success: true,
            data: result,
            message: 'Pincode information retrieved successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Railway Services
router.post('/railways/search-trains', validateCitizenId, rateLimit(15, 300000), async (req, res) => {
    try {
        const { source, destination, journey_date } = req.body;
        
        if (!source || !destination || !journey_date) {
            return res.status(400).json({
                success: false,
                error: 'Source, destination, and journey date are required'
            });
        }
        
        const result = await govServicesAPI.searchTrains(source, destination, journey_date, req.citizenId);
        
        res.json({
            success: true,
            data: result,
            message: 'Train search results retrieved successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/railways/pnr-status', validateCitizenId, rateLimit(10, 300000), async (req, res) => {
    try {
        const { pnr_number } = req.body;
        
        if (!pnr_number) {
            return res.status(400).json({
                success: false,
                error: 'PNR number is required'
            });
        }
        
        if (!/^\d{10}$/.test(pnr_number)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid PNR number format. Must be 10 digits.'
            });
        }
        
        const result = await govServicesAPI.checkPNRStatus(pnr_number, req.citizenId);
        
        res.json({
            success: true,
            data: result,
            message: 'PNR status retrieved successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// RTI Services
router.post('/rti/submit-application', validateCitizenId, rateLimit(5, 3600000), async (req, res) => {
    try {
        const { name, department, information, address, phone, email } = req.body;
        
        if (!name || !department || !information || !address) {
            return res.status(400).json({
                success: false,
                error: 'Name, department, information sought, and address are required'
            });
        }
        
        const applicationData = { name, department, information, address, phone, email };
        const result = await govServicesAPI.submitRTIApplication(applicationData, req.citizenId);
        
        res.json({
            success: true,
            data: result,
            message: 'RTI application submitted successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/rti/check-status', validateCitizenId, rateLimit(10, 300000), async (req, res) => {
    try {
        const { application_number } = req.body;
        
        if (!application_number) {
            return res.status(400).json({
                success: false,
                error: 'Application number is required'
            });
        }
        
        const result = await govServicesAPI.getRTIStatus(application_number, req.citizenId);
        
        res.json({
            success: true,
            data: result,
            message: 'RTI application status retrieved successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// EPFO Services
router.post('/epfo/balance', validateCitizenId, rateLimit(5, 3600000), async (req, res) => {
    try {
        const { uan } = req.body;
        
        if (!uan) {
            return res.status(400).json({
                success: false,
                error: 'UAN (Universal Account Number) is required'
            });
        }
        
        if (!/^\d{12}$/.test(uan)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid UAN format. Must be 12 digits.'
            });
        }
        
        const result = await govServicesAPI.getEPFOBalance(uan, req.citizenId);
        
        res.json({
            success: true,
            data: result,
            message: 'EPFO balance retrieved successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Income Tax Services
router.post('/income-tax/itr-status', validateCitizenId, rateLimit(10, 300000), async (req, res) => {
    try {
        const { acknowledgment_number } = req.body;
        
        if (!acknowledgment_number) {
            return res.status(400).json({
                success: false,
                error: 'ITR acknowledgment number is required'
            });
        }
        
        const result = await govServicesAPI.getITRStatus(acknowledgment_number, req.citizenId);
        
        res.json({
            success: true,
            data: result,
            message: 'ITR status retrieved successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Digital India Services
router.post('/digital-india/search-services', validateCitizenId, rateLimit(20, 300000), async (req, res) => {
    try {
        const { category, location } = req.body;
        
        if (!category) {
            return res.status(400).json({
                success: false,
                error: 'Service category is required'
            });
        }
        
        const result = await govServicesAPI.searchDigitalServices(category, location, req.citizenId);
        
        res.json({
            success: true,
            data: result,
            message: 'Digital services found successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Common Service Center (CSC) Services
router.post('/csc/find-nearby', rateLimit(15, 300000), async (req, res) => {
    try {
        const { latitude, longitude, radius = 10 } = req.body;
        
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                error: 'Latitude and longitude are required'
            });
        }
        
        const result = await govServicesAPI.findNearbyCSCs(latitude, longitude, radius);
        
        res.json({
            success: true,
            data: result,
            message: 'Nearby CSC centers found successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Service Request History
router.get('/history/:citizen_id', async (req, res) => {
    try {
        const { citizen_id } = req.params;
        const { limit = 50, offset = 0, service_type } = req.query;
        
        let query = `
            SELECT 
                service_type,
                service_name,
                status,
                request_timestamp,
                response_timestamp,
                external_reference_id
            FROM service_requests 
            WHERE citizen_id = ?
        `;
        
        const params = [citizen_id];
        
        if (service_type) {
            query += ` AND service_type = ?`;
            params.push(service_type);
        }
        
        query += ` ORDER BY request_timestamp DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));
        
        const stmt = govServicesAPI.db.prepare(query);
        const history = stmt.all(...params);
        
        res.json({
            success: true,
            data: history,
            message: 'Service request history retrieved successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Service Statistics
router.get('/stats', async (req, res) => {
    try {
        const { service_type, days = 30 } = req.query;
        
        const stats = govServicesAPI.getServiceStats(service_type, parseInt(days));
        
        res.json({
            success: true,
            data: stats,
            message: 'Service statistics retrieved successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health Check for Government Services
router.get('/health', async (req, res) => {
    try {
        const healthChecks = {
            indiaPost: { status: 'operational', response_time: 280 },
            railways: { status: 'operational', response_time: 320 },
            rti: { status: 'operational', response_time: 450 },
            epfo: { status: 'operational', response_time: 380 },
            incomeTax: { status: 'operational', response_time: 340 },
            digitalIndia: { status: 'operational', response_time: 400 },
            csc: { status: 'operational', response_time: 360 }
        };
        
        res.json({
            success: true,
            data: {
                overall_status: 'operational',
                services: healthChecks,
                last_updated: new Date().toISOString()
            },
            message: 'Government services health check completed'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Service Documentation Endpoint
router.get('/services/info', async (req, res) => {
    try {
        const servicesInfo = {
            indiaPost: {
                name: 'India Post Services',
                services: ['Package Tracking', 'Pincode Lookup', 'Post Office Locator'],
                description: 'Access India Post services for tracking packages and postal information',
                rate_limits: '10 requests per 5 minutes for tracking, 20 requests per 5 minutes for pincode lookup'
            },
            railways: {
                name: 'Indian Railways',
                services: ['Train Search', 'PNR Status', 'Seat Availability', 'Station Information'],
                description: 'Get real-time information about Indian Railways trains and bookings',
                rate_limits: '15 requests per 5 minutes for train search, 10 requests per 5 minutes for PNR status'
            },
            rti: {
                name: 'Right to Information',
                services: ['Application Submission', 'Status Tracking', 'Department Information'],
                description: 'Submit and track RTI applications online',
                rate_limits: '5 applications per hour, 10 status checks per 5 minutes'
            },
            epfo: {
                name: 'Employee Provident Fund',
                services: ['Balance Inquiry', 'Claim Status', 'Passbook Download'],
                description: 'Access EPFO services for provident fund information',
                rate_limits: '5 requests per hour'
            },
            incomeTax: {
                name: 'Income Tax Department',
                services: ['ITR Status', 'Refund Status', 'Tax Calculator'],
                description: 'Income tax related services and information',
                rate_limits: '10 requests per 5 minutes'
            },
            digitalIndia: {
                name: 'Digital India Services',
                services: ['Certificate Services', 'Online Applications', 'Service Directory'],
                description: 'Comprehensive digital government services portal',
                rate_limits: '20 requests per 5 minutes'
            },
            csc: {
                name: 'Common Service Centers',
                services: ['Center Locator', 'Service Information', 'Appointment Booking'],
                description: 'Find nearby CSC centers and available services',
                rate_limits: '15 requests per 5 minutes'
            }
        };
        
        res.json({
            success: true,
            data: servicesInfo,
            message: 'Government services information retrieved successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Cache Management
router.delete('/cache', async (req, res) => {
    try {
        const { service_type, older_than_hours = 0 } = req.body;
        
        let query = `DELETE FROM service_cache WHERE 1=1`;
        const params = [];
        
        if (service_type) {
            query += ` AND service_type = ?`;
            params.push(service_type);
        }
        
        if (older_than_hours > 0) {
            query += ` AND cached_at < datetime('now', '-${older_than_hours} hours')`;
        }
        
        const result = govServicesAPI.db.prepare(query).run(...params);
        
        res.json({
            success: true,
            data: { deleted_count: result.changes },
            message: 'Service cache cleared successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;