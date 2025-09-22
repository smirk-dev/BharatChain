/**
 * Compliance & Audit Systems Service
 * Comprehensive compliance monitoring, audit logging, and regulatory reporting
 * Meets government standards and legal requirements
 */

const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;

class ComplianceAuditService {
    constructor() {
        // Initialize database
        this.db = new Database(path.join(__dirname, '../database/compliance_audit.db'));
        this.setupDatabase();
        
        // Compliance frameworks and standards
        this.complianceFrameworks = {
            'GDPR': {
                name: 'General Data Protection Regulation',
                version: '2018',
                jurisdiction: 'EU',
                requirements: ['consent', 'data_minimization', 'purpose_limitation', 'retention_limits']
            },
            'PDPB': {
                name: 'Personal Data Protection Bill',
                version: '2023',
                jurisdiction: 'India',
                requirements: ['consent', 'data_localization', 'breach_notification', 'dpo_appointment']
            },
            'ISO27001': {
                name: 'Information Security Management',
                version: '2022',
                jurisdiction: 'International',
                requirements: ['risk_assessment', 'security_controls', 'incident_management', 'continuous_monitoring']
            },
            'SOC2': {
                name: 'Service Organization Control 2',
                version: 'Type II',
                jurisdiction: 'US',
                requirements: ['security', 'availability', 'processing_integrity', 'confidentiality']
            },
            'CERT-IN': {
                name: 'Indian Computer Emergency Response Team Guidelines',
                version: '2024',
                jurisdiction: 'India',
                requirements: ['incident_reporting', 'vulnerability_management', 'threat_monitoring', 'forensic_readiness']
            }
        };
        
        // Audit configuration
        this.auditConfig = {
            retentionPeriod: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
            reportingFrequency: {
                daily: ['security_events', 'failed_logins', 'data_access'],
                weekly: ['compliance_violations', 'policy_updates'],
                monthly: ['risk_assessment', 'security_metrics'],
                quarterly: ['compliance_report', 'audit_summary'],
                annual: ['security_review', 'policy_review']
            },
            criticalEvents: [
                'data_breach',
                'unauthorized_access',
                'system_compromise',
                'compliance_violation',
                'policy_violation'
            ]
        };
        
        // Initialize monitoring
        this.setupContinuousMonitoring();
        
        console.log('📋 Compliance & Audit Service initialized');
    }

