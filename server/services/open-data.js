/**
 * Open Government Data Integration Service
 * Provides access to transparency portals, RTI systems, and public information
 */

const axios = require('axios');
const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

class OpenDataService {
    constructor() {
        // Initialize database
        this.db = new Database(path.join(__dirname, '../database/open_data.db'));
        this.setupDatabase();
        
        // Cache configuration
        this.cache = new Map();
        this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
        
        // Rate limiting configuration
        this.rateLimits = new Map();
        this.rateLimit = {
            dataPortal: 100, // requests per hour
            rti: 50,
            budget: 200,
            stats: 300,
            tender: 150
        };
        
        // API endpoints (simulation for development)
        this.apis = {
            dataPortal: process.env.DATA_PORTAL_API || 'https://api.data.gov.in',
            rti: process.env.RTI_API || 'https://rtionline.gov.in/api',
            budget: process.env.BUDGET_API || 'https://unionbudget.gov.in/api',
            stats: process.env.STATS_API || 'https://mospi.gov.in/api',
            tender: process.env.TENDER_API || 'https://eprocure.gov.in/api',
            transparency: process.env.TRANSPARENCY_API || 'https://pgportal.gov.in/api'
        };
        
        console.log('🌐 Open Data Service initialized');
    }

    setupDatabase() {
        // Data portal requests table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS data_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                citizen_id TEXT,
                portal_type TEXT NOT NULL,
                category TEXT,
                dataset_id TEXT,
                query_params TEXT,
                response_data TEXT,
                status TEXT DEFAULT 'success',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // RTI applications tracking
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS rti_applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                application_id TEXT UNIQUE NOT NULL,
                citizen_id TEXT,
                department TEXT,
                subject TEXT,
                description TEXT,
                status TEXT DEFAULT 'submitted',
                fee_amount REAL,
                payment_status TEXT DEFAULT 'pending',
                submission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                response_date DATETIME,
                response_file TEXT,
                appeal_status TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Public data cache
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS data_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cache_key TEXT UNIQUE NOT NULL,
                data_type TEXT,
                content TEXT,
                expires_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Analytics and usage tracking
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS usage_analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                portal_type TEXT,
                category TEXT,
                request_count INTEGER DEFAULT 1,
                date DATE DEFAULT (date('now')),
                UNIQUE(portal_type, category, date) ON CONFLICT REPLACE
            )
        `);

        console.log('📊 Open Data database tables created');
    }

    // Data Portal Integration
    async searchDatasets(params) {
        try {
            const cacheKey = `datasets_${JSON.stringify(params)}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) return cached;

            // Rate limiting check
            if (!this.checkRateLimit('dataPortal')) {
                throw new Error('Rate limit exceeded for data portal');
            }

            // Simulate government data portal API call
            const datasets = await this.simulateDataPortalSearch(params);

            // Cache the results
            this.setCachedData(cacheKey, datasets);

            // Log the request
            this.logDataRequest(params.citizen_id, 'data_portal', 'search', null, params, datasets);

            // Update analytics
            this.updateAnalytics('data_portal', 'search');

            return datasets;
        } catch (error) {
            console.error('Data portal search error:', error);
            throw error;
        }
    }

    async getDatasetDetails(datasetId, citizenId) {
        try {
            const cacheKey = `dataset_${datasetId}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) return cached;

            if (!this.checkRateLimit('dataPortal')) {
                throw new Error('Rate limit exceeded for data portal');
            }

            const dataset = await this.simulateDatasetDetails(datasetId);

            this.setCachedData(cacheKey, dataset);
            this.logDataRequest(citizenId, 'data_portal', 'details', datasetId, { datasetId }, dataset);
            this.updateAnalytics('data_portal', 'details');

            return dataset;
        } catch (error) {
            console.error('Dataset details error:', error);
            throw error;
        }
    }

    // RTI System Integration
    async submitRTIApplication(applicationData) {
        try {
            if (!this.checkRateLimit('rti')) {
                throw new Error('Rate limit exceeded for RTI applications');
            }

            // Generate application ID
            const applicationId = this.generateApplicationId();

            // Calculate fee based on application type
            const fee = this.calculateRTIFee(applicationData);

            // Simulate RTI submission
            const submission = await this.simulateRTISubmission(applicationData, applicationId, fee);

            // Store in database
            const stmt = this.db.prepare(`
                INSERT INTO rti_applications 
                (application_id, citizen_id, department, subject, description, fee_amount, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                applicationId,
                applicationData.citizen_id,
                applicationData.department,
                applicationData.subject,
                applicationData.description,
                fee,
                'submitted'
            );

            this.updateAnalytics('rti', 'application');

            return {
                application_id: applicationId,
                fee_amount: fee,
                payment_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                estimated_response_time: '30 days',
                tracking_url: `${this.apis.rti}/track/${applicationId}`,
                ...submission
            };
        } catch (error) {
            console.error('RTI application error:', error);
            throw error;
        }
    }

    async trackRTIStatus(applicationId, citizenId) {
        try {
            if (!this.checkRateLimit('rti')) {
                throw new Error('Rate limit exceeded for RTI tracking');
            }

            // Get from database
            const stmt = this.db.prepare('SELECT * FROM rti_applications WHERE application_id = ? AND citizen_id = ?');
            const application = stmt.get(applicationId, citizenId);

            if (!application) {
                throw new Error('RTI application not found');
            }

            // Simulate status update
            const status = await this.simulateRTIStatus(applicationId);

            // Update database if status changed
            if (status.status !== application.status) {
                const updateStmt = this.db.prepare(`
                    UPDATE rti_applications 
                    SET status = ?, response_date = ?, response_file = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE application_id = ?
                `);
                updateStmt.run(status.status, status.response_date, status.response_file, applicationId);
            }

            this.updateAnalytics('rti', 'tracking');

            return {
                ...application,
                ...status,
                timeline: status.timeline
            };
        } catch (error) {
            console.error('RTI tracking error:', error);
            throw error;
        }
    }

    // Budget & Financial Data
    async getBudgetData(params) {
        try {
            const cacheKey = `budget_${JSON.stringify(params)}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) return cached;

            if (!this.checkRateLimit('budget')) {
                throw new Error('Rate limit exceeded for budget data');
            }

            const budgetData = await this.simulateBudgetData(params);

            this.setCachedData(cacheKey, budgetData);
            this.logDataRequest(params.citizen_id, 'budget', params.type, null, params, budgetData);
            this.updateAnalytics('budget', params.type);

            return budgetData;
        } catch (error) {
            console.error('Budget data error:', error);
            throw error;
        }
    }

    // Statistics & Census Data
    async getStatisticsData(params) {
        try {
            const cacheKey = `stats_${JSON.stringify(params)}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) return cached;

            if (!this.checkRateLimit('stats')) {
                throw new Error('Rate limit exceeded for statistics data');
            }

            const statsData = await this.simulateStatisticsData(params);

            this.setCachedData(cacheKey, statsData);
            this.logDataRequest(params.citizen_id, 'statistics', params.category, null, params, statsData);
            this.updateAnalytics('statistics', params.category);

            return statsData;
        } catch (error) {
            console.error('Statistics data error:', error);
            throw error;
        }
    }

    // Tender & Procurement Data
    async getTenderData(params) {
        try {
            const cacheKey = `tender_${JSON.stringify(params)}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) return cached;

            if (!this.checkRateLimit('tender')) {
                throw new Error('Rate limit exceeded for tender data');
            }

            const tenderData = await this.simulateTenderData(params);

            this.setCachedData(cacheKey, tenderData);
            this.logDataRequest(params.citizen_id, 'tender', params.type, null, params, tenderData);
            this.updateAnalytics('tender', params.type);

            return tenderData;
        } catch (error) {
            console.error('Tender data error:', error);
            throw error;
        }
    }

    // Transparency & Grievance Analytics
    async getTransparencyMetrics(params) {
        try {
            const cacheKey = `transparency_${JSON.stringify(params)}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) return cached;

            const metrics = await this.simulateTransparencyMetrics(params);

            this.setCachedData(cacheKey, metrics);
            this.logDataRequest(params.citizen_id, 'transparency', 'metrics', null, params, metrics);
            this.updateAnalytics('transparency', 'metrics');

            return metrics;
        } catch (error) {
            console.error('Transparency metrics error:', error);
            throw error;
        }
    }

    // Simulation functions for development
    async simulateDataPortalSearch(params) {
        return {
            total_datasets: 15432,
            page: params.page || 1,
            per_page: params.limit || 20,
            datasets: [
                {
                    id: 'gov-budget-2024',
                    title: 'Union Budget 2024-25',
                    description: 'Complete budget allocation data for fiscal year 2024-25',
                    organization: 'Ministry of Finance',
                    category: 'Finance',
                    format: ['CSV', 'JSON', 'PDF'],
                    last_updated: '2024-02-01',
                    downloads: 12543,
                    tags: ['budget', 'finance', 'allocation'],
                    license: 'Open Government License'
                },
                {
                    id: 'census-2021',
                    title: 'Census 2021 - Demographic Data',
                    description: 'Population demographics and statistics from Census 2021',
                    organization: 'Office of the Registrar General',
                    category: 'Demographics',
                    format: ['CSV', 'XLS'],
                    last_updated: '2023-11-15',
                    downloads: 25867,
                    tags: ['census', 'population', 'demographics'],
                    license: 'Open Government License'
                }
            ]
        };
    }

    async simulateDatasetDetails(datasetId) {
        return {
            id: datasetId,
            title: 'Sample Government Dataset',
            description: 'Detailed description of the dataset',
            metadata: {
                size: '125 MB',
                rows: 150000,
                columns: 25,
                format: ['CSV', 'JSON'],
                encoding: 'UTF-8',
                last_updated: '2024-01-15'
            },
            download_links: {
                csv: `${this.apis.dataPortal}/download/${datasetId}.csv`,
                json: `${this.apis.dataPortal}/download/${datasetId}.json`
            },
            api_endpoint: `${this.apis.dataPortal}/datasets/${datasetId}/data`,
            documentation: `${this.apis.dataPortal}/datasets/${datasetId}/docs`,
            quality_score: 0.85,
            completeness: 0.92
        };
    }

    async simulateRTISubmission(data, applicationId, fee) {
        return {
            status: 'acknowledged',
            acknowledgment_number: `ACK-${applicationId}`,
            receipt_generated: true,
            next_steps: [
                'Pay application fee within 7 days',
                'Department will acknowledge within 5 working days',
                'Response expected within 30 days'
            ]
        };
    }

    async simulateRTIStatus(applicationId) {
        const statuses = ['submitted', 'under_review', 'additional_info_required', 'processing', 'response_ready', 'completed'];
        const currentIndex = Math.floor(Math.random() * statuses.length);
        
        return {
            status: statuses[currentIndex],
            response_date: currentIndex >= 4 ? new Date().toISOString() : null,
            response_file: currentIndex >= 4 ? `rti-response-${applicationId}.pdf` : null,
            timeline: [
                { stage: 'submitted', date: '2024-01-10', completed: true },
                { stage: 'acknowledged', date: '2024-01-12', completed: true },
                { stage: 'under_review', date: '2024-01-15', completed: currentIndex >= 1 },
                { stage: 'processing', date: '2024-01-20', completed: currentIndex >= 3 },
                { stage: 'response_ready', date: currentIndex >= 4 ? '2024-02-10' : null, completed: currentIndex >= 4 }
            ]
        };
    }

    async simulateBudgetData(params) {
        return {
            fiscal_year: params.year || '2024-25',
            type: params.type,
            data: {
                total_budget: 4800000000000, // 48 lakh crores
                allocations: [
                    { ministry: 'Defence', amount: 629000000000, percentage: 13.1 },
                    { ministry: 'Railways', amount: 261000000000, percentage: 5.4 },
                    { ministry: 'Road Transport & Highways', amount: 270000000000, percentage: 5.6 },
                    { ministry: 'Consumer Affairs', amount: 235000000000, percentage: 4.9 }
                ],
                expenditure_categories: {
                    capital: 1200000000000,
                    revenue: 3600000000000
                },
                revenue_sources: {
                    tax_revenue: 2300000000000,
                    non_tax_revenue: 400000000000,
                    borrowings: 2100000000000
                }
            }
        };
    }

    async simulateStatisticsData(params) {
        return {
            category: params.category,
            state: params.state || 'All India',
            data: {
                population: {
                    total: 1380000000,
                    male: 717000000,
                    female: 663000000,
                    growth_rate: 1.2
                },
                literacy: {
                    overall: 77.7,
                    male: 84.7,
                    female: 70.3
                },
                economic: {
                    per_capita_income: 172000,
                    unemployment_rate: 4.2,
                    inflation_rate: 5.1
                }
            },
            source: 'National Statistical Office',
            reference_period: '2023-24'
        };
    }

    async simulateTenderData(params) {
        return {
            total_tenders: 25643,
            active_tenders: 8765,
            tenders: [
                {
                    tender_id: 'TND-2024-001234',
                    title: 'Construction of Rural Roads - Phase III',
                    organization: 'Ministry of Rural Development',
                    estimated_value: 15000000,
                    bidding_deadline: '2024-03-15',
                    category: 'Infrastructure',
                    location: 'Uttar Pradesh',
                    status: 'open'
                },
                {
                    tender_id: 'TND-2024-001235',
                    title: 'Supply of Medical Equipment',
                    organization: 'AIIMS New Delhi',
                    estimated_value: 5000000,
                    bidding_deadline: '2024-02-28',
                    category: 'Healthcare',
                    location: 'Delhi',
                    status: 'open'
                }
            ]
        };
    }

    async simulateTransparencyMetrics(params) {
        return {
            period: params.period || 'last_month',
            metrics: {
                rti_applications: {
                    total: 15234,
                    resolved: 12876,
                    pending: 2358,
                    response_rate: 84.5
                },
                grievances: {
                    total: 8765,
                    resolved: 7234,
                    pending: 1531,
                    satisfaction_score: 3.8
                },
                data_requests: {
                    total: 45678,
                    datasets_downloaded: 123456,
                    popular_categories: ['Budget', 'Census', 'Health', 'Education']
                },
                public_participation: {
                    consultations: 156,
                    responses: 12543,
                    feedback_incorporated: 67.3
                }
            }
        };
    }

    // Utility functions
    generateApplicationId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `RTI-${timestamp}-${random}`.toUpperCase();
    }

    calculateRTIFee(applicationData) {
        // Standard RTI fee structure in India
        const baseFee = 10; // Rs. 10 for general category
        const additionalPageFee = 2; // Rs. 2 per additional page after first 20 pages
        
        // BPL category gets free RTI
        if (applicationData.category === 'BPL') {
            return 0;
        }
        
        return baseFee;
    }

    checkRateLimit(service) {
        const now = Date.now();
        const key = `${service}_${Math.floor(now / (60 * 60 * 1000))}`;
        
        if (!this.rateLimits.has(key)) {
            this.rateLimits.set(key, 0);
        }
        
        const currentCount = this.rateLimits.get(key);
        if (currentCount >= this.rateLimit[service]) {
            return false;
        }
        
        this.rateLimits.set(key, currentCount + 1);
        return true;
    }

    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && cached.expires > Date.now()) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    setCachedData(key, data) {
        this.cache.set(key, {
            data,
            expires: Date.now() + this.cacheTimeout
        });
    }

    logDataRequest(citizenId, portalType, category, datasetId, params, response) {
        const stmt = this.db.prepare(`
            INSERT INTO data_requests (citizen_id, portal_type, category, dataset_id, query_params, response_data)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            citizenId,
            portalType,
            category,
            datasetId,
            JSON.stringify(params),
            JSON.stringify({ summary: 'Response logged', size: JSON.stringify(response).length })
        );
    }

    updateAnalytics(portalType, category) {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO usage_analytics (portal_type, category, request_count, date)
            VALUES (?, ?, COALESCE((SELECT request_count FROM usage_analytics WHERE portal_type = ? AND category = ? AND date = date('now')), 0) + 1, date('now'))
        `);
        
        stmt.run(portalType, category, portalType, category);
    }

    // Analytics and reporting
    getUsageAnalytics(params) {
        const stmt = this.db.prepare(`
            SELECT portal_type, category, SUM(request_count) as total_requests, date
            FROM usage_analytics
            WHERE date >= date('now', '-30 days')
            GROUP BY portal_type, category, date
            ORDER BY date DESC
        `);
        
        return stmt.all();
    }

    getPopularDatasets() {
        const stmt = this.db.prepare(`
            SELECT dataset_id, COUNT(*) as access_count
            FROM data_requests
            WHERE dataset_id IS NOT NULL
            AND created_at >= datetime('now', '-30 days')
            GROUP BY dataset_id
            ORDER BY access_count DESC
            LIMIT 10
        `);
        
        return stmt.all();
    }

    // Health check
    async healthCheck() {
        try {
            // Check database connectivity
            const dbCheck = this.db.prepare('SELECT 1 as test').get();
            
            // Check cache status
            const cacheSize = this.cache.size;
            
            // Check rate limits
            const activeRateLimits = this.rateLimits.size;
            
            return {
                status: 'healthy',
                database: dbCheck ? 'connected' : 'disconnected',
                cache_entries: cacheSize,
                active_rate_limits: activeRateLimits,
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

    // Cleanup old data
    cleanup() {
        try {
            // Clean old cache entries from database
            this.db.prepare('DELETE FROM data_cache WHERE expires_at < datetime("now")').run();
            
            // Clean old request logs (keep last 3 months)
            this.db.prepare('DELETE FROM data_requests WHERE created_at < datetime("now", "-3 months")').run();
            
            // Clean old analytics (keep last 1 year)
            this.db.prepare('DELETE FROM usage_analytics WHERE date < date("now", "-1 year")').run();
            
            console.log('🧹 Open Data Service cleanup completed');
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }
}

module.exports = OpenDataService;