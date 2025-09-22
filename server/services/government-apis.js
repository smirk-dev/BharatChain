const crypto = require('crypto');
const axios = require('axios');
const Database = require('better-sqlite3');
const path = require('path');

class GovernmentAPIsService {
    constructor() {
        this.dbPath = path.join(__dirname, '../database/government_apis.db');
        this.db = new Database(this.dbPath);
        this.initializeDatabase();
        
        // Government API endpoints (sandbox/test endpoints for development)
        this.apis = {
            aadhaar: {
                baseUrl: process.env.AADHAAR_API_URL || 'https://stage1.uidai.gov.in/auth/1.6',
                clientId: process.env.AADHAAR_CLIENT_ID,
                clientSecret: process.env.AADHAAR_CLIENT_SECRET,
                timeout: 30000
            },
            pan: {
                baseUrl: process.env.PAN_API_URL || 'https://app.karza.in/api/v2',
                apiKey: process.env.PAN_API_KEY,
                timeout: 15000
            },
            gst: {
                baseUrl: process.env.GST_API_URL || 'https://clientbasic.mastersindia.co',
                username: process.env.GST_USERNAME,
                password: process.env.GST_PASSWORD,
                timeout: 20000
            },
            digilocker: {
                baseUrl: process.env.DIGILOCKER_API_URL || 'https://api.digitallocker.gov.in',
                clientId: process.env.DIGILOCKER_CLIENT_ID,
                clientSecret: process.env.DIGILOCKER_CLIENT_SECRET,
                timeout: 25000
            },
            passports: {
                baseUrl: process.env.PASSPORT_API_URL || 'https://passportindia.gov.in/api',
                apiKey: process.env.PASSPORT_API_KEY,
                timeout: 30000
            },
            voter: {
                baseUrl: process.env.VOTER_API_URL || 'https://gateway.eci.gov.in',
                apiKey: process.env.VOTER_API_KEY,
                timeout: 20000
            }
        };
        
        // Rate limiting configurations
        this.rateLimits = {
            aadhaar: { requests: 100, window: 3600000 }, // 100 requests per hour
            pan: { requests: 500, window: 3600000 },      // 500 requests per hour
            gst: { requests: 1000, window: 3600000 },     // 1000 requests per hour
            digilocker: { requests: 200, window: 3600000 }, // 200 requests per hour
            passports: { requests: 50, window: 3600000 },   // 50 requests per hour
            voter: { requests: 300, window: 3600000 }       // 300 requests per hour
        };
    }
    
    initializeDatabase() {
        // API request logs table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS api_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                citizen_id TEXT,
                api_type TEXT NOT NULL,
                endpoint TEXT NOT NULL,
                request_data TEXT,
                response_status INTEGER,
                response_data TEXT,
                error_message TEXT,
                request_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                response_timestamp DATETIME,
                ip_address TEXT,
                user_agent TEXT
            )
        `);
        
        // Verification cache table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS verification_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_type TEXT NOT NULL,
                document_number TEXT NOT NULL,
                verification_result TEXT NOT NULL,
                cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL,
                citizen_id TEXT,
                hash_key TEXT UNIQUE
            )
        `);
        
        // Rate limiting table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS api_rate_limits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                api_type TEXT NOT NULL,
                ip_address TEXT NOT NULL,
                request_count INTEGER DEFAULT 1,
                window_start DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_request DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(api_type, ip_address)
            )
        `);
        
        // Government document mappings
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS document_mappings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                citizen_id TEXT NOT NULL,
                document_type TEXT NOT NULL,
                document_number TEXT NOT NULL,
                government_id TEXT,
                verification_status TEXT DEFAULT 'pending',
                verification_date DATETIME,
                mapped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // API health monitoring
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS api_health (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                api_type TEXT NOT NULL,
                status TEXT NOT NULL,
                response_time INTEGER,
                last_check DATETIME DEFAULT CURRENT_TIMESTAMP,
                error_count INTEGER DEFAULT 0,
                success_count INTEGER DEFAULT 0
            )
        `);
        
        // Create indexes for better performance
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_api_requests_citizen ON api_requests(citizen_id)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_api_requests_type ON api_requests(api_type)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_verification_cache_hash ON verification_cache(hash_key)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_rate_limits_api_ip ON api_rate_limits(api_type, ip_address)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_document_mappings_citizen ON document_mappings(citizen_id)`);
    }
    
    // Aadhaar verification
    async verifyAadhaar(aadhaarNumber, citizenId, otp = null) {
        try {
            const requestId = this.generateRequestId();
            
            // Check cache first
            const cached = this.getFromCache('aadhaar', aadhaarNumber);
            if (cached) {
                return cached;
            }
            
            // Check rate limits
            if (!this.checkRateLimit('aadhaar', '127.0.0.1')) {
                throw new Error('Rate limit exceeded for Aadhaar API');
            }
            
            const requestData = {
                aadhaar_number: aadhaarNumber,
                consent: 'Y',
                shareCode: 1234, // This would be dynamically generated
                timestamp: new Date().toISOString(),
                txn: requestId
            };
            
            // For development, simulate API response
            const simulatedResponse = this.simulateAadhaarResponse(aadhaarNumber);
            
            // In production, this would be the actual API call:
            /*
            const response = await axios.post(`${this.apis.aadhaar.baseUrl}/auth`, {
                uid: aadhaarNumber,
                tid: 'public',
                ac: 'public',
                sa: 'public',
                ver: '1.6',
                txn: requestId,
                bt: 'OTP',
                ...requestData
            }, {
                headers: {
                    'Content-Type': 'application/xml',
                    'Authorization': `Bearer ${this.apis.aadhaar.clientSecret}`
                },
                timeout: this.apis.aadhaar.timeout
            });
            */
            
            // Log the request
            this.logApiRequest('aadhaar', '/auth', requestData, 200, simulatedResponse, citizenId);
            
            // Cache the result
            this.cacheVerification('aadhaar', aadhaarNumber, simulatedResponse, citizenId);
            
            return simulatedResponse;
            
        } catch (error) {
            this.logApiRequest('aadhaar', '/auth', { aadhaar_number: aadhaarNumber }, 500, null, citizenId, error.message);
            throw new Error(`Aadhaar verification failed: ${error.message}`);
        }
    }
    
    // PAN verification
    async verifyPAN(panNumber, citizenId, name = null) {
        try {
            // Check cache first
            const cached = this.getFromCache('pan', panNumber);
            if (cached) {
                return cached;
            }
            
            // Check rate limits
            if (!this.checkRateLimit('pan', '127.0.0.1')) {
                throw new Error('Rate limit exceeded for PAN API');
            }
            
            const requestData = {
                pan: panNumber,
                name: name,
                consent: 'Y',
                timestamp: new Date().toISOString()
            };
            
            // Simulate PAN verification response
            const simulatedResponse = this.simulatePANResponse(panNumber, name);
            
            // In production:
            /*
            const response = await axios.post(`${this.apis.pan.baseUrl}/pan-verification`, requestData, {
                headers: {
                    'X-Karza-Key': this.apis.pan.apiKey,
                    'Content-Type': 'application/json'
                },
                timeout: this.apis.pan.timeout
            });
            */
            
            this.logApiRequest('pan', '/pan-verification', requestData, 200, simulatedResponse, citizenId);
            this.cacheVerification('pan', panNumber, simulatedResponse, citizenId);
            
            return simulatedResponse;
            
        } catch (error) {
            this.logApiRequest('pan', '/pan-verification', { pan: panNumber }, 500, null, citizenId, error.message);
            throw new Error(`PAN verification failed: ${error.message}`);
        }
    }
    
    // GST verification
    async verifyGST(gstNumber, citizenId) {
        try {
            const cached = this.getFromCache('gst', gstNumber);
            if (cached) {
                return cached;
            }
            
            if (!this.checkRateLimit('gst', '127.0.0.1')) {
                throw new Error('Rate limit exceeded for GST API');
            }
            
            const requestData = {
                gstin: gstNumber,
                timestamp: new Date().toISOString()
            };
            
            const simulatedResponse = this.simulateGSTResponse(gstNumber);
            
            this.logApiRequest('gst', '/gstin-verification', requestData, 200, simulatedResponse, citizenId);
            this.cacheVerification('gst', gstNumber, simulatedResponse, citizenId);
            
            return simulatedResponse;
            
        } catch (error) {
            this.logApiRequest('gst', '/gstin-verification', { gstin: gstNumber }, 500, null, citizenId, error.message);
            throw new Error(`GST verification failed: ${error.message}`);
        }
    }
    
    // DigiLocker integration
    async fetchFromDigiLocker(citizenId, documentType, accessToken) {
        try {
            if (!this.checkRateLimit('digilocker', '127.0.0.1')) {
                throw new Error('Rate limit exceeded for DigiLocker API');
            }
            
            const requestData = {
                document_type: documentType,
                access_token: accessToken,
                timestamp: new Date().toISOString()
            };
            
            const simulatedResponse = this.simulateDigiLockerResponse(documentType);
            
            this.logApiRequest('digilocker', '/fetch-document', requestData, 200, simulatedResponse, citizenId);
            
            return simulatedResponse;
            
        } catch (error) {
            this.logApiRequest('digilocker', '/fetch-document', { document_type: documentType }, 500, null, citizenId, error.message);
            throw new Error(`DigiLocker fetch failed: ${error.message}`);
        }
    }
    
    // Passport verification
    async verifyPassport(passportNumber, citizenId, dob = null) {
        try {
            const cached = this.getFromCache('passport', passportNumber);
            if (cached) {
                return cached;
            }
            
            if (!this.checkRateLimit('passports', '127.0.0.1')) {
                throw new Error('Rate limit exceeded for Passport API');
            }
            
            const requestData = {
                passport_number: passportNumber,
                date_of_birth: dob,
                timestamp: new Date().toISOString()
            };
            
            const simulatedResponse = this.simulatePassportResponse(passportNumber, dob);
            
            this.logApiRequest('passports', '/verify-passport', requestData, 200, simulatedResponse, citizenId);
            this.cacheVerification('passport', passportNumber, simulatedResponse, citizenId);
            
            return simulatedResponse;
            
        } catch (error) {
            this.logApiRequest('passports', '/verify-passport', { passport_number: passportNumber }, 500, null, citizenId, error.message);
            throw new Error(`Passport verification failed: ${error.message}`);
        }
    }
    
    // Voter ID verification
    async verifyVoterID(voterNumber, citizenId, name = null) {
        try {
            const cached = this.getFromCache('voter', voterNumber);
            if (cached) {
                return cached;
            }
            
            if (!this.checkRateLimit('voter', '127.0.0.1')) {
                throw new Error('Rate limit exceeded for Voter ID API');
            }
            
            const requestData = {
                voter_id: voterNumber,
                name: name,
                timestamp: new Date().toISOString()
            };
            
            const simulatedResponse = this.simulateVoterResponse(voterNumber, name);
            
            this.logApiRequest('voter', '/verify-voter', requestData, 200, simulatedResponse, citizenId);
            this.cacheVerification('voter', voterNumber, simulatedResponse, citizenId);
            
            return simulatedResponse;
            
        } catch (error) {
            this.logApiRequest('voter', '/verify-voter', { voter_id: voterNumber }, 500, null, citizenId, error.message);
            throw new Error(`Voter ID verification failed: ${error.message}`);
        }
    }
    
    // Bulk verification for multiple documents
    async bulkVerification(citizenId, documents) {
        const results = [];
        const errors = [];
        
        for (const doc of documents) {
            try {
                let result;
                switch (doc.type) {
                    case 'aadhaar':
                        result = await this.verifyAadhaar(doc.number, citizenId);
                        break;
                    case 'pan':
                        result = await this.verifyPAN(doc.number, citizenId, doc.name);
                        break;
                    case 'gst':
                        result = await this.verifyGST(doc.number, citizenId);
                        break;
                    case 'passport':
                        result = await this.verifyPassport(doc.number, citizenId, doc.dob);
                        break;
                    case 'voter':
                        result = await this.verifyVoterID(doc.number, citizenId, doc.name);
                        break;
                    default:
                        throw new Error(`Unsupported document type: ${doc.type}`);
                }
                
                results.push({
                    type: doc.type,
                    number: doc.number,
                    status: 'success',
                    data: result
                });
                
            } catch (error) {
                errors.push({
                    type: doc.type,
                    number: doc.number,
                    status: 'error',
                    error: error.message
                });
            }
        }
        
        return { results, errors };
    }
    
    // Utility functions
    generateRequestId() {
        return crypto.randomBytes(16).toString('hex');
    }
    
    checkRateLimit(apiType, ipAddress) {
        const limit = this.rateLimits[apiType];
        if (!limit) return true;
        
        const now = new Date();
        const windowStart = new Date(now.getTime() - limit.window);
        
        const stmt = this.db.prepare(`
            SELECT request_count, window_start FROM api_rate_limits 
            WHERE api_type = ? AND ip_address = ?
        `);
        const existing = stmt.get(apiType, ipAddress);
        
        if (!existing) {
            this.db.prepare(`
                INSERT INTO api_rate_limits (api_type, ip_address, request_count, window_start)
                VALUES (?, ?, 1, ?)
            `).run(apiType, ipAddress, now.toISOString());
            return true;
        }
        
        const existingWindowStart = new Date(existing.window_start);
        
        if (existingWindowStart < windowStart) {
            // Reset window
            this.db.prepare(`
                UPDATE api_rate_limits 
                SET request_count = 1, window_start = ?, last_request = ?
                WHERE api_type = ? AND ip_address = ?
            `).run(now.toISOString(), now.toISOString(), apiType, ipAddress);
            return true;
        }
        
        if (existing.request_count >= limit.requests) {
            return false;
        }
        
        this.db.prepare(`
            UPDATE api_rate_limits 
            SET request_count = request_count + 1, last_request = ?
            WHERE api_type = ? AND ip_address = ?
        `).run(now.toISOString(), apiType, ipAddress);
        
        return true;
    }
    
    getFromCache(documentType, documentNumber) {
        const hashKey = crypto.createHash('sha256')
            .update(`${documentType}:${documentNumber}`)
            .digest('hex');
        
        const stmt = this.db.prepare(`
            SELECT verification_result FROM verification_cache 
            WHERE hash_key = ? AND expires_at > datetime('now')
        `);
        const cached = stmt.get(hashKey);
        
        if (cached) {
            return JSON.parse(cached.verification_result);
        }
        return null;
    }
    
    cacheVerification(documentType, documentNumber, result, citizenId, ttlHours = 24) {
        const hashKey = crypto.createHash('sha256')
            .update(`${documentType}:${documentNumber}`)
            .digest('hex');
        
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + ttlHours);
        
        this.db.prepare(`
            INSERT OR REPLACE INTO verification_cache 
            (document_type, document_number, verification_result, citizen_id, hash_key, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            documentType,
            documentNumber,
            JSON.stringify(result),
            citizenId,
            hashKey,
            expiresAt.toISOString()
        );
    }
    
    logApiRequest(apiType, endpoint, requestData, status, responseData, citizenId, errorMessage = null) {
        this.db.prepare(`
            INSERT INTO api_requests 
            (citizen_id, api_type, endpoint, request_data, response_status, response_data, error_message, response_timestamp, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            citizenId,
            apiType,
            endpoint,
            JSON.stringify(requestData),
            status,
            responseData ? JSON.stringify(responseData) : null,
            errorMessage,
            new Date().toISOString(),
            '127.0.0.1'
        );
    }
    
    // Simulation functions for development (remove in production)
    simulateAadhaarResponse(aadhaarNumber) {
        const isValid = aadhaarNumber.length === 12 && /^\d+$/.test(aadhaarNumber);
        return {
            status: isValid ? 'success' : 'failed',
            aadhaar_number: aadhaarNumber,
            name: isValid ? 'Sample Name' : null,
            address: isValid ? 'Sample Address, Sample City, Sample State - 123456' : null,
            date_of_birth: isValid ? '1990-01-01' : null,
            gender: isValid ? 'M' : null,
            verification_timestamp: new Date().toISOString(),
            message: isValid ? 'Aadhaar verified successfully' : 'Invalid Aadhaar number'
        };
    }
    
    simulatePANResponse(panNumber, name) {
        const isValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber);
        return {
            status: isValid ? 'success' : 'failed',
            pan_number: panNumber,
            name: isValid ? (name || 'Sample Name') : null,
            name_match: isValid && name ? 'exact' : null,
            verification_timestamp: new Date().toISOString(),
            message: isValid ? 'PAN verified successfully' : 'Invalid PAN number'
        };
    }
    
    simulateGSTResponse(gstNumber) {
        const isValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber);
        return {
            status: isValid ? 'success' : 'failed',
            gstin: gstNumber,
            business_name: isValid ? 'Sample Business Name' : null,
            registration_date: isValid ? '2020-01-01' : null,
            status_code: isValid ? 'Active' : null,
            state_code: isValid ? gstNumber.substring(0, 2) : null,
            verification_timestamp: new Date().toISOString(),
            message: isValid ? 'GST verified successfully' : 'Invalid GST number'
        };
    }
    
    simulateDigiLockerResponse(documentType) {
        return {
            status: 'success',
            document_type: documentType,
            document_url: `https://digilocker.gov.in/document/${documentType}/sample.pdf`,
            document_id: crypto.randomBytes(8).toString('hex'),
            issued_date: '2023-01-01',
            issuer: 'Government of India',
            verification_timestamp: new Date().toISOString()
        };
    }
    
    simulatePassportResponse(passportNumber, dob) {
        const isValid = /^[A-Z]{1}[0-9]{7}$/.test(passportNumber);
        return {
            status: isValid ? 'success' : 'failed',
            passport_number: passportNumber,
            name: isValid ? 'Sample Name' : null,
            date_of_birth: isValid ? (dob || '1990-01-01') : null,
            place_of_birth: isValid ? 'Sample City' : null,
            issue_date: isValid ? '2020-01-01' : null,
            expiry_date: isValid ? '2030-01-01' : null,
            verification_timestamp: new Date().toISOString(),
            message: isValid ? 'Passport verified successfully' : 'Invalid passport number'
        };
    }
    
    simulateVoterResponse(voterNumber, name) {
        const isValid = /^[A-Z]{3}[0-9]{7}$/.test(voterNumber);
        return {
            status: isValid ? 'success' : 'failed',
            voter_id: voterNumber,
            name: isValid ? (name || 'Sample Name') : null,
            constituency: isValid ? 'Sample Constituency' : null,
            polling_station: isValid ? 'Sample Polling Station' : null,
            verification_timestamp: new Date().toISOString(),
            message: isValid ? 'Voter ID verified successfully' : 'Invalid voter ID number'
        };
    }
    
    // Get API statistics
    getApiStats(apiType = null, days = 30) {
        const dateFilter = `datetime('now', '-${days} days')`;
        let query = `
            SELECT 
                api_type,
                COUNT(*) as total_requests,
                SUM(CASE WHEN response_status = 200 THEN 1 ELSE 0 END) as successful_requests,
                SUM(CASE WHEN response_status != 200 THEN 1 ELSE 0 END) as failed_requests,
                AVG(CASE WHEN response_status = 200 THEN 1.0 ELSE 0.0 END) * 100 as success_rate
            FROM api_requests 
            WHERE request_timestamp > ${dateFilter}
        `;
        
        if (apiType) {
            query += ` AND api_type = '${apiType}'`;
        }
        
        query += ` GROUP BY api_type ORDER BY total_requests DESC`;
        
        return this.db.prepare(query).all();
    }
    
    // Cleanup old logs and cache
    cleanup(olderThanDays = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        const cutoffISO = cutoffDate.toISOString();
        
        // Clean old API logs
        const logsDeleted = this.db.prepare(`
            DELETE FROM api_requests WHERE request_timestamp < ?
        `).run(cutoffISO).changes;
        
        // Clean expired cache
        const cacheDeleted = this.db.prepare(`
            DELETE FROM verification_cache WHERE expires_at < datetime('now')
        `).run().changes;
        
        // Clean old rate limit records
        const rateLimitDeleted = this.db.prepare(`
            DELETE FROM api_rate_limits WHERE last_request < ?
        `).run(cutoffISO).changes;
        
        return { logsDeleted, cacheDeleted, rateLimitDeleted };
    }
}

module.exports = GovernmentAPIsService;