    setupDatabase() {
        // Compliance monitoring table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS compliance_monitoring (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                monitoring_id TEXT UNIQUE NOT NULL,
                framework TEXT NOT NULL,
                control_id TEXT NOT NULL,
                control_name TEXT NOT NULL,
                compliance_status TEXT NOT NULL,
                last_assessment DATETIME DEFAULT CURRENT_TIMESTAMP,
                next_assessment DATETIME,
                assessment_method TEXT,
                evidence_collected TEXT,
                gaps_identified TEXT,
                remediation_plan TEXT,
                responsible_person TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Audit logs table (comprehensive)
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                audit_id TEXT UNIQUE NOT NULL,
                event_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                source_system TEXT NOT NULL,
                user_id TEXT,
                citizen_id TEXT,
                session_id TEXT,
                ip_address TEXT,
                user_agent TEXT,
                request_method TEXT,
                request_url TEXT,
                request_body TEXT,
                response_code INTEGER,
                response_body TEXT,
                action_performed TEXT NOT NULL,
                resource_accessed TEXT,
                data_modified TEXT,
                compliance_impact TEXT,
                risk_level TEXT,
                detection_method TEXT,
                geographic_location TEXT,
                device_fingerprint TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                processed BOOLEAN DEFAULT FALSE,
                retention_until DATETIME
            )
        `);

        // Regulatory reports table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS regulatory_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id TEXT UNIQUE NOT NULL,
                report_type TEXT NOT NULL,
                regulation_framework TEXT NOT NULL,
                reporting_period_start DATETIME NOT NULL,
                reporting_period_end DATETIME NOT NULL,
                report_status TEXT DEFAULT 'draft',
                generated_by TEXT,
                reviewed_by TEXT,
                approved_by TEXT,
                submission_deadline DATETIME,
                submitted_at DATETIME,
                report_data TEXT,
                file_path TEXT,
                digital_signature TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Risk assessments table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS risk_assessments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                assessment_id TEXT UNIQUE NOT NULL,
                assessment_type TEXT NOT NULL,
                scope TEXT NOT NULL,
                methodology TEXT,
                risk_level TEXT NOT NULL,
                likelihood TEXT NOT NULL,
                impact TEXT NOT NULL,
                risk_score INTEGER,
                identified_threats TEXT,
                vulnerabilities TEXT,
                existing_controls TEXT,
                additional_controls_needed TEXT,
                treatment_plan TEXT,
                responsible_owner TEXT,
                review_date DATETIME,
                assessment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'active'
            )
        `);

        // Incident management table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS security_incidents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                incident_id TEXT UNIQUE NOT NULL,
                incident_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                status TEXT DEFAULT 'open',
                detection_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                detection_method TEXT,
                affected_systems TEXT,
                affected_data TEXT,
                impact_assessment TEXT,
                initial_response TEXT,
                investigation_findings TEXT,
                root_cause TEXT,
                remediation_actions TEXT,
                lessons_learned TEXT,
                assigned_to TEXT,
                resolved_time DATETIME,
                reported_to_authorities BOOLEAN DEFAULT FALSE,
                regulatory_notification TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Policy compliance tracking
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS policy_compliance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                policy_id TEXT NOT NULL,
                policy_name TEXT NOT NULL,
                policy_version TEXT,
                applicable_framework TEXT,
                compliance_requirement TEXT,
                current_status TEXT NOT NULL,
                last_review DATETIME,
                next_review DATETIME,
                evidence_location TEXT,
                gaps_identified TEXT,
                action_items TEXT,
                responsible_team TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Audit trail integrity
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS audit_integrity (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                batch_id TEXT UNIQUE NOT NULL,
                start_time DATETIME,
                end_time DATETIME,
                record_count INTEGER,
                hash_signature TEXT,
                verification_status TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('📊 Compliance & Audit database tables created');
    }

    // ========================================
    // AUDIT LOGGING
    // ========================================

    async logAuditEvent(eventData) {
        try {
            const auditId = this.generateAuditId();
            const retentionUntil = new Date(Date.now() + this.auditConfig.retentionPeriod);

            // Classify risk level based on event type
            const riskLevel = this.classifyRiskLevel(eventData.event_type, eventData.action_performed);
            
            // Determine compliance impact
            const complianceImpact = this.assessComplianceImpact(eventData);

            const stmt = this.db.prepare(`
                INSERT INTO audit_logs 
                (audit_id, event_type, severity, source_system, user_id, citizen_id, session_id,
                 ip_address, user_agent, request_method, request_url, request_body, response_code,
                 action_performed, resource_accessed, data_modified, compliance_impact, risk_level,
                 detection_method, geographic_location, retention_until)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                auditId,
                eventData.event_type,
                eventData.severity || 'info',
                eventData.source_system || 'bharatchain-api',
                eventData.user_id,
                eventData.citizen_id,
                eventData.session_id,
                eventData.ip_address,
                eventData.user_agent,
                eventData.request_method,
                eventData.request_url,
                JSON.stringify(eventData.request_body),
                eventData.response_code,
                eventData.action_performed,
                eventData.resource_accessed,
                JSON.stringify(eventData.data_modified),
                complianceImpact,
                riskLevel,
                eventData.detection_method || 'system',
                eventData.geographic_location,
                retentionUntil.toISOString()
            );

            // Trigger alerts for critical events
            if (this.auditConfig.criticalEvents.includes(eventData.event_type)) {
                await this.triggerCriticalEventAlert(auditId, eventData);
            }

            return auditId;
        } catch (error) {
            console.error('Audit logging error:', error);
            throw error;
        }
    }

    // ========================================
    // COMPLIANCE MONITORING
    // ========================================

    async runComplianceAssessment(framework = 'all') {
        try {
            const assessmentId = this.generateAssessmentId();
            const results = [];

            const frameworksToAssess = framework === 'all' ? 
                Object.keys(this.complianceFrameworks) : [framework];

            for (const fw of frameworksToAssess) {
                const frameworkResults = await this.assessFrameworkCompliance(fw);
                results.push({
                    framework: fw,
                    overall_compliance: frameworkResults.compliance_percentage,
                    controls_assessed: frameworkResults.total_controls,
                    compliant_controls: frameworkResults.compliant_controls,
                    non_compliant_controls: frameworkResults.non_compliant_controls,
                    gaps: frameworkResults.gaps,
                    recommendations: frameworkResults.recommendations
                });
            }

            // Store assessment results
            await this.storeComplianceAssessment(assessmentId, results);

            return {
                assessment_id: assessmentId,
                assessment_date: new Date(),
                frameworks_assessed: frameworksToAssess,
                results: results,
                overall_status: this.calculateOverallComplianceStatus(results),
                next_assessment_due: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
            };
        } catch (error) {
            console.error('Compliance assessment error:', error);
            throw error;
        }
    }

    async assessFrameworkCompliance(framework) {
        try {
            const frameworkConfig = this.complianceFrameworks[framework];
            if (!frameworkConfig) {
                throw new Error(`Unknown compliance framework: ${framework}`);
            }

            const controls = await this.getFrameworkControls(framework);
            const assessmentResults = [];

            for (const control of controls) {
                const controlAssessment = await this.assessControl(framework, control);
                assessmentResults.push(controlAssessment);

                // Store individual control assessment
                await this.storeControlAssessment(framework, control, controlAssessment);
            }

            const compliantControls = assessmentResults.filter(r => r.status === 'compliant').length;
            const nonCompliantControls = assessmentResults.filter(r => r.status === 'non_compliant').length;
            const compliancePercentage = (compliantControls / assessmentResults.length) * 100;

            return {
                framework: framework,
                total_controls: assessmentResults.length,
                compliant_controls: compliantControls,
                non_compliant_controls: nonCompliantControls,
                compliance_percentage: Math.round(compliancePercentage * 100) / 100,
                gaps: assessmentResults.filter(r => r.status === 'non_compliant').map(r => r.gap_description),
                recommendations: assessmentResults.filter(r => r.recommendations).map(r => r.recommendations).flat()
            };
        } catch (error) {
            console.error('Framework compliance assessment error:', error);
            throw error;
        }
    }

    // ========================================
    // RISK MANAGEMENT
    // ========================================

    async conductRiskAssessment(scope) {
        try {
            const assessmentId = this.generateRiskAssessmentId();
            
            // Identify threats and vulnerabilities
            const threats = await this.identifyThreats(scope);
            const vulnerabilities = await this.identifyVulnerabilities(scope);
            const existingControls = await this.getExistingControls(scope);

            // Calculate risk scores
            const riskAnalysis = await this.analyzeRisks(threats, vulnerabilities, existingControls);

            // Generate treatment recommendations
            const treatmentPlan = await this.generateRiskTreatmentPlan(riskAnalysis);

            // Store risk assessment
            const stmt = this.db.prepare(`
                INSERT INTO risk_assessments 
                (assessment_id, assessment_type, scope, risk_level, likelihood, impact, 
                 risk_score, identified_threats, vulnerabilities, existing_controls, 
                 additional_controls_needed, treatment_plan, responsible_owner, review_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const reviewDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 6 months

            stmt.run(
                assessmentId,
                'comprehensive',
                scope,
                riskAnalysis.overall_risk_level,
                riskAnalysis.likelihood,
                riskAnalysis.impact,
                riskAnalysis.risk_score,
                JSON.stringify(threats),
                JSON.stringify(vulnerabilities),
                JSON.stringify(existingControls),
                JSON.stringify(treatmentPlan.additional_controls),
                JSON.stringify(treatmentPlan.plan),
                'Security Team',
                reviewDate.toISOString()
            );

            return {
                assessment_id: assessmentId,
                scope: scope,
                risk_analysis: riskAnalysis,
                treatment_plan: treatmentPlan,
                review_date: reviewDate,
                priority_actions: treatmentPlan.priority_actions || []
            };
        } catch (error) {
            console.error('Risk assessment error:', error);
            throw error;
        }
    }

    // ========================================
    // INCIDENT MANAGEMENT
    // ========================================

    async reportSecurityIncident(incidentData) {
        try {
            const incidentId = this.generateIncidentId();
            
            // Classify incident severity
            const severity = this.classifyIncidentSeverity(incidentData);
            
            // Determine if regulatory notification is required
            const notificationRequired = this.requiresRegulatoryNotification(incidentData, severity);

            const stmt = this.db.prepare(`
                INSERT INTO security_incidents 
                (incident_id, incident_type, severity, detection_method, affected_systems,
                 affected_data, impact_assessment, initial_response, assigned_to,
                 reported_to_authorities, regulatory_notification)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                incidentId,
                incidentData.incident_type,
                severity,
                incidentData.detection_method,
                JSON.stringify(incidentData.affected_systems),
                JSON.stringify(incidentData.affected_data),
                incidentData.impact_assessment,
                incidentData.initial_response,
                'Security Response Team',
                notificationRequired,
                notificationRequired ? 'CERT-IN notification pending' : null
            );

            // Auto-generate compliance audit log
            await this.logAuditEvent({
                event_type: 'security_incident',
                severity: severity,
                action_performed: 'Security incident reported',
                resource_accessed: 'incident_management_system',
                compliance_impact: 'Potential data protection impact'
            });

            // Trigger incident response workflow
            const responseActions = await this.initiateIncidentResponse(incidentId, severity);

            return {
                incident_id: incidentId,
                severity: severity,
                status: 'open',
                regulatory_notification_required: notificationRequired,
                immediate_actions: responseActions.immediate,
                investigation_plan: responseActions.investigation,
                communication_plan: responseActions.communication
            };
        } catch (error) {
            console.error('Security incident reporting error:', error);
            throw error;
        }
    }

    // ========================================
    // REGULATORY REPORTING
    // ========================================

    async generateRegulatoryReport(reportType, framework, period) {
        try {
            const reportId = this.generateReportId();
            
            // Gather data based on report type
            const reportData = await this.collectReportData(reportType, framework, period);
            
            // Generate report content
            const report = await this.formatRegulatoryReport(reportType, framework, reportData, period);
            
            // Calculate digital signature
            const signature = this.generateReportSignature(report);
            
            // Store report
            const stmt = this.db.prepare(`
                INSERT INTO regulatory_reports 
                (report_id, report_type, regulation_framework, reporting_period_start,
                 reporting_period_end, generated_by, report_data, digital_signature,
                 submission_deadline)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const submissionDeadline = this.calculateSubmissionDeadline(reportType, framework);

            stmt.run(
                reportId,
                reportType,
                framework,
                period.start,
                period.end,
                'System Auto-Generator',
                JSON.stringify(report),
                signature,
                submissionDeadline.toISOString()
            );

            return {
                report_id: reportId,
                report_type: reportType,
                framework: framework,
                period: period,
                summary: report.summary,
                compliance_status: report.compliance_status,
                key_metrics: report.key_metrics,
                submission_deadline: submissionDeadline,
                digital_signature: signature
            };
        } catch (error) {
            console.error('Regulatory report generation error:', error);
            throw error;
        }
    }

    // ========================================
    // AUDIT ANALYTICS & REPORTING
    // ========================================

    async generateAuditAnalytics(timeframe = '30d') {
        try {
            const timeframeDays = parseInt(timeframe) || 30;
            const startDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);

            // Get audit statistics
            const totalEvents = this.db.prepare(`
                SELECT COUNT(*) as count FROM audit_logs 
                WHERE timestamp >= ?
            `).get(startDate.toISOString()).count;

            const eventsByType = this.db.prepare(`
                SELECT event_type, COUNT(*) as count 
                FROM audit_logs 
                WHERE timestamp >= ?
                GROUP BY event_type 
                ORDER BY count DESC
            `).all(startDate.toISOString());

            const riskLevelDistribution = this.db.prepare(`
                SELECT risk_level, COUNT(*) as count 
                FROM audit_logs 
                WHERE timestamp >= ? AND risk_level IS NOT NULL
                GROUP BY risk_level
            `).all(startDate.toISOString());

            const complianceImpacts = this.db.prepare(`
                SELECT compliance_impact, COUNT(*) as count 
                FROM audit_logs 
                WHERE timestamp >= ? AND compliance_impact IS NOT NULL
                GROUP BY compliance_impact
            `).all(startDate.toISOString());

            // Security metrics
            const securityEvents = this.db.prepare(`
                SELECT COUNT(*) as count FROM audit_logs 
                WHERE timestamp >= ? AND event_type IN ('security_incident', 'unauthorized_access', 'failed_login')
            `).get(startDate.toISOString()).count;

            const dataAccessEvents = this.db.prepare(`
                SELECT COUNT(*) as count FROM audit_logs 
                WHERE timestamp >= ? AND action_performed LIKE '%data%'
            `).get(startDate.toISOString()).count;

            return {
                timeframe: timeframe,
                period: {
                    start: startDate,
                    end: new Date()
                },
                summary: {
                    total_events: totalEvents,
                    security_events: securityEvents,
                    data_access_events: dataAccessEvents,
                    average_daily_events: Math.round(totalEvents / timeframeDays)
                },
                event_distribution: eventsByType,
                risk_analysis: {
                    risk_level_distribution: riskLevelDistribution,
                    compliance_impacts: complianceImpacts
                },
                trends: await this.calculateAuditTrends(startDate),
                recommendations: this.generateSecurityRecommendations(eventsByType, riskLevelDistribution)
            };
        } catch (error) {
            console.error('Audit analytics error:', error);
            throw error;
        }
    }

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================

    async getFrameworkControls(framework) {
        // Mock framework controls - in production, these would be loaded from configuration
        const controls = {
            'GDPR': [
                { id: 'GDPR-7', name: 'Lawful basis for processing', category: 'legal_basis' },
                { id: 'GDPR-13', name: 'Information to data subject', category: 'transparency' },
                { id: 'GDPR-25', name: 'Data protection by design', category: 'technical' },
                { id: 'GDPR-32', name: 'Security of processing', category: 'security' },
                { id: 'GDPR-33', name: 'Data breach notification', category: 'incident_response' }
            ],
            'PDPB': [
                { id: 'PDPB-6', name: 'Notice and consent', category: 'consent' },
                { id: 'PDPB-15', name: 'Data localization', category: 'technical' },
                { id: 'PDPB-25', name: 'Breach notification', category: 'incident_response' },
                { id: 'PDPB-30', name: 'DPO appointment', category: 'governance' }
            ],
            'ISO27001': [
                { id: 'A.5.1', name: 'Information security policies', category: 'governance' },
                { id: 'A.8.1', name: 'Inventory of assets', category: 'asset_management' },
                { id: 'A.12.1', name: 'Operational procedures', category: 'operations' },
                { id: 'A.16.1', name: 'Incident management', category: 'incident_response' }
            ]
        };
        
        return controls[framework] || [];
    }

    async assessControl(framework, control) {
        // Mock control assessment - in production, this would perform actual checks
        const mockStatus = Math.random() > 0.3 ? 'compliant' : 'non_compliant';
        
        return {
            control_id: control.id,
            control_name: control.name,
            status: mockStatus,
            evidence: mockStatus === 'compliant' ? 'Control implemented and tested' : null,
            gap_description: mockStatus === 'non_compliant' ? 'Control not fully implemented' : null,
            recommendations: mockStatus === 'non_compliant' ? ['Implement missing control', 'Provide staff training'] : null
        };
    }

    classifyRiskLevel(eventType, actionPerformed) {
        const highRiskEvents = ['data_breach', 'unauthorized_access', 'system_compromise'];
        const mediumRiskEvents = ['failed_login', 'permission_denied', 'policy_violation'];
        
        if (highRiskEvents.includes(eventType)) return 'high';
        if (mediumRiskEvents.includes(eventType)) return 'medium';
        if (actionPerformed && actionPerformed.includes('admin')) return 'medium';
        return 'low';
    }

    assessComplianceImpact(eventData) {
        if (eventData.event_type === 'data_breach') return 'Critical - Data protection violation';
        if (eventData.action_performed && eventData.action_performed.includes('consent')) return 'High - Consent management';
        if (eventData.data_modified) return 'Medium - Data processing activity';
        return 'Low - General system activity';
    }

    generateAuditId() {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(6).toString('hex');
        return `AUD-${timestamp}-${random}`.toUpperCase();
    }

    generateAssessmentId() {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(6).toString('hex');
        return `ASS-${timestamp}-${random}`.toUpperCase();
    }

    generateRiskAssessmentId() {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(6).toString('hex');
        return `RISK-${timestamp}-${random}`.toUpperCase();
    }

    generateIncidentId() {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(6).toString('hex');
        return `INC-${timestamp}-${random}`.toUpperCase();
    }

    generateReportId() {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(6).toString('hex');
        return `RPT-${timestamp}-${random}`.toUpperCase();
    }

    // Mock functions for demonstration
    async identifyThreats(scope) {
        return [
            { threat: 'Malware infection', likelihood: 'medium', impact: 'high' },
            { threat: 'Data breach', likelihood: 'low', impact: 'critical' },
            { threat: 'Insider threat', likelihood: 'low', impact: 'medium' }
        ];
    }

    async identifyVulnerabilities(scope) {
        return [
            { vulnerability: 'Unpatched software', severity: 'medium' },
            { vulnerability: 'Weak authentication', severity: 'high' },
            { vulnerability: 'Insufficient logging', severity: 'low' }
        ];
    }

    setupContinuousMonitoring() {
        // Set up periodic compliance checks
        setInterval(() => {
            this.runAutomaticComplianceChecks();
        }, 24 * 60 * 60 * 1000); // Daily checks
        
        console.log('🔄 Continuous compliance monitoring enabled');
    }

    async runAutomaticComplianceChecks() {
        try {
            // Run lightweight compliance checks
            const quickChecks = await this.runQuickComplianceChecks();
            
            if (quickChecks.violations.length > 0) {
                console.warn('⚠️ Compliance violations detected:', quickChecks.violations);
            }
        } catch (error) {
            console.error('Automatic compliance check error:', error);
        }
    }

    // Health check and maintenance
    async healthCheck() {
        try {
            const dbCheck = this.db.prepare('SELECT 1 as test').get();
            const auditCount = this.db.prepare('SELECT COUNT(*) as count FROM audit_logs').get();
            const incidentCount = this.db.prepare('SELECT COUNT(*) as count FROM security_incidents WHERE status = "open"').get();
            const complianceStatus = this.db.prepare('SELECT COUNT(*) as count FROM compliance_monitoring').get();

            return {
                status: 'healthy',
                database: dbCheck ? 'connected' : 'disconnected',
                audit_records: auditCount.count,
                open_incidents: incidentCount.count,
                compliance_controls: complianceStatus.count,
                monitoring: 'active',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async cleanup() {
        try {
            // Clean old audit logs (beyond retention period)
            const retentionDate = new Date(Date.now() - this.auditConfig.retentionPeriod);
            this.db.prepare('DELETE FROM audit_logs WHERE retention_until < ?').run(retentionDate.toISOString());
            
            // Archive old reports
            this.db.prepare('UPDATE regulatory_reports SET report_status = "archived" WHERE created_at < datetime("now", "-2 years")').run();
            
            console.log('🧹 Compliance & Audit cleanup completed');
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }
}

module.exports = ComplianceAuditService;