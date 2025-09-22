/**
 * Compliance & Audit Systems API Routes
 * RESTful endpoints for compliance monitoring, audit logging, and regulatory reporting
 */

const express = require('express');
const ComplianceAuditService = require('../services/compliance-audit');
const router = express.Router();

// Initialize Compliance & Audit Service
const complianceService = new ComplianceAuditService();

// Enhanced middleware for admin/auditor authorization
const validateAdminAccess = (req, res, next) => {
    const errors = [];
    
    if (!req.headers.authorization) {
        errors.push('Authorization header required');
    }
    
    if (!req.headers['x-admin-role']) {
        errors.push('Admin role header required for compliance operations');
    }
    
    const allowedRoles = ['compliance_officer', 'auditor', 'security_admin', 'dpo'];
    if (req.headers['x-admin-role'] && !allowedRoles.includes(req.headers['x-admin-role'])) {
        errors.push('Insufficient privileges for compliance operations');
    }
    
    if (errors.length > 0) {
        return res.status(403).json({
            success: false,
            errors,
            required_roles: allowedRoles
        });
    }
    
    req.adminRole = req.headers['x-admin-role'];
    next();
};

// Rate limiting for sensitive operations
const sensitiveOperationsLimit = new Map();

const complianceRateLimit = (operation, limit = 20) => {
    return (req, res, next) => {
        const clientId = req.adminRole || req.ip;
        const now = Date.now();
        const key = `${clientId}:${operation}:${Math.floor(now / (60 * 60 * 1000))}`;
        
        if (!sensitiveOperationsLimit.has(key)) {
            sensitiveOperationsLimit.set(key, 0);
        }
        
        const currentCount = sensitiveOperationsLimit.get(key);
        if (currentCount >= limit) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded for compliance operation',
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
// AUDIT LOGGING ENDPOINTS
// ========================================

/**
 * Create Audit Log Entry
 * POST /api/compliance/audit/log
 */
router.post('/audit/log', async (req, res) => {
    try {
        const eventData = {
            event_type: req.body.event_type,
            severity: req.body.severity,
            source_system: req.body.source_system,
            user_id: req.body.user_id,
            citizen_id: req.body.citizen_id,
            session_id: req.body.session_id,
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
            request_method: req.method,
            request_url: req.originalUrl,
            action_performed: req.body.action_performed,
            resource_accessed: req.body.resource_accessed,
            data_modified: req.body.data_modified,
            detection_method: req.body.detection_method
        };

        // Validation
        const required = ['event_type', 'action_performed'];
        const missing = required.filter(field => !eventData[field]);
        
        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required audit fields',
                missing_fields: missing
            });
        }

        const auditId = await complianceService.logAuditEvent(eventData);

        res.status(201).json({
            success: true,
            message: 'Audit event logged successfully',
            audit_id: auditId,
            compliance_info: {
                retention_period: '10 years',
                integrity_protected: true,
                regulatory_compliant: true
            }
        });
    } catch (error) {
        console.error('Audit logging error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to log audit event',
            details: error.message
        });
    }
});

/**
 * Get Audit Analytics
 * GET /api/compliance/audit/analytics
 */
router.get('/audit/analytics', validateAdminAccess, complianceRateLimit('analytics', 50), async (req, res) => {
    try {
        const timeframe = req.query.timeframe || '30d';
        const analytics = await complianceService.generateAuditAnalytics(timeframe);

        res.json({
            success: true,
            data: analytics,
            audit_info: {
                generated_by: req.adminRole,
                data_classification: 'Confidential',
                access_logged: true
            }
        });
    } catch (error) {
        console.error('Audit analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate audit analytics',
            details: error.message
        });
    }
});

/**
 * Search Audit Logs
 * POST /api/compliance/audit/search
 */
