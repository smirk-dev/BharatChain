const crypto = require('crypto');
const axios = require('axios');
const Database = require('better-sqlite3');
const path = require('path');

class GovernmentServicesAPI {
    constructor() {
        this.dbPath = path.join(__dirname, '../database/government_services.db');
        this.db = new Database(this.dbPath);
        this.initializeDatabase();
        
        // Government service endpoints configuration
        this.services = {
            // India Post services
            indiaPost: {
                baseUrl: process.env.INDIA_POST_API_URL || 'https://api.indiapost.gov.in/api',
                apiKey: process.env.INDIA_POST_API_KEY,
                timeout: 30000,
                services: ['tracking', 'pincode', 'postoffice', 'aadhaar']
            },
            
            // Indian Railways
            railways: {
                baseUrl: process.env.RAILWAYS_API_URL || 'https://indianrailapi.com/api/v2',
                apiKey: process.env.RAILWAYS_API_KEY,
                timeout: 25000,
                services: ['trains', 'stations', 'fare', 'availability', 'pnr']
            },
            
            // RTI (Right to Information)
            rti: {
                baseUrl: process.env.RTI_API_URL || 'https://rtionline.gov.in/api',
                apiKey: process.env.RTI_API_KEY,
                timeout: 40000,
                services: ['applications', 'status', 'departments', 'officers']
            },
            
            // EPFO (Employee Provident Fund)
            epfo: {
                baseUrl: process.env.EPFO_API_URL || 'https://www.epfindia.gov.in/api',
                apiKey: process.env.EPFO_API_KEY,
                timeout: 35000,
                services: ['balance', 'claims', 'withdrawal', 'passbook']
            },
            
            // Income Tax Department
            incomeTax: {
                baseUrl: process.env.INCOME_TAX_API_URL || 'https://www.incometaxindiaefiling.gov.in/api',
                apiKey: process.env.INCOME_TAX_API_KEY,
                timeout: 30000,
                services: ['filing', 'refund', 'tds', 'verification']
            },
            
            // ESIC (Employee State Insurance Corporation)
            esic: {
                baseUrl: process.env.ESIC_API_URL || 'https://www.esic.in/api',
                apiKey: process.env.ESIC_API_KEY,
                timeout: 30000,
                services: ['registration', 'benefits', 'claims', 'cards']
            },
            
            // Digital India Portal
            digitalIndia: {
                baseUrl: process.env.DIGITAL_INDIA_API_URL || 'https://digitalindia.gov.in/api',
                apiKey: process.env.DIGITAL_INDIA_API_KEY,
                timeout: 35000,
                services: ['services', 'certificates', 'applications', 'status']
            },
            
            // Common Service Centers (CSC)
            csc: {
                baseUrl: process.env.CSC_API_URL || 'https://csc.gov.in/api',
                apiKey: process.env.CSC_API_KEY,
                timeout: 30000,
                services: ['centers', 'services', 'appointments', 'status']
            }
        };
    }
    
    initializeDatabase() {
        // Service requests tracking
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS service_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                citizen_id TEXT NOT NULL,
                service_type TEXT NOT NULL,
                service_name TEXT NOT NULL,
                request_data TEXT,
                response_data TEXT,
                status TEXT DEFAULT 'pending',
                error_message TEXT,
                request_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                response_timestamp DATETIME,
                external_reference_id TEXT,
                estimated_completion DATETIME,
                actual_completion DATETIME,
                fee_amount DECIMAL(10,2),
                payment_status TEXT DEFAULT 'pending'
            )
        `);
        
        // Service integration cache
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS service_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                service_type TEXT NOT NULL,
                cache_key TEXT NOT NULL,
                cache_data TEXT NOT NULL,
                cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL,
                UNIQUE(service_type, cache_key)
            )
        `);
        
        // Government office/center locations
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS government_offices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                office_type TEXT NOT NULL,
                office_name TEXT NOT NULL,
                address TEXT NOT NULL,
                city TEXT NOT NULL,
                state TEXT NOT NULL,
                pincode TEXT NOT NULL,
                latitude DECIMAL(10,8),
                longitude DECIMAL(11,8),
                contact_phone TEXT,
                contact_email TEXT,
                working_hours TEXT,
                services_offered TEXT,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Service status tracking
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS service_status_updates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                request_id INTEGER NOT NULL,
                status TEXT NOT NULL,
                description TEXT,
                updated_by TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (request_id) REFERENCES service_requests(id)
            )
        `);
        
        // Document requirements for services
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS service_document_requirements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                service_type TEXT NOT NULL,
                service_name TEXT NOT NULL,
                required_documents TEXT NOT NULL,
                optional_documents TEXT,
                processing_time TEXT,
                fee_structure TEXT,
                eligibility_criteria TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // API health monitoring for government services
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS service_health (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                service_type TEXT NOT NULL,
                status TEXT NOT NULL,
                response_time INTEGER,
                last_check DATETIME DEFAULT CURRENT_TIMESTAMP,
                error_count INTEGER DEFAULT 0,
                success_count INTEGER DEFAULT 0,
                uptime_percentage DECIMAL(5,2)
            )
        `);
        
        // Create indexes
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_service_requests_citizen ON service_requests(citizen_id)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_service_requests_type ON service_requests(service_type)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_service_cache_type_key ON service_cache(service_type, cache_key)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_government_offices_location ON government_offices(city, state)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_service_status_request ON service_status_updates(request_id)`);
    }
    
    // India Post services
    async trackPackage(trackingNumber, citizenId) {
        try {
            const cacheKey = `tracking:${trackingNumber}`;
            const cached = this.getFromCache('indiaPost', cacheKey);
            if (cached) return cached;
            
            const requestData = {
                tracking_number: trackingNumber,
                service: 'track'
            };
            
            // Simulate India Post tracking response
            const response = this.simulateTrackingResponse(trackingNumber);
            
            // In production:
            /*
            const response = await axios.get(`${this.services.indiaPost.baseUrl}/track/${trackingNumber}`, {
                headers: {
                    'Authorization': `Bearer ${this.services.indiaPost.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: this.services.indiaPost.timeout
            });
            */
            
            this.logServiceRequest('indiaPost', 'tracking', requestData, response, citizenId);
            this.cacheResponse('indiaPost', cacheKey, response, 30); // Cache for 30 minutes
            
            return response;
            
        } catch (error) {
            throw new Error(`Package tracking failed: ${error.message}`);
        }
    }
    
    async getPincodeInfo(pincode) {
        try {
            const cacheKey = `pincode:${pincode}`;
            const cached = this.getFromCache('indiaPost', cacheKey);
            if (cached) return cached;
            
            const response = this.simulatePincodeResponse(pincode);
            this.cacheResponse('indiaPost', cacheKey, response, 1440); // Cache for 24 hours
            
            return response;
            
        } catch (error) {
            throw new Error(`Pincode lookup failed: ${error.message}`);
        }
    }
    
    // Railways services
    async searchTrains(source, destination, date, citizenId) {
        try {
            const cacheKey = `trains:${source}:${destination}:${date}`;
            const cached = this.getFromCache('railways', cacheKey);
            if (cached) return cached;
            
            const requestData = {
                source: source,
                destination: destination,
                journey_date: date
            };
            
            const response = this.simulateTrainSearchResponse(source, destination, date);
            
            this.logServiceRequest('railways', 'train_search', requestData, response, citizenId);
            this.cacheResponse('railways', cacheKey, response, 360); // Cache for 6 hours
            
            return response;
            
        } catch (error) {
            throw new Error(`Train search failed: ${error.message}`);
        }
    }
    
    async checkPNRStatus(pnrNumber, citizenId) {
        try {
            const requestData = { pnr_number: pnrNumber };
            const response = this.simulatePNRResponse(pnrNumber);
            
            this.logServiceRequest('railways', 'pnr_status', requestData, response, citizenId);
            
            return response;
            
        } catch (error) {
            throw new Error(`PNR status check failed: ${error.message}`);
        }
    }
    
    // RTI services
    async submitRTIApplication(applicationData, citizenId) {
        try {
            const requestData = {
                applicant_name: applicationData.name,
                department: applicationData.department,
                information_sought: applicationData.information,
                address: applicationData.address,
                phone: applicationData.phone,
                email: applicationData.email
            };
            
            const response = this.simulateRTISubmissionResponse(requestData);
            
            const requestId = this.logServiceRequest('rti', 'application_submission', requestData, response, citizenId);
            
            // Create status tracking entry
            this.addStatusUpdate(requestId, 'submitted', 'RTI application submitted successfully');
            
            return response;
            
        } catch (error) {
            throw new Error(`RTI application submission failed: ${error.message}`);
        }
    }
    
    async getRTIStatus(applicationNumber, citizenId) {
        try {
            const response = this.simulateRTIStatusResponse(applicationNumber);
            
            this.logServiceRequest('rti', 'status_check', { application_number: applicationNumber }, response, citizenId);
            
            return response;
            
        } catch (error) {
            throw new Error(`RTI status check failed: ${error.message}`);
        }
    }
    
    // EPFO services
    async getEPFOBalance(uan, citizenId) {
        try {
            const cacheKey = `epfo_balance:${uan}`;
            const cached = this.getFromCache('epfo', cacheKey);
            if (cached) return cached;
            
            const requestData = { uan: uan };
            const response = this.simulateEPFOBalanceResponse(uan);
            
            this.logServiceRequest('epfo', 'balance_inquiry', requestData, response, citizenId);
            this.cacheResponse('epfo', cacheKey, response, 60); // Cache for 1 hour
            
            return response;
            
        } catch (error) {
            throw new Error(`EPFO balance inquiry failed: ${error.message}`);
        }
    }
    
    // Income Tax services
    async getITRStatus(acknowledgmentNumber, citizenId) {
        try {
            const requestData = { acknowledgment_number: acknowledgmentNumber };
            const response = this.simulateITRStatusResponse(acknowledgmentNumber);
            
            this.logServiceRequest('incomeTax', 'itr_status', requestData, response, citizenId);
            
            return response;
            
        } catch (error) {
            throw new Error(`ITR status check failed: ${error.message}`);
        }
    }
    
    // Digital India services
    async searchDigitalServices(category, location, citizenId) {
        try {
            const cacheKey = `digital_services:${category}:${location}`;
            const cached = this.getFromCache('digitalIndia', cacheKey);
            if (cached) return cached;
            
            const requestData = { category: category, location: location };
            const response = this.simulateDigitalServicesResponse(category, location);
            
            this.logServiceRequest('digitalIndia', 'service_search', requestData, response, citizenId);
            this.cacheResponse('digitalIndia', cacheKey, response, 720); // Cache for 12 hours
            
            return response;
            
        } catch (error) {
            throw new Error(`Digital services search failed: ${error.message}`);
        }
    }
    
    // Common Service Center (CSC) services
    async findNearbyCSCs(latitude, longitude, radius = 10) {
        try {
            const cacheKey = `csc_nearby:${latitude}:${longitude}:${radius}`;
            const cached = this.getFromCache('csc', cacheKey);
            if (cached) return cached;
            
            const response = this.simulateNearbyCSCResponse(latitude, longitude, radius);
            this.cacheResponse('csc', cacheKey, response, 480); // Cache for 8 hours
            
            return response;
            
        } catch (error) {
            throw new Error(`CSC search failed: ${error.message}`);
        }
    }
    
    // Utility functions
    logServiceRequest(serviceType, serviceName, requestData, responseData, citizenId, externalRefId = null) {
        const stmt = this.db.prepare(`
            INSERT INTO service_requests 
            (citizen_id, service_type, service_name, request_data, response_data, status, response_timestamp, external_reference_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
            citizenId,
            serviceType,
            serviceName,
            JSON.stringify(requestData),
            JSON.stringify(responseData),
            'completed',
            new Date().toISOString(),
            externalRefId
        );
        
        return result.lastInsertRowid;
    }
    
    addStatusUpdate(requestId, status, description, updatedBy = 'system') {
        this.db.prepare(`
            INSERT INTO service_status_updates (request_id, status, description, updated_by)
            VALUES (?, ?, ?, ?)
        `).run(requestId, status, description, updatedBy);
    }
    
    getFromCache(serviceType, cacheKey) {
        const stmt = this.db.prepare(`
            SELECT cache_data FROM service_cache 
            WHERE service_type = ? AND cache_key = ? AND expires_at > datetime('now')
        `);
        const cached = stmt.get(serviceType, cacheKey);
        
        if (cached) {
            return JSON.parse(cached.cache_data);
        }
        return null;
    }
    
    cacheResponse(serviceType, cacheKey, data, ttlMinutes = 60) {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);
        
        this.db.prepare(`
            INSERT OR REPLACE INTO service_cache 
            (service_type, cache_key, cache_data, expires_at)
            VALUES (?, ?, ?, ?)
        `).run(
            serviceType,
            cacheKey,
            JSON.stringify(data),
            expiresAt.toISOString()
        );
    }
    
    // Simulation functions for development (remove in production)
    simulateTrackingResponse(trackingNumber) {
        return {
            tracking_number: trackingNumber,
            status: 'In Transit',
            current_location: 'Mumbai Central Sorting Office',
            expected_delivery: '2024-01-15',
            tracking_history: [
                { date: '2024-01-10', location: 'Delhi', status: 'Booked' },
                { date: '2024-01-11', location: 'Delhi Central', status: 'Dispatched' },
                { date: '2024-01-13', location: 'Mumbai Central', status: 'Arrived at sorting office' }
            ]
        };
    }
    
    simulatePincodeResponse(pincode) {
        return {
            pincode: pincode,
            post_office: 'Sample Post Office',
            district: 'Sample District',
            state: 'Sample State',
            country: 'India',
            delivery_status: 'Delivery'
        };
    }
    
    simulateTrainSearchResponse(source, destination, date) {
        return {
            source: source,
            destination: destination,
            journey_date: date,
            trains: [
                {
                    train_number: '12345',
                    train_name: 'Sample Express',
                    departure_time: '08:00',
                    arrival_time: '18:00',
                    travel_time: '10h 00m',
                    available_classes: ['SL', '3A', '2A', '1A'],
                    availability: {
                        'SL': 'Available',
                        '3A': 'RAC 15',
                        '2A': 'WL 5',
                        '1A': 'Available'
                    }
                }
            ]
        };
    }
    
    simulatePNRResponse(pnrNumber) {
        return {
            pnr_number: pnrNumber,
            train_number: '12345',
            train_name: 'Sample Express',
            journey_date: '2024-01-15',
            boarding_station: 'NDLS',
            destination_station: 'CSTM',
            chart_status: 'Chart Not Prepared',
            passengers: [
                {
                    passenger_number: 1,
                    booking_status: 'CNF',
                    current_status: 'CNF',
                    coach: 'S1',
                    berth: '45'
                }
            ]
        };
    }
    
    simulateRTISubmissionResponse(requestData) {
        const applicationNumber = 'RTI' + Date.now().toString().slice(-8);
        return {
            application_number: applicationNumber,
            status: 'submitted',
            submission_date: new Date().toISOString().split('T')[0],
            department: requestData.department,
            fee_amount: 10,
            expected_response_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
    }
    
    simulateRTIStatusResponse(applicationNumber) {
        return {
            application_number: applicationNumber,
            status: 'under_process',
            current_stage: 'Information gathering',
            last_updated: new Date().toISOString().split('T')[0],
            response_due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
    }
    
    simulateEPFOBalanceResponse(uan) {
        return {
            uan: uan,
            employee_contribution: 125000.50,
            employer_contribution: 125000.50,
            pension_contribution: 45000.00,
            total_balance: 295001.00,
            last_contribution_date: '2024-01-01',
            service_period: '5 years 3 months'
        };
    }
    
    simulateITRStatusResponse(acknowledgmentNumber) {
        return {
            acknowledgment_number: acknowledgmentNumber,
            processing_status: 'Processed',
            refund_status: 'Issued',
            refund_amount: 15000,
            assessment_year: '2023-24',
            processing_date: '2024-01-10'
        };
    }
    
    simulateDigitalServicesResponse(category, location) {
        return {
            category: category,
            location: location,
            services: [
                {
                    service_name: 'Birth Certificate',
                    department: 'Municipal Corporation',
                    online_available: true,
                    processing_time: '7 days',
                    fees: 50,
                    required_documents: ['Hospital certificate', 'Parent ID proof']
                },
                {
                    service_name: 'Caste Certificate',
                    department: 'District Collectorate',
                    online_available: true,
                    processing_time: '15 days',
                    fees: 25,
                    required_documents: ['School leaving certificate', 'Residence proof']
                }
            ]
        };
    }
    
    simulateNearbyCSCResponse(latitude, longitude, radius) {
        return {
            location: { latitude, longitude },
            radius_km: radius,
            centers: [
                {
                    csc_id: 'CSC001',
                    name: 'Sample CSC Center',
                    address: '123 Main Street, Sample City',
                    distance_km: 2.5,
                    contact_number: '+91-9876543210',
                    working_hours: '9:00 AM - 6:00 PM',
                    services: ['Aadhaar enrollment', 'PAN application', 'Passport application'],
                    vle_name: 'Sample VLE'
                }
            ]
        };
    }
    
    // Get service statistics
    getServiceStats(serviceType = null, days = 30) {
        const dateFilter = `datetime('now', '-${days} days')`;
        let query = `
            SELECT 
                service_type,
                service_name,
                COUNT(*) as total_requests,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_requests,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_requests,
                AVG(CASE WHEN status = 'completed' THEN 1.0 ELSE 0.0 END) * 100 as success_rate
            FROM service_requests 
            WHERE request_timestamp > ${dateFilter}
        `;
        
        if (serviceType) {
            query += ` AND service_type = '${serviceType}'`;
        }
        
        query += ` GROUP BY service_type, service_name ORDER BY total_requests DESC`;
        
        return this.db.prepare(query).all();
    }
    
    // Cleanup old data
    cleanup(olderThanDays = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        const cutoffISO = cutoffDate.toISOString();
        
        // Clean old service requests
        const requestsDeleted = this.db.prepare(`
            DELETE FROM service_requests WHERE request_timestamp < ?
        `).run(cutoffISO).changes;
        
        // Clean expired cache
        const cacheDeleted = this.db.prepare(`
            DELETE FROM service_cache WHERE expires_at < datetime('now')
        `).run().changes;
        
        // Clean old status updates
        const statusDeleted = this.db.prepare(`
            DELETE FROM service_status_updates 
            WHERE request_id IN (
                SELECT id FROM service_requests WHERE request_timestamp < ?
            )
        `).run(cutoffISO).changes;
        
        return { requestsDeleted, cacheDeleted, statusDeleted };
    }
}

module.exports = GovernmentServicesAPI;