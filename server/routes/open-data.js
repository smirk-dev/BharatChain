/**
 * Open Government Data API Routes
 * RESTful endpoints for transparency portals, RTI systems, and public information access
 */

const express = require('express');
const OpenDataService = require('../services/open-data');
const router = express.Router();

// Initialize Open Data Service
const openDataService = new OpenDataService();

// Middleware for request validation
const validateRequest = (req, res, next) => {
    const errors = [];
    
    if (!req.headers.authorization) {
        errors.push('Authorization header required');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors
        });
    }
    
    next();
};

// Rate limiting middleware (enhanced)
const rateLimitByEndpoint = {
    '/search-datasets': { window: 60000, max: 100 }, // 100 requests per minute
    '/dataset-details': { window: 60000, max: 150 },
    '/rti': { window: 300000, max: 20 }, // 20 RTI operations per 5 minutes
    '/budget': { window: 60000, max: 200 },
    '/statistics': { window: 60000, max: 300 },
    '/tenders': { window: 60000, max: 150 },
    '/transparency': { window: 60000, max: 100 }
};

const rateLimitStore = new Map();

const rateLimit = (req, res, next) => {
    const endpoint = req.baseUrl + req.route.path;
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    
    const limit = rateLimitByEndpoint[req.route.path] || { window: 60000, max: 100 };
    const key = `${clientId}:${endpoint}`;
    
    if (!rateLimitStore.has(key)) {
        rateLimitStore.set(key, { count: 0, resetTime: now + limit.window });
    }
    
    const clientData = rateLimitStore.get(key);
    
    if (now > clientData.resetTime) {
        clientData.count = 0;
        clientData.resetTime = now + limit.window;
    }
    
    if (clientData.count >= limit.max) {
        return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            resetTime: new Date(clientData.resetTime).toISOString()
        });
    }
    
    clientData.count++;
    next();
};

// ========================================
// DATA PORTAL ENDPOINTS
// ========================================

/**
 * Search Government Datasets
 * GET /api/open-data/search-datasets
 */
router.get('/search-datasets', validateRequest, rateLimit, async (req, res) => {
    try {
        const params = {
            query: req.query.q,
            category: req.query.category,
            organization: req.query.organization,
            format: req.query.format,
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            sort: req.query.sort || 'relevance',
            citizen_id: req.query.citizen_id
        };

        const datasets = await openDataService.searchDatasets(params);

        res.json({
            success: true,
            data: datasets,
            meta: {
                total: datasets.total_datasets,
                page: params.page,
                limit: params.limit,
                filters_applied: {
                    category: params.category,
                    organization: params.organization,
                    format: params.format
                }
            }
        });
    } catch (error) {
        console.error('Dataset search error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search datasets',
            details: error.message
        });
    }
});

/**
 * Get Dataset Details
 * GET /api/open-data/dataset-details/:id
 */
router.get('/dataset-details/:id', validateRequest, rateLimit, async (req, res) => {
    try {
        const datasetId = req.params.id;
        const citizenId = req.query.citizen_id;

        const dataset = await openDataService.getDatasetDetails(datasetId, citizenId);

        res.json({
            success: true,
            data: dataset,
            access_info: {
                download_quota_remaining: 95, // Mock quota
                api_calls_remaining: 1000,
                premium_features: false
            }
        });
    } catch (error) {
        console.error('Dataset details error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dataset details',
            details: error.message
        });
    }
});

// ========================================
// RTI SYSTEM ENDPOINTS
// ========================================

/**
 * Submit RTI Application
 * POST /api/open-data/rti/submit
 */
router.post('/rti/submit', validateRequest, rateLimit, async (req, res) => {
    try {
        const applicationData = {
            citizen_id: req.body.citizen_id,
            department: req.body.department,
            subject: req.body.subject,
            description: req.body.description,
            category: req.body.category || 'general', // general, BPL, disabled
            contact_info: req.body.contact_info,
            preferred_language: req.body.preferred_language || 'english'
        };

        // Validation
        const required = ['citizen_id', 'department', 'subject', 'description'];
        const missing = required.filter(field => !applicationData[field]);
        
        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                missing_fields: missing
            });
        }

        const result = await openDataService.submitRTIApplication(applicationData);

        res.status(201).json({
            success: true,
            message: 'RTI application submitted successfully',
            data: result,
            next_steps: [
                `Pay fee of ₹${result.fee_amount} if applicable`,
                'Track status using application ID',
                'Response expected within 30 days'
            ]
        });
    } catch (error) {
        console.error('RTI submission error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit RTI application',
            details: error.message
        });
    }
});

