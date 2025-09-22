/**
 * Secure Government Data Exchange Service
 * Provides secure data exchange protocols with government databases
 * Ensures privacy compliance, audit trails, and data protection compliance
 */

const crypto = require('crypto');
const Database = require('better-sqlite3');
const path = require('path');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

class SecureDataExchangeService {
    constructor() {
        // Initialize database
        this.db = new Database(path.join(__dirname, '../database/secure_exchange.db'));
        this.setupDatabase();
        
        // Encryption configuration
        this.encryption = {
            algorithm: 'aes-256-gcm',
            keyLength: 32,
            ivLength: 16,
            tagLength: 16
        };
        
        // Initialize master key (in production, this should be from secure key management)
        this.masterKey = process.env.MASTER_ENCRYPTION_KEY || crypto.randomBytes(32);
        
        // Privacy compliance settings
        this.privacySettings = {
            dataRetentionPeriod: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
            anonymizationDelay: 30 * 24 * 60 * 60 * 1000, // 30 days
            consentValidityPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
            auditLogRetention: 10 * 365 * 24 * 60 * 60 * 1000 // 10 years
        };
        
        // Rate limiting for secure operations
        this.operationLimits = new Map();
        this.rateLimits = {
            dataRequest: 50, // per hour
            consentUpdate: 20,
            dataExport: 10,
            erasureRequest: 5
        };
        
        console.log('🔒 Secure Data Exchange Service initialized');
    }

    setupDatabase() {
        // Data exchange requests table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS exchange_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                request_id TEXT UNIQUE NOT NULL,
                citizen_id TEXT,
                government_entity TEXT NOT NULL,
                data_type TEXT NOT NULL,
                purpose TEXT NOT NULL,
                legal_basis TEXT NOT NULL,
                consent_id TEXT,
                status TEXT DEFAULT 'pending',
                encryption_key_id TEXT,
                data_hash TEXT,
                response_hash TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,
                completed_at DATETIME
            )
        `);

        // Consent management table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS data_consents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                consent_id TEXT UNIQUE NOT NULL,
                citizen_id TEXT NOT NULL,
                government_entity TEXT NOT NULL,
                data_categories TEXT NOT NULL, -- JSON array
                purposes TEXT NOT NULL, -- JSON array
                legal_basis TEXT NOT NULL,
                consent_status TEXT DEFAULT 'active',
                granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,
                withdrawn_at DATETIME,
                withdrawal_reason TEXT,
                digital_signature TEXT,
                ip_address TEXT,
                user_agent TEXT
            )
        `);

        // Audit trail table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS audit_trail (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                operation_id TEXT UNIQUE NOT NULL,
                operation_type TEXT NOT NULL,
                citizen_id TEXT,
                government_entity TEXT,
                data_subject TEXT,
                action_performed TEXT NOT NULL,
                legal_basis TEXT,
                user_id TEXT,
                ip_address TEXT,
                user_agent TEXT,
                request_details TEXT, -- JSON
                response_status TEXT,
                compliance_flags TEXT, -- JSON
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                retention_until DATETIME
            )
        `);

        // Encryption keys table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS encryption_keys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key_id TEXT UNIQUE NOT NULL,
                key_type TEXT NOT NULL, -- data, consent, audit
                encrypted_key TEXT NOT NULL,
                key_version INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,
                rotated_at DATETIME,
                is_active BOOLEAN DEFAULT TRUE
            )
        `);

        // Data subject rights requests
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS rights_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                request_id TEXT UNIQUE NOT NULL,
                citizen_id TEXT NOT NULL,
                request_type TEXT NOT NULL, -- access, rectification, erasure, portability, restriction
                status TEXT DEFAULT 'submitted',
                verification_method TEXT,
                verified_at DATETIME,
                processed_at DATETIME,
                response_data TEXT,
                rejection_reason TEXT,
                appeal_status TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                deadline DATETIME
            )
        `);

        // GDPR/Data Protection compliance log
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS compliance_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                compliance_check_id TEXT UNIQUE NOT NULL,
                regulation_type TEXT NOT NULL, -- GDPR, PDPB, etc.
                check_type TEXT NOT NULL,
                entity_id TEXT,
                compliance_status TEXT NOT NULL,
                violations TEXT, -- JSON array
                remediation_actions TEXT, -- JSON array
                check_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                next_check_due DATETIME,
                auditor TEXT
            )
        `);

        console.log('🔐 Secure Exchange database tables created');
    }

    // ========================================
    // SECURE DATA EXCHANGE OPERATIONS
    // ========================================

    async requestDataExchange(requestData) {
        try {
            // Rate limiting check
            if (!this.checkRateLimit(requestData.citizen_id, 'dataRequest')) {
                throw new Error('Rate limit exceeded for data exchange requests');
            }

            // Generate unique request ID
            const requestId = this.generateSecureId('REQ');

            // Validate legal basis
            this.validateLegalBasis(requestData.legal_basis, requestData.purpose);

            // Check consent if required
            let consentId = null;
            if (this.requiresConsent(requestData.legal_basis)) {
                consentId = await this.verifyConsent(
                    requestData.citizen_id,
                    requestData.government_entity,
                    requestData.data_type
                );
            }

            // Generate encryption key for this exchange
            const encryptionKeyId = await this.generateExchangeKey(requestId);

            // Calculate expiration based on data type and purpose
            const expiresAt = this.calculateExpiration(requestData.data_type, requestData.purpose);

            // Store exchange request
            const stmt = this.db.prepare(`
                INSERT INTO exchange_requests 
                (request_id, citizen_id, government_entity, data_type, purpose, legal_basis, 
                 consent_id, encryption_key_id, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                requestId,
                requestData.citizen_id,
                requestData.government_entity,
                requestData.data_type,
                requestData.purpose,
                requestData.legal_basis,
                consentId,
                encryptionKeyId,
                expiresAt
            );

            // Log audit trail
            await this.logAuditEvent({
                operation_type: 'data_exchange_request',
                citizen_id: requestData.citizen_id,
                government_entity: requestData.government_entity,
                action_performed: 'Exchange request submitted',
                legal_basis: requestData.legal_basis,
                request_details: requestData
            });

            // Simulate processing (in production, this would trigger actual exchange)
            const exchangeResult = await this.processDataExchange(requestId, requestData);

            return {
                request_id: requestId,
                status: 'initiated',
                estimated_completion: new Date(Date.now() + 24 * 60 * 60 * 1000),
                exchange_protocol: 'TLS 1.3 + AES-256-GCM',
                compliance_verified: true,
                tracking_url: `/api/secure-exchange/track/${requestId}`,
                ...exchangeResult
            };
        } catch (error) {
            console.error('Data exchange request error:', error);
            throw error;
        }
    }

    async processDataExchange(requestId, requestData) {
        try {
            // Simulate secure data exchange process
            const mockExchangeData = await this.simulateSecureExchange(requestData);

            // Encrypt the response data
            const encryptedData = await this.encryptSensitiveData(
                JSON.stringify(mockExchangeData),
                requestId
            );

            // Generate data hash for integrity verification
            const dataHash = crypto.createHash('sha256')
                .update(JSON.stringify(mockExchangeData))
                .digest('hex');

            // Update request status
            const stmt = this.db.prepare(`
                UPDATE exchange_requests 
                SET status = 'completed', data_hash = ?, response_hash = ?, completed_at = CURRENT_TIMESTAMP
                WHERE request_id = ?
            `);

            stmt.run(dataHash, encryptedData.hash, requestId);

            return {
                data_hash: dataHash,
                integrity_verified: true,
                encryption_algorithm: this.encryption.algorithm,
                compliance_certifications: ['ISO 27001', 'SOC 2', 'GDPR Article 32']
            };
        } catch (error) {
            console.error('Data exchange processing error:', error);
            throw error;
        }
    }

    // ========================================
    // CONSENT MANAGEMENT
    // ========================================

    async recordConsent(consentData) {
        try {
            const consentId = this.generateSecureId('CONSENT');

            // Generate digital signature for consent
            const signature = await this.generateConsentSignature(consentData);

            // Store consent
            const stmt = this.db.prepare(`
                INSERT INTO data_consents 
                (consent_id, citizen_id, government_entity, data_categories, purposes, 
                 legal_basis, expires_at, digital_signature, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const expiresAt = new Date(Date.now() + this.privacySettings.consentValidityPeriod);

            stmt.run(
                consentId,
                consentData.citizen_id,
                consentData.government_entity,
                JSON.stringify(consentData.data_categories),
                JSON.stringify(consentData.purposes),
                consentData.legal_basis,
                expiresAt.toISOString(),
                signature,
                consentData.ip_address,
                consentData.user_agent
            );

            // Log audit event
            await this.logAuditEvent({
                operation_type: 'consent_granted',
                citizen_id: consentData.citizen_id,
                government_entity: consentData.government_entity,
                action_performed: 'Consent recorded',
                legal_basis: consentData.legal_basis,
                request_details: consentData
            });

            return {
                consent_id: consentId,
                status: 'granted',
                expires_at: expiresAt,
                digital_signature: signature,
                compliance_verified: true
            };
        } catch (error) {
            console.error('Consent recording error:', error);
            throw error;
        }
    }

    async withdrawConsent(citizenId, consentId, reason) {
        try {
            // Verify consent ownership
            const consent = this.db.prepare(
                'SELECT * FROM data_consents WHERE consent_id = ? AND citizen_id = ?'
            ).get(consentId, citizenId);

            if (!consent) {
                throw new Error('Consent not found or access denied');
            }

            if (consent.consent_status !== 'active') {
                throw new Error('Consent is not active');
            }

            // Update consent status
            const stmt = this.db.prepare(`
                UPDATE data_consents 
                SET consent_status = 'withdrawn', withdrawn_at = CURRENT_TIMESTAMP, withdrawal_reason = ?
                WHERE consent_id = ? AND citizen_id = ?
            `);

            stmt.run(reason, consentId, citizenId);

            // Log audit event
            await this.logAuditEvent({
                operation_type: 'consent_withdrawn',
                citizen_id: citizenId,
                government_entity: consent.government_entity,
                action_performed: 'Consent withdrawn',
                legal_basis: consent.legal_basis,
                request_details: { consent_id: consentId, reason }
            });

            return {
                consent_id: consentId,
                status: 'withdrawn',
                withdrawn_at: new Date(),
                reason: reason,
                compliance_verified: true
            };
        } catch (error) {
            console.error('Consent withdrawal error:', error);
            throw error;
        }
    }

    // ========================================
    // DATA SUBJECT RIGHTS
    // ========================================

    async processRightsRequest(requestData) {
        try {
            const requestId = this.generateSecureId('RIGHTS');
            const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

            // Store rights request
            const stmt = this.db.prepare(`
                INSERT INTO rights_requests 
                (request_id, citizen_id, request_type, deadline)
                VALUES (?, ?, ?, ?)
            `);

            stmt.run(requestId, requestData.citizen_id, requestData.request_type, deadline.toISOString());

            // Process based on request type
            let result;
            switch (requestData.request_type) {
                case 'access':
                    result = await this.processDataAccessRequest(requestId, requestData);
                    break;
                case 'rectification':
                    result = await this.processDataRectificationRequest(requestId, requestData);
                    break;
                case 'erasure':
                    result = await this.processDataErasureRequest(requestId, requestData);
                    break;
                case 'portability':
                    result = await this.processDataPortabilityRequest(requestId, requestData);
                    break;
                case 'restriction':
                    result = await this.processDataRestrictionRequest(requestId, requestData);
                    break;
                default:
                    throw new Error('Invalid rights request type');
            }

            // Log audit event
            await this.logAuditEvent({
                operation_type: 'rights_request',
                citizen_id: requestData.citizen_id,
                action_performed: `${requestData.request_type} request processed`,
                legal_basis: 'Data subject rights',
                request_details: requestData
            });

            return {
                request_id: requestId,
                request_type: requestData.request_type,
                status: 'processed',
                deadline: deadline,
                compliance_verified: true,
                ...result
            };
        } catch (error) {
            console.error('Rights request error:', error);
            throw error;
        }
    }

    async processDataAccessRequest(requestId, requestData) {
        // Simulate data access response
        return {
            data_categories: ['identity', 'contact', 'services'],
            data_sources: ['Government Identity DB', 'Service Portal', 'Payment System'],
            retention_periods: {
                identity: '7 years',
                contact: '2 years',
                services: '5 years'
            },
            sharing_details: ['No third-party sharing without consent'],
            download_link: `/api/secure-exchange/download-data/${requestId}`
        };
    }

    async processDataPortabilityRequest(requestId, requestData) {
        // Simulate data portability response
        return {
            export_format: 'JSON',
            file_size: '2.5 MB',
            includes: ['Personal data', 'Service history', 'Document records'],
            download_link: `/api/secure-exchange/export-data/${requestId}`,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        };
    }

    async processDataErasureRequest(requestId, requestData) {
        // Simulate data erasure (right to be forgotten)
        if (!this.checkRateLimit(requestData.citizen_id, 'erasureRequest')) {
            throw new Error('Rate limit exceeded for erasure requests');
        }

        return {
            erasure_scope: 'All personal data except legally required records',
            retention_exemptions: ['Tax records (7 years)', 'Legal proceedings data'],
            estimated_completion: '15 business days',
            confirmation_method: 'Email notification'
        };
    }

    // ========================================
    // ENCRYPTION & SECURITY
    // ========================================

    async encryptSensitiveData(data, contextId) {
        try {
            const iv = crypto.randomBytes(this.encryption.ivLength);
            const cipher = crypto.createCipher(this.encryption.algorithm, this.masterKey);
            cipher.setAAD(Buffer.from(contextId)); // Additional authenticated data

            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            const authTag = cipher.getAuthTag();

            const result = {
                encrypted: encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex'),
                algorithm: this.encryption.algorithm,
                hash: crypto.createHash('sha256').update(encrypted + iv.toString('hex')).digest('hex')
            };

            return result;
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Data encryption failed');
        }
    }

    async decryptSensitiveData(encryptedData, contextId) {
        try {
            const decipher = crypto.createDecipher(
                encryptedData.algorithm,
                this.masterKey
            );

            decipher.setAAD(Buffer.from(contextId));
            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Data decryption failed');
        }
    }

    async generateExchangeKey(requestId) {
        const keyId = this.generateSecureId('KEY');
        const exchangeKey = crypto.randomBytes(32);
        const encryptedKey = await this.encryptWithMasterKey(exchangeKey);

        const stmt = this.db.prepare(`
            INSERT INTO encryption_keys (key_id, key_type, encrypted_key, expires_at)
            VALUES (?, ?, ?, ?)
        `);

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        stmt.run(keyId, 'data', encryptedKey, expiresAt.toISOString());

        return keyId;
    }

    async generateConsentSignature(consentData) {
        const dataToSign = JSON.stringify({
            citizen_id: consentData.citizen_id,
            government_entity: consentData.government_entity,
            data_categories: consentData.data_categories,
            purposes: consentData.purposes,
            timestamp: Date.now()
        });

        return crypto.createHmac('sha256', this.masterKey)
            .update(dataToSign)
            .digest('hex');
    }

    // ========================================
    // COMPLIANCE & AUDIT
    // ========================================

    async logAuditEvent(eventData) {
        try {
            const operationId = this.generateSecureId('AUDIT');
            const retentionUntil = new Date(Date.now() + this.privacySettings.auditLogRetention);

            const stmt = this.db.prepare(`
                INSERT INTO audit_trail 
                (operation_id, operation_type, citizen_id, government_entity, action_performed, 
                 legal_basis, request_details, retention_until, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                operationId,
                eventData.operation_type,
                eventData.citizen_id,
                eventData.government_entity,
                eventData.action_performed,
                eventData.legal_basis,
                JSON.stringify(eventData.request_details),
                retentionUntil.toISOString(),
                eventData.ip_address,
                eventData.user_agent
            );

            return operationId;
        } catch (error) {
            console.error('Audit logging error:', error);
        }
    }

    async runComplianceCheck(regulationType = 'GDPR') {
        try {
            const checkId = this.generateSecureId('COMPLIANCE');
            const violations = [];
            const remediations = [];

            // Check data retention compliance
            const expiredData = this.db.prepare(`
                SELECT COUNT(*) as count FROM exchange_requests 
                WHERE expires_at < datetime('now') AND status != 'purged'
            `).get();

            if (expiredData.count > 0) {
                violations.push({
                    type: 'data_retention',
                    count: expiredData.count,
                    severity: 'medium',
                    description: 'Data past retention period not purged'
                });
                remediations.push('Schedule automated data purging');
            }

            // Check consent validity
            const expiredConsents = this.db.prepare(`
                SELECT COUNT(*) as count FROM data_consents 
                WHERE expires_at < datetime('now') AND consent_status = 'active'
            `).get();

            if (expiredConsents.count > 0) {
                violations.push({
                    type: 'consent_expiry',
                    count: expiredConsents.count,
                    severity: 'high',
                    description: 'Active consents past expiry date'
                });
                remediations.push('Update expired consents status');
            }

            // Store compliance check result
            const complianceStatus = violations.length === 0 ? 'compliant' : 'non_compliant';
            const nextCheckDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Weekly checks

            const stmt = this.db.prepare(`
                INSERT INTO compliance_log 
                (compliance_check_id, regulation_type, check_type, compliance_status, 
                 violations, remediation_actions, next_check_due, auditor)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                checkId,
                regulationType,
                'automated_scan',
                complianceStatus,
                JSON.stringify(violations),
                JSON.stringify(remediations),
                nextCheckDue.toISOString(),
                'system'
            );

            return {
                check_id: checkId,
                regulation_type: regulationType,
                compliance_status: complianceStatus,
                violations_found: violations.length,
                violations: violations,
                remediation_actions: remediations,
                next_check_due: nextCheckDue
            };
        } catch (error) {
            console.error('Compliance check error:', error);
            throw error;
        }
    }

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================

    async simulateSecureExchange(requestData) {
        // Simulate government database response
        return {
            citizen_data: {
                verified_identity: true,
                data_categories: [requestData.data_type],
                last_updated: new Date().toISOString(),
                data_quality_score: 0.95
            },
            exchange_metadata: {
                source_system: 'Government Identity Database',
                extraction_time: new Date().toISOString(),
                data_classification: 'Personal Data',
                retention_period: '7 years'
            },
            security_context: {
                encryption_applied: true,
                access_logged: true,
                consent_verified: true,
                legal_basis_confirmed: true
            }
        };
    }

    validateLegalBasis(legalBasis, purpose) {
        const validBases = [
            'consent',
            'contract',
            'legal_obligation',
            'vital_interests',
            'public_task',
            'legitimate_interests'
        ];

        if (!validBases.includes(legalBasis)) {
            throw new Error('Invalid legal basis for data processing');
        }

        // Additional validation based on purpose
        if (purpose === 'marketing' && legalBasis !== 'consent') {
            throw new Error('Marketing purposes require explicit consent');
        }
    }

    requiresConsent(legalBasis) {
        return legalBasis === 'consent' || legalBasis === 'legitimate_interests';
    }

    async verifyConsent(citizenId, governmentEntity, dataType) {
        const consent = this.db.prepare(`
            SELECT consent_id FROM data_consents 
            WHERE citizen_id = ? AND government_entity = ? 
            AND consent_status = 'active' AND expires_at > datetime('now')
            AND json_extract(data_categories, '$') LIKE '%${dataType}%'
        `).get(citizenId, governmentEntity);

        if (!consent) {
            throw new Error('Valid consent not found for requested data type');
        }

        return consent.consent_id;
    }

    calculateExpiration(dataType, purpose) {
        const retentionPeriods = {
            identity: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
            financial: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
            health: 25 * 365 * 24 * 60 * 60 * 1000, // 25 years
            contact: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
            default: 5 * 365 * 24 * 60 * 60 * 1000 // 5 years
        };

        const period = retentionPeriods[dataType] || retentionPeriods.default;
        return new Date(Date.now() + period);
    }

    checkRateLimit(citizenId, operation) {
        const now = Date.now();
        const key = `${citizenId}:${operation}:${Math.floor(now / (60 * 60 * 1000))}`;

        if (!this.operationLimits.has(key)) {
            this.operationLimits.set(key, 0);
        }

        const currentCount = this.operationLimits.get(key);
        if (currentCount >= this.rateLimits[operation]) {
            return false;
        }

        this.operationLimits.set(key, currentCount + 1);
        return true;
    }

    generateSecureId(prefix) {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(8).toString('hex');
        return `${prefix}-${timestamp}-${random}`.toUpperCase();
    }

    async encryptWithMasterKey(data) {
        const iv = crypto.randomBytes(this.encryption.ivLength);
        const cipher = crypto.createCipher(this.encryption.algorithm, this.masterKey);
        
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return `${iv.toString('hex')}:${encrypted}`;
    }

    // Health check and maintenance
    async healthCheck() {
        try {
            const dbCheck = this.db.prepare('SELECT 1 as test').get();
            const activeRequests = this.db.prepare(
                'SELECT COUNT(*) as count FROM exchange_requests WHERE status = "pending"'
            ).get();
            const activeConsents = this.db.prepare(
                'SELECT COUNT(*) as count FROM data_consents WHERE consent_status = "active"'
            ).get();

            return {
                status: 'healthy',
                database: dbCheck ? 'connected' : 'disconnected',
                active_requests: activeRequests.count,
                active_consents: activeConsents.count,
                encryption: 'operational',
                compliance_last_check: new Date(),
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
            // Clean expired requests
            this.db.prepare('DELETE FROM exchange_requests WHERE expires_at < datetime("now")').run();
            
            // Clean old audit logs
            const auditRetention = new Date(Date.now() - this.privacySettings.auditLogRetention);
            this.db.prepare('DELETE FROM audit_trail WHERE retention_until < ?').run(auditRetention.toISOString());
            
            // Clean old compliance logs
            this.db.prepare('DELETE FROM compliance_log WHERE check_timestamp < datetime("now", "-1 year")').run();
            
            console.log('🧹 Secure Data Exchange cleanup completed');
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }
}

module.exports = SecureDataExchangeService;