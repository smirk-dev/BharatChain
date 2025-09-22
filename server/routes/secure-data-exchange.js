/**
 * Secure Government Data Exchange API Routes
 * RESTful endpoints for secure data exchange, consent management, and privacy compliance
 */

const express = require('express');
const SecureDataExchangeService = require('../services/secure-data-exchange');
const router = express.Router();

// Initialize Secure Data Exchange Service
const secureExchangeService = new SecureDataExchangeService();

// Enhanced middleware for security and validation
const validateSecurityHeaders = (req, res, next) => {
    const errors = [];
    
    if (!req.headers.authorization) {
        errors.push('Authorization header required');
    }
    
    if (!req.headers['x-citizen-id']) {
        errors.push('Citizen ID header required');
    }
    
    if (!req.headers['x-request-signature']) {
        errors.push('Request signature required for secure operations');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors,
            security_note: 'All secure data exchange operations require enhanced authentication'
        });
    }
    
    req.citizenId = req.headers['x-citizen-id'];
    req.requestSignature = req.headers['x-request-signature'];
    next();
};

// Advanced rate limiting for sensitive operations
const sensitiveOperationsLimit = new Map();

const secureRateLimit = (operation, limit = 10) => {
    return (req, res, next) => {
        const clientId = req.citizenId || req.ip;
        const now = Date.now();
        const key = `${clientId}:${operation}:${Math.floor(now / (60 * 60 * 1000))}`;
        
        if (!sensitiveOperationsLimit.has(key)) {
            sensitiveOperationsLimit.set(key, 0);
        }
        
        const currentCount = sensitiveOperationsLimit.get(key);
        if (currentCount >= limit) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded for sensitive operation',
                operation: operation,
                limit: limit,
                resetTime: new Date(Math.ceil(now / (60 * 60 * 1000)) * 60 * 60 * 1000).toISOString()
            });
        }
        
        sensitiveOperationsLimit.set(key, currentCount + 1);
        next();
    };
};

// ========================================
// DATA EXCHANGE ENDPOINTS
// ========================================

/**
 * Request Secure Data Exchange
 * POST /api/secure-exchange/request
 */
router.post('/request', validateSecurityHeaders, secureRateLimit('dataRequest', 50), async (req, res) => {
    try {
        const requestData = {
            citizen_id: req.citizenId,
            government_entity: req.body.government_entity,
            data_type: req.body.data_type,
            purpose: req.body.purpose,
            legal_basis: req.body.legal_basis,
            additional_context: req.body.additional_context
        };

        // Validation
        const required = ['government_entity', 'data_type', 'purpose', 'legal_basis'];
        const missing = required.filter(field => !requestData[field]);
        
        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                missing_fields: missing,
                required_fields: required
            });
        }

        const result = await secureExchangeService.requestDataExchange(requestData);

        res.status(201).json({
            success: true,
            message: 'Secure data exchange request initiated',
            data: result,
            security_info: {
                encryption: 'AES-256-GCM',
                compliance: ['GDPR Article 32', 'PDPB 2023', 'ISO 27001'],
                audit_logged: true
            }
        });
    } catch (error) {
        console.error('Secure data exchange request error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to initiate secure data exchange',
            details: error.message
        });
    }
});

/**
 * Track Data Exchange Request
 * GET /api/secure-exchange/track/:requestId
 */
router.get('/track/:requestId', validateSecurityHeaders, async (req, res) => {
    try {
        const requestId = req.params.requestId;
        
        // Get request details (simplified for demonstration)
        const mockStatus = {
            request_id: requestId,
            status: 'completed',
            progress: 100,
            stages: [
                { stage: 'request_validated', completed: true, timestamp: '2024-01-15T10:00:00Z' },
                { stage: 'consent_verified', completed: true, timestamp: '2024-01-15T10:05:00Z' },
                { stage: 'data_retrieved', completed: true, timestamp: '2024-01-15T10:10:00Z' },
                { stage: 'data_encrypted', completed: true, timestamp: '2024-01-15T10:12:00Z' },
                { stage: 'exchange_completed', completed: true, timestamp: '2024-01-15T10:15:00Z' }
            ],
            security_metrics: {
                encryption_verified: true,
                integrity_check_passed: true,
                audit_trail_complete: true,
                compliance_verified: true
            },
            data_ready: true,
            access_url: `/api/secure-exchange/download/${requestId}`
        };

        res.json({
            success: true,
            data: mockStatus,
            compliance_info: {
                processing_time: '15 minutes',
                security_level: 'Government Grade',
                retention_period: 'As per data type policy'
            }
        });
    } catch (error) {
        console.error('Exchange tracking error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to track data exchange request',
            details: error.message
        });
    }
});

// ========================================
// CONSENT MANAGEMENT ENDPOINTS
// ========================================

/**
 * Record Data Processing Consent
 * POST /api/secure-exchange/consent
 */