/**
 * Track RTI Application Status
 * GET /api/open-data/rti/track/:applicationId
 */
router.get('/rti/track/:applicationId', validateRequest, rateLimit, async (req, res) => {
    try {
        const applicationId = req.params.applicationId;
        const citizenId = req.query.citizen_id;

        const status = await openDataService.trackRTIStatus(applicationId, citizenId);

        res.json({
            success: true,
            data: status,
            help: {
                contact_number: '1800-11-6448',
                email: 'helpdesk.cic@nic.in',
                grievance_portal: 'https://pgportal.gov.in'
            }
        });
    } catch (error) {
        console.error('RTI tracking error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to track RTI application',
            details: error.message
        });
    }
});

/**
 * Get RTI Statistics
 * GET /api/open-data/rti/statistics
 */
router.get('/rti/statistics', validateRequest, rateLimit, async (req, res) => {
    try {
        const params = {
            period: req.query.period || 'last_month',
            department: req.query.department,
            state: req.query.state
        };

        // Mock RTI statistics
        const stats = {
            period: params.period,
            total_applications: 125643,
            resolved: 98765,
            pending: 26878,
            response_rate: 78.6,
            average_response_time: 23.5, // days
            department_wise: [
                { department: 'Home Ministry', applications: 15234, response_rate: 82.1 },
                { department: 'Education', applications: 12876, response_rate: 79.3 },
                { department: 'Health', applications: 11543, response_rate: 85.7 }
            ],
            trending_topics: [
                'Government Recruitment',
                'Land Records',
                'Tax Information',
                'Pension Status'
            ]
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('RTI statistics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch RTI statistics',
            details: error.message
        });
    }
});

// ========================================
// BUDGET & FINANCIAL DATA ENDPOINTS
// ========================================

/**
 * Get Budget Data
 * GET /api/open-data/budget
 */
router.get('/budget', validateRequest, rateLimit, async (req, res) => {
    try {
        const params = {
            year: req.query.year,
            type: req.query.type || 'union', // union, state, municipal
            ministry: req.query.ministry,
            scheme: req.query.scheme,
            citizen_id: req.query.citizen_id
        };

        const budgetData = await openDataService.getBudgetData(params);

        res.json({
            success: true,
            data: budgetData,
            analysis: {
                total_allocation: budgetData.data.total_budget,
                top_allocations: budgetData.data.allocations.slice(0, 3),
                growth_from_previous: '+8.5%' // Mock data
            }
        });
    } catch (error) {
        console.error('Budget data error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch budget data',
            details: error.message
        });
    }
});

// ========================================
// STATISTICS & CENSUS ENDPOINTS
// ========================================

/**
 * Get Statistics Data
 * GET /api/open-data/statistics
 */
router.get('/statistics', validateRequest, rateLimit, async (req, res) => {
    try {
        const params = {
            category: req.query.category || 'demographic',
            state: req.query.state,
            district: req.query.district,
            year: req.query.year,
            citizen_id: req.query.citizen_id
        };

        const statsData = await openDataService.getStatisticsData(params);

        res.json({
            success: true,
            data: statsData,
            visualization: {
                charts_available: ['bar', 'pie', 'line', 'map'],
                export_formats: ['PDF', 'Excel', 'CSV'],
                comparative_analysis: true
            }
        });
    } catch (error) {
        console.error('Statistics data error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics data',
            details: error.message
        });
    }
});

// ========================================
// TENDER & PROCUREMENT ENDPOINTS
// ========================================

/**
 * Get Tender Data
 * GET /api/open-data/tenders
 */