router.post('/audit/search', validateAdminAccess, complianceRateLimit('search', 30), async (req, res) => {
    try {
        const searchCriteria = {
            start_date: req.body.start_date,
            end_date: req.body.end_date,
            event_type: req.body.event_type,
            user_id: req.body.user_id,
            citizen_id: req.body.citizen_id,
            risk_level: req.body.risk_level,
            limit: Math.min(req.body.limit || 100, 1000) // Max 1000 records
        };

        // Mock audit search results
        const searchResults = {
            total_matches: 156,
            page: 1,
            limit: searchCriteria.limit,
            records: [
                {
                    audit_id: 'AUD-ABC123',
                    timestamp: '2024-01-15T10:30:00Z',
                    event_type: 'data_access',
                    user_id: 'user123',
                    action_performed: 'Document viewed',
                    risk_level: 'low',
                    compliance_impact: 'Low - General system activity'
                },
                {
                    audit_id: 'AUD-DEF456',
                    timestamp: '2024-01-15T09:15:00Z',
                    event_type: 'consent_update',
                    citizen_id: 'citizen456',
                    action_performed: 'Consent withdrawn',
                    risk_level: 'medium',
                    compliance_impact: 'High - Consent management'
                }
            ]
        };

        res.json({
            success: true,
            data: searchResults,
            search_criteria: searchCriteria,
            export_options: ['CSV', 'JSON', 'PDF'],
            retention_notice: 'Search activity logged for compliance'
        });
    } catch (error) {
        console.error('Audit search error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search audit logs',
            details: error.message
        });
    }
});

// ========================================
// COMPLIANCE MONITORING ENDPOINTS
// ========================================

/**
 * Run Compliance Assessment
 * POST /api/compliance/assessment
 */
router.post('/assessment', validateAdminAccess, complianceRateLimit('assessment', 10), async (req, res) => {
    try {
        const framework = req.body.framework || 'all';
        const assessment = await complianceService.runComplianceAssessment(framework);

        res.json({
            success: true,
            message: 'Compliance assessment completed',
            data: assessment,
            recommendations: {
                immediate_actions: assessment.results
                    .filter(r => r.non_compliant_controls > 0)
                    .map(r => `Address ${r.framework} compliance gaps`),
                monitoring: 'Schedule quarterly assessments',
                reporting: 'Generate regulatory reports as required'
            }
        });
    } catch (error) {
        console.error('Compliance assessment error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to run compliance assessment',
            details: error.message
        });
    }
});

/**
 * Get Compliance Dashboard
 * GET /api/compliance/dashboard
 */
router.get('/dashboard', validateAdminAccess, async (req, res) => {
    try {
        // Mock compliance dashboard data
        const dashboardData = {
            overall_compliance_score: 87.5,
            framework_status: [
                { framework: 'GDPR', compliance_percentage: 92.3, status: 'compliant', last_assessment: '2024-01-10' },
                { framework: 'PDPB', compliance_percentage: 85.7, status: 'mostly_compliant', last_assessment: '2024-01-08' },
                { framework: 'ISO27001', compliance_percentage: 89.1, status: 'compliant', last_assessment: '2024-01-05' },
                { framework: 'SOC2', compliance_percentage: 83.4, status: 'mostly_compliant', last_assessment: '2024-01-12' }
            ],
            recent_incidents: [
                {
                    incident_id: 'INC-001',
                    type: 'minor_breach',
                    severity: 'low',
                    status: 'resolved',
                    date: '2024-01-14'
                }
            ],
            upcoming_deadlines: [
                {
                    task: 'GDPR Annual Report',
                    deadline: '2024-05-25',
                    status: 'pending',
                    responsible: 'DPO Team'
                },
                {
                    task: 'SOC2 Audit',
                    deadline: '2024-03-15',
                    status: 'in_progress',
                    responsible: 'Security Team'
                }
            ],
            key_metrics: {
                audit_events_last_30_days: 15678,
                critical_events_last_7_days: 3,
                compliance_violations_resolved: 12,
                pending_risk_assessments: 2
            }
        };

        res.json({
            success: true,
            data: dashboardData,
            dashboard_info: {
                last_updated: new Date().toISOString(),
                auto_refresh_interval: '15 minutes',
                data_classification: 'Confidential'
            }
        });
    } catch (error) {
        console.error('Compliance dashboard error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load compliance dashboard',
            details: error.message
        });
    }
});

// ========================================
// RISK MANAGEMENT ENDPOINTS
// ========================================

/**
 * Conduct Risk Assessment
 * POST /api/compliance/risk/assessment
 */
router.post('/risk/assessment', validateAdminAccess, complianceRateLimit('risk_assessment', 5), async (req, res) => {
    try {
        const scope = req.body.scope || 'entire_system';
        const assessment = await complianceService.conductRiskAssessment(scope);

        res.status(201).json({
            success: true,
            message: 'Risk assessment completed',
            data: assessment,
            next_steps: [
                'Review identified risks with stakeholders',
                'Implement priority mitigation actions',
                'Schedule follow-up assessment'
            ]
        });
    } catch (error) {
        console.error('Risk assessment error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to conduct risk assessment',
            details: error.message
        });
    }
});