router.post('/consent', validateSecurityHeaders, secureRateLimit('consentUpdate', 20), async (req, res) => {
    try {
        const consentData = {
            citizen_id: req.citizenId,
            government_entity: req.body.government_entity,
            data_categories: req.body.data_categories,
            purposes: req.body.purposes,
            legal_basis: req.body.legal_basis,
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        };

        // Validation
        const required = ['government_entity', 'data_categories', 'purposes', 'legal_basis'];
        const missing = required.filter(field => !consentData[field]);
        
        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required consent fields',
                missing_fields: missing
            });
        }

        if (!Array.isArray(consentData.data_categories) || consentData.data_categories.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Data categories must be a non-empty array'
            });
        }

        const result = await secureExchangeService.recordConsent(consentData);

        res.status(201).json({
            success: true,
            message: 'Consent recorded successfully',
            data: result,
            rights_info: {
                withdrawal_process: 'Available at any time via API or portal',
                data_subject_rights: ['Access', 'Rectification', 'Erasure', 'Portability', 'Restriction'],
                contact_dpo: 'dpo@bharatchain.gov.in'
            }
        });
    } catch (error) {
        console.error('Consent recording error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to record consent',
            details: error.message
        });
    }
});

/**
 * Withdraw Consent
 * POST /api/secure-exchange/consent/withdraw
 */
router.post('/consent/withdraw', validateSecurityHeaders, secureRateLimit('consentUpdate', 20), async (req, res) => {
    try {
        const { consent_id, reason } = req.body;
        
        if (!consent_id) {
            return res.status(400).json({
                success: false,
                error: 'Consent ID is required'
            });
        }

        const result = await secureExchangeService.withdrawConsent(req.citizenId, consent_id, reason);

        res.json({
            success: true,
            message: 'Consent withdrawn successfully',
            data: result,
            impact: {
                data_processing_stopped: true,
                existing_data_retained: 'As per legal requirements',
                future_processing_blocked: true
            }
        });
    } catch (error) {
        console.error('Consent withdrawal error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to withdraw consent',
            details: error.message
        });
    }
});

/**
 * Get Consent History
 * GET /api/secure-exchange/consent/history
 */
router.get('/consent/history', validateSecurityHeaders, async (req, res) => {
    try {
        // Mock consent history
        const history = [
            {
                consent_id: 'CONSENT-123456',
                government_entity: 'Ministry of Finance',
                data_categories: ['identity', 'financial'],
                purposes: ['tax_verification', 'subsidy_eligibility'],
                status: 'active',
                granted_at: '2024-01-01T00:00:00Z',
                expires_at: '2024-12-31T23:59:59Z'
            },
            {
                consent_id: 'CONSENT-123457',
                government_entity: 'Department of Health',
                data_categories: ['identity', 'health'],
                purposes: ['vaccination_tracking'],
                status: 'withdrawn',
                granted_at: '2023-06-01T00:00:00Z',
                withdrawn_at: '2024-01-10T10:30:00Z',
                withdrawal_reason: 'No longer required'
            }
        ];

        res.json({
            success: true,
            data: history,
            summary: {
                total_consents: history.length,
                active_consents: history.filter(c => c.status === 'active').length,
                withdrawn_consents: history.filter(c => c.status === 'withdrawn').length
            }
        });
    } catch (error) {
        console.error('Consent history error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve consent history',
            details: error.message
        });
    }
});

// ========================================
// DATA SUBJECT RIGHTS ENDPOINTS
// ========================================

/**
 * Submit Data Subject Rights Request
 * POST /api/secure-exchange/rights/:requestType
 */
router.post('/rights/:requestType', validateSecurityHeaders, secureRateLimit('rightsRequest', 10), async (req, res) => {
    try {
        const requestType = req.params.requestType;
        const validTypes = ['access', 'rectification', 'erasure', 'portability', 'restriction'];
        
        if (!validTypes.includes(requestType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request type',
                valid_types: validTypes
            });
        }

        const requestData = {
            citizen_id: req.citizenId,
            request_type: requestType,
            details: req.body.details,
            verification_documents: req.body.verification_documents
        };

        const result = await secureExchangeService.processRightsRequest(requestData);

        res.status(201).json({
            success: true,
            message: `Data ${requestType} request submitted successfully`,
            data: result,
            process_info: {
                response_time: '30 days maximum',
                verification_required: true,
                appeal_process: 'Available if request is denied'
            }
        });
    } catch (error) {
        console.error('Rights request error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process rights request',
            details: error.message
        });
    }
});

/**
 * Get Data Export (Data Portability)
 * GET /api/secure-exchange/export-data/:requestId
 */
router.get('/export-data/:requestId', validateSecurityHeaders, secureRateLimit('dataExport', 10), async (req, res) => {
    try {
        const requestId = req.params.requestId;
        
        // Mock data export
        const exportData = {
            export_id: requestId,
            citizen_id: req.citizenId,
            export_date: new Date().toISOString(),
            format: 'JSON',
            data: {
                personal_information: {
                    name: 'Citizen Name',
                    citizen_id: req.citizenId,
                    contact: 'contact@example.com'
                },
                government_services: [
                    {
                        service: 'Passport Application',
                        date: '2023-06-15',
                        status: 'Completed'
                    }
                ],
                consent_records: [
                    {
                        entity: 'Ministry of External Affairs',
                        purpose: 'Passport verification',
                        granted: '2023-06-10'
                    }
                ]
            },
            metadata: {
                total_records: 25,
                file_size: '2.5 MB',
                checksum: 'abc123def456'
            }
        };

        res.json({
            success: true,
            message: 'Data export ready',
            data: exportData,
            download_info: {
                format: 'Structured JSON',
                encryption: 'In transit and at rest',
                expiry: '7 days from generation'
            }
        });
    } catch (error) {
        console.error('Data export error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export data',
            details: error.message
        });
    }
});

// ========================================
// COMPLIANCE & AUDIT ENDPOINTS
// ========================================

/**
 * Run Compliance Check
 * POST /api/secure-exchange/compliance/check
 */
router.post('/compliance/check', validateSecurityHeaders, async (req, res) => {
    try {
        const regulationType = req.body.regulation_type || 'GDPR';
        
        const result = await secureExchangeService.runComplianceCheck(regulationType);

        res.json({
            success: true,
            message: 'Compliance check completed',
            data: result,
            recommendations: result.violations_found > 0 ? 
                ['Address identified violations', 'Schedule follow-up check', 'Review policies'] :
                ['Maintain current practices', 'Schedule routine check', 'Continue monitoring']
        });
    } catch (error) {
        console.error('Compliance check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to run compliance check',
            details: error.message
        });
    }
});

/**
 * Get Audit Trail
 * GET /api/secure-exchange/audit/:citizenId
 */
router.get('/audit/:citizenId', validateSecurityHeaders, async (req, res) => {
    try {
        const citizenId = req.params.citizenId;
        
        // Verify citizen can access their own audit trail
        if (citizenId !== req.citizenId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied: Can only access your own audit trail'
            });
        }

        // Mock audit trail
        const auditTrail = [
            {
                operation_id: 'AUDIT-001',
                operation_type: 'data_exchange_request',
                action_performed: 'Exchange request submitted',
                timestamp: '2024-01-15T10:00:00Z',
                legal_basis: 'consent',
                government_entity: 'Ministry of Finance'
            },
            {
                operation_id: 'AUDIT-002',
                operation_type: 'consent_granted',
                action_performed: 'Consent recorded',
                timestamp: '2024-01-15T09:55:00Z',
                legal_basis: 'consent',
                government_entity: 'Ministry of Finance'
            }
        ];

        res.json({
            success: true,
            data: auditTrail,
            audit_info: {
                total_entries: auditTrail.length,
                retention_period: '10 years',
                last_accessed: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Audit trail error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve audit trail',
            details: error.message
        });
    }
});

// ========================================
// SYSTEM ENDPOINTS
// ========================================

/**
 * Health Check
 * GET /api/secure-exchange/health
 */
router.get('/health', async (req, res) => {
    try {
        const health = await secureExchangeService.healthCheck();
        
        res.json({
            success: true,
            service: 'Secure Government Data Exchange',
            ...health
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            service: 'Secure Government Data Exchange',
            status: 'unhealthy',
            error: error.message
        });
    }
});

/**
 * Service Information
 * GET /api/secure-exchange/info
 */
router.get('/info', (req, res) => {
    res.json({
        success: true,
        service: 'Secure Government Data Exchange API',
        version: '1.0.0',
        security_features: [
            'End-to-end encryption (AES-256-GCM)',
            'Digital signatures for data integrity',
            'Comprehensive audit logging',
            'GDPR/PDPB compliance tools',
            'Consent management system',
            'Data subject rights automation',
            'Rate limiting and monitoring',
            'Automated compliance checking'
        ],
        compliance: [
            'GDPR (General Data Protection Regulation)',
            'PDPB 2023 (Personal Data Protection Bill)',
            'ISO 27001 (Information Security)',
            'SOC 2 Type II',
            'Government Security Standards'
        ],
        endpoints: {
            data_exchange: [
                'POST /request',
                'GET /track/:requestId'
            ],
            consent_management: [
                'POST /consent',
                'POST /consent/withdraw',
                'GET /consent/history'
            ],
            data_subject_rights: [
                'POST /rights/:requestType',
                'GET /export-data/:requestId'
            ],
            compliance: [
                'POST /compliance/check',
                'GET /audit/:citizenId'
            ]
        },
        support: {
            dpo_contact: 'dpo@bharatchain.gov.in',
            security_hotline: '1800-11-SECURE',
            documentation: 'https://bharatchain.gov.in/api/secure-exchange/docs'
        }
    });
});

// Error handling middleware
router.use((error, req, res, next) => {
    console.error('Secure Exchange API Error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        security_note: 'This incident has been logged for security review',
        timestamp: new Date().toISOString(),
        request_id: req.id
    });
});

module.exports = router;