router.get('/tenders', validateRequest, rateLimit, async (req, res) => {
    try {
        const params = {
            type: req.query.type || 'all', // all, open, closed, awarded
            category: req.query.category,
            organization: req.query.organization,
            min_value: req.query.min_value,
            max_value: req.query.max_value,
            location: req.query.location,
            citizen_id: req.query.citizen_id
        };

        const tenderData = await openDataService.getTenderData(params);

        res.json({
            success: true,
            data: tenderData,
            insights: {
                total_value: '₹1,25,00,00,000',
                active_opportunities: tenderData.active_tenders,
                average_bidding_period: '21 days',
                success_rate: '67.3%'
            }
        });
    } catch (error) {
        console.error('Tender data error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch tender data',
            details: error.message
        });
    }
});

// ========================================
// TRANSPARENCY & ANALYTICS ENDPOINTS
// ========================================

/**
 * Get Transparency Metrics
 * GET /api/open-data/transparency
 */
router.get('/transparency', validateRequest, rateLimit, async (req, res) => {
    try {
        const params = {
            period: req.query.period || 'last_month',
            department: req.query.department,
            metric_type: req.query.metric_type,
            citizen_id: req.query.citizen_id
        };

        const metrics = await openDataService.getTransparencyMetrics(params);

        res.json({
            success: true,
            data: metrics,
            transparency_score: 76.5,
            improvement_areas: [
                'RTI response time',
                'Grievance resolution',
                'Data freshness'
            ]
        });
    } catch (error) {
        console.error('Transparency metrics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch transparency metrics',
            details: error.message
        });
    }
});

// ========================================
// ANALYTICS & REPORTING ENDPOINTS
// ========================================

/**
 * Get Usage Analytics
 * GET /api/open-data/analytics/usage
 */
router.get('/analytics/usage', validateRequest, async (req, res) => {
    try {
        const analytics = openDataService.getUsageAnalytics(req.query);

        res.json({
            success: true,
            data: analytics,
            summary: {
                total_requests: analytics.reduce((sum, item) => sum + item.total_requests, 0),
                most_popular_portal: analytics[0]?.portal_type || 'N/A',
                peak_usage_day: 'Monday'
            }
        });
    } catch (error) {
        console.error('Usage analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch usage analytics',
            details: error.message
        });
    }
});

/**
 * Get Popular Datasets
 * GET /api/open-data/analytics/popular-datasets
 */
router.get('/analytics/popular-datasets', validateRequest, async (req, res) => {
    try {
        const popular = openDataService.getPopularDatasets();

        res.json({
            success: true,
            data: popular,
            period: 'Last 30 days'
        });
    } catch (error) {
        console.error('Popular datasets error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch popular datasets',
            details: error.message
        });
    }
});

// ========================================
// SYSTEM ENDPOINTS
// ========================================

/**
 * Health Check
 * GET /api/open-data/health
 */
router.get('/health', async (req, res) => {
    try {
        const health = await openDataService.healthCheck();
        
        res.json({
            success: true,
            service: 'Open Government Data Integration',
            ...health
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            service: 'Open Government Data Integration',
            status: 'unhealthy',
            error: error.message
        });
    }
});

/**
 * Service Information
 * GET /api/open-data/info
 */
router.get('/info', (req, res) => {
    res.json({
        success: true,
        service: 'Open Government Data Integration API',
        version: '1.0.0',
        features: [
            'Government Dataset Search',
            'RTI Application Management',
            'Budget & Financial Data Access',
            'Statistics & Census Data',
            'Tender & Procurement Information',
            'Transparency Metrics',
            'Usage Analytics'
        ],
        endpoints: {
            data_portal: [
                'GET /search-datasets',
                'GET /dataset-details/:id'
            ],
            rti: [
                'POST /rti/submit',
                'GET /rti/track/:applicationId',
                'GET /rti/statistics'
            ],
            budget: [
                'GET /budget'
            ],
            statistics: [
                'GET /statistics'
            ],
            tenders: [
                'GET /tenders'
            ],
            transparency: [
                'GET /transparency'
            ],
            analytics: [
                'GET /analytics/usage',
                'GET /analytics/popular-datasets'
            ]
        },
        documentation: 'https://bharatchain.gov.in/api/open-data/docs',
        support: {
            email: 'opendata-support@bharatchain.gov.in',
            phone: '1800-11-DATA'
        }
    });
});

// Error handling middleware
router.use((error, req, res, next) => {
    console.error('Open Data API Error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
        request_id: req.id
    });
});

module.exports = router;