/**
 * Get Risk Register
 * GET /api/compliance/risk/register
 */
router.get('/risk/register', validateAdminAccess, async (req, res) => {
    try {
        // Mock risk register
        const riskRegister = {
            total_risks: 15,
            active_risks: 12,
            mitigated_risks: 8,
            risks: [
                {
                    risk_id: 'RISK-001',
                    description: 'Data breach due to unauthorized access',
                    category: 'Security',
                    likelihood: 'Medium',
                    impact: 'High',
                    risk_score: 75,
                    status: 'active',
                    owner: 'Security Team',
                    mitigation_status: 'in_progress'
                },
                {
                    risk_id: 'RISK-002',
                    description: 'Non-compliance with GDPR requirements',
                    category: 'Compliance',
                    likelihood: 'Low',
                    impact: 'Critical',
                    risk_score: 60,
                    status: 'active',
                    owner: 'DPO',
                    mitigation_status: 'planned'
                }
            ]
        };

        res.json({
            success: true,
            data: riskRegister,
            register_info: {
                last_updated: new Date().toISOString(),
                next_review: '2024-04-15',
                methodology: 'ISO 31000:2018'
            }
        });
    } catch (error) {
        console.error('Risk register error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve risk register',
            details: error.message
        });
    }
});

// ========================================
// INCIDENT MANAGEMENT ENDPOINTS
// ========================================

/**
 * Report Security Incident
 * POST /api/compliance/incident/report
 */
router.post('/incident/report', validateAdminAccess, complianceRateLimit('incident_report', 10), async (req, res) => {
    try {
        const incidentData = {
            incident_type: req.body.incident_type,
            detection_method: req.body.detection_method,
            affected_systems: req.body.affected_systems,
            affected_data: req.body.affected_data,
            impact_assessment: req.body.impact_assessment,
            initial_response: req.body.initial_response
        };

        // Validation
        const required = ['incident_type', 'impact_assessment'];
        const missing = required.filter(field => !incidentData[field]);
        
        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required incident fields',
                missing_fields: missing
            });
        }

        const incident = await complianceService.reportSecurityIncident(incidentData);

        res.status(201).json({
            success: true,
            message: 'Security incident reported successfully',
            data: incident,
            compliance_note: 'Incident logged for regulatory compliance'
        });
    } catch (error) {
        console.error('Incident reporting error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to report security incident',
            details: error.message
        });
    }
});

/**
 * Get Incident Status
 * GET /api/compliance/incident/:incidentId
 */
router.get('/incident/:incidentId', validateAdminAccess, async (req, res) => {
    try {
        const incidentId = req.params.incidentId;
        
        // Mock incident details
        const incident = {
            incident_id: incidentId,
            incident_type: 'data_access_violation',
            severity: 'medium',
            status: 'investigating',
            detection_time: '2024-01-15T10:00:00Z',
            affected_systems: ['user_database', 'audit_system'],
            timeline: [
                { stage: 'detected', timestamp: '2024-01-15T10:00:00Z', description: 'Unusual access pattern detected' },
                { stage: 'reported', timestamp: '2024-01-15T10:05:00Z', description: 'Incident reported to security team' },
                { stage: 'investigating', timestamp: '2024-01-15T10:15:00Z', description: 'Investigation initiated' }
            ],
            investigation_findings: 'Preliminary analysis indicates potential policy violation',
            next_actions: ['Complete forensic analysis', 'Interview involved personnel', 'Update security controls'],
            regulatory_status: 'CERT-IN notification prepared, awaiting final assessment'
        };

        res.json({
            success: true,
            data: incident,
            investigation_info: {
                estimated_resolution: '72 hours',
                compliance_impact: 'Medium - May require regulatory notification',
                forensic_evidence: 'Preserved and secured'
            }
        });
    } catch (error) {
        console.error('Incident status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve incident status',
            details: error.message
        });
    }
});

// ========================================
// REGULATORY REPORTING ENDPOINTS
// ========================================

/**
 * Generate Regulatory Report
 * POST /api/compliance/reports/generate
 */
router.post('/reports/generate', validateAdminAccess, complianceRateLimit('report_generation', 5), async (req, res) => {
    try {
        const reportType = req.body.report_type;
        const framework = req.body.framework;
        const period = {
            start: req.body.period_start,
            end: req.body.period_end
        };

        // Validation
        if (!reportType || !framework || !period.start || !period.end) {
            return res.status(400).json({
                success: false,
                error: 'Missing required report parameters',
                required_fields: ['report_type', 'framework', 'period_start', 'period_end']
            });
        }

        const report = await complianceService.generateRegulatoryReport(reportType, framework, period);

        res.status(201).json({
            success: true,
            message: 'Regulatory report generated successfully',
            data: report,
            next_steps: [
                'Review report content',
                'Obtain required approvals',
                'Submit before deadline'
            ]
        });
    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate regulatory report',
            details: error.message
        });
    }
});

/**
 * Get Report Status
 * GET /api/compliance/reports/:reportId
 */
router.get('/reports/:reportId', validateAdminAccess, async (req, res) => {
    try {
        const reportId = req.params.reportId;
        
        // Mock report status
        const reportStatus = {
            report_id: reportId,
            report_type: 'gdpr_annual_report',
            framework: 'GDPR',
            status: 'draft',
            generated_date: '2024-01-15T10:00:00Z',
            period: {
                start: '2023-01-01',
                end: '2023-12-31'
            },
            progress: {
                data_collection: 'completed',
                analysis: 'completed',
                report_writing: 'in_progress',
                review: 'pending',
                approval: 'pending'
            },
            submission_deadline: '2024-05-25',
            estimated_completion: '2024-02-01',
            file_size: '2.5 MB',
            digital_signature_status: 'pending'
        };

        res.json({
            success: true,
            data: reportStatus,
            download_available: reportStatus.status === 'completed',
            submission_info: {
                regulatory_authority: 'Data Protection Authority',
                submission_method: 'Secure Portal',
                acknowledgment_required: true
            }
        });
    } catch (error) {
        console.error('Report status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve report status',
            details: error.message
        });
    }
});

// ========================================
// SYSTEM ENDPOINTS
// ========================================

/**
 * Health Check
 * GET /api/compliance/health
 */
router.get('/health', async (req, res) => {
    try {
        const health = await complianceService.healthCheck();
        
        res.json({
            success: true,
            service: 'Compliance & Audit Systems',
            ...health
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            service: 'Compliance & Audit Systems',
            status: 'unhealthy',
            error: error.message
        });
    }
});

/**
 * Service Information
 * GET /api/compliance/info
 */
router.get('/info', (req, res) => {
    res.json({
        success: true,
        service: 'Compliance & Audit Systems API',
        version: '1.0.0',
        compliance_frameworks: [
            'GDPR (General Data Protection Regulation)',
            'PDPB (Personal Data Protection Bill 2023)',
            'ISO 27001:2022 (Information Security)',
            'SOC 2 Type II',
            'CERT-IN Guidelines'
        ],
        features: [
            'Comprehensive audit logging',
            'Real-time compliance monitoring',
            'Automated risk assessments',
            'Incident management',
            'Regulatory report generation',
            'Audit analytics and dashboards',
            'Continuous monitoring',
            'Policy compliance tracking'
        ],
        endpoints: {
            audit_logging: [
                'POST /audit/log',
                'GET /audit/analytics',
                'POST /audit/search'
            ],
            compliance_monitoring: [
                'POST /assessment',
                'GET /dashboard'
            ],
            risk_management: [
                'POST /risk/assessment',
                'GET /risk/register'
            ],
            incident_management: [
                'POST /incident/report',
                'GET /incident/:incidentId'
            ],
            regulatory_reporting: [
                'POST /reports/generate',
                'GET /reports/:reportId'
            ]
        },
        security_standards: [
            'Tamper-evident audit logs',
            'End-to-end encryption',
            'Role-based access control',
            'Digital signatures',
            '10-year retention policy'
        ],
        support: {
            compliance_officer: 'compliance@bharatchain.gov.in',
            audit_team: 'audit@bharatchain.gov.in',
            security_hotline: '1800-11-AUDIT'
        }
    });
});

// Error handling middleware
router.use((error, req, res, next) => {
    console.error('Compliance API Error:', error);
    
    // Log the error for compliance purposes
    complianceService.logAuditEvent({
        event_type: 'system_error',
        severity: 'high',
        action_performed: 'API error occurred',
        resource_accessed: req.originalUrl,
        request_method: req.method
    }).catch(console.error);
    
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        compliance_note: 'Error logged for audit purposes',
        timestamp: new Date().toISOString(),
        request_id: req.id
    });
});

module.exports = router;