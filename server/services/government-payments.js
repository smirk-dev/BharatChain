const crypto = require('crypto');
const axios = require('axios');
const Database = require('better-sqlite3');
const path = require('path');

class GovernmentPaymentService {
    constructor() {
        this.dbPath = path.join(__dirname, '../database/government_payments.db');
        this.db = new Database(this.dbPath);
        this.initializeDatabase();
        
        // Payment gateway configurations
        this.paymentGateways = {
            // Unified Payment Interface (UPI)
            upi: {
                baseUrl: process.env.UPI_API_URL || 'https://api.npci.org.in/upi',
                merchantId: process.env.UPI_MERCHANT_ID,
                merchantKey: process.env.UPI_MERCHANT_KEY,
                vpa: process.env.UPI_VPA || 'government@upi',
                timeout: 30000
            },
            
            // BHIM (Bharat Interface for Money)
            bhim: {
                baseUrl: process.env.BHIM_API_URL || 'https://api.bhimupi.org.in',
                apiKey: process.env.BHIM_API_KEY,
                merchantCode: process.env.BHIM_MERCHANT_CODE,
                timeout: 25000
            },
            
            // Government Payment Gateway (SBI/Other banks)
            govPayGateway: {
                baseUrl: process.env.GOV_PAY_API_URL || 'https://www.onlinesbi.com/sbicollect',
                merchantId: process.env.GOV_PAY_MERCHANT_ID,
                secretKey: process.env.GOV_PAY_SECRET_KEY,
                timeout: 35000
            },
            
            // Digital Wallet Integration (Paytm, PhonePe, etc.)
            wallets: {
                paytm: {
                    baseUrl: process.env.PAYTM_API_URL || 'https://securegw.paytm.in',
                    merchantId: process.env.PAYTM_MERCHANT_ID,
                    merchantKey: process.env.PAYTM_MERCHANT_KEY,
                    timeout: 30000
                },
                phonePe: {
                    baseUrl: process.env.PHONEPE_API_URL || 'https://api.phonepe.com',
                    merchantId: process.env.PHONEPE_MERCHANT_ID,
                    saltKey: process.env.PHONEPE_SALT_KEY,
                    timeout: 30000
                }
            },
            
            // Bank Integration for Government Services
            netBanking: {
                sbi: {
                    baseUrl: process.env.SBI_NETBANKING_URL || 'https://www.onlinesbi.com',
                    merchantCode: process.env.SBI_MERCHANT_CODE,
                    timeout: 40000
                },
                hdfc: {
                    baseUrl: process.env.HDFC_NETBANKING_URL || 'https://netbanking.hdfcbank.com',
                    merchantCode: process.env.HDFC_MERCHANT_CODE,
                    timeout: 40000
                }
            }
        };
        
        // Government fee structures
        this.feeStructures = {
            'passport': { application: 1500, tatkal: 3500, minor: 1000 },
            'pan_card': { new: 93, correction: 93, reprint: 50 },
            'driving_license': { new: 200, renewal: 200, duplicate: 500 },
            'birth_certificate': { new: 50, duplicate: 25 },
            'rti_application': { fee: 10, additional_info: 2 },
            'court_fees': { civil: 100, criminal: 50, appeal: 500 },
            'utility_bills': { electricity: 0, water: 0, gas: 0 }, // Variable
            'tax_payments': { income_tax: 0, gst: 0, property_tax: 0 }, // Variable
            'fines': { traffic: 500, environmental: 1000, other: 200 }
        };
    }
    
    initializeDatabase() {
        // Payment transactions table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS payment_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                citizen_id TEXT NOT NULL,
                transaction_id TEXT UNIQUE NOT NULL,
                payment_gateway TEXT NOT NULL,
                service_type TEXT NOT NULL,
                service_name TEXT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                currency TEXT DEFAULT 'INR',
                status TEXT DEFAULT 'pending',
                payment_method TEXT NOT NULL,
                gateway_transaction_id TEXT,
                gateway_response TEXT,
                initiated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                failed_at DATETIME,
                refunded_at DATETIME,
                refund_amount DECIMAL(10,2),
                description TEXT,
                callback_url TEXT,
                success_url TEXT,
                failure_url TEXT,
                metadata TEXT
            )
        `);
        
        // Payment receipts table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS payment_receipts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_id TEXT NOT NULL,
                receipt_number TEXT UNIQUE NOT NULL,
                citizen_id TEXT NOT NULL,
                service_type TEXT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                tax_amount DECIMAL(10,2) DEFAULT 0,
                total_amount DECIMAL(10,2) NOT NULL,
                payment_date DATETIME NOT NULL,
                issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                digital_signature TEXT,
                receipt_url TEXT,
                is_valid BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (transaction_id) REFERENCES payment_transactions(transaction_id)
            )
        `);
        
        // Refund requests table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS refund_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_id TEXT NOT NULL,
                citizen_id TEXT NOT NULL,
                refund_amount DECIMAL(10,2) NOT NULL,
                reason TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                processed_at DATETIME,
                refund_transaction_id TEXT,
                admin_comments TEXT,
                FOREIGN KEY (transaction_id) REFERENCES payment_transactions(transaction_id)
            )
        `);
        
        // Payment method configurations
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS payment_methods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                method_type TEXT NOT NULL,
                method_name TEXT NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                min_amount DECIMAL(10,2) DEFAULT 1,
                max_amount DECIMAL(10,2) DEFAULT 100000,
                processing_fee DECIMAL(10,2) DEFAULT 0,
                processing_fee_percentage DECIMAL(5,2) DEFAULT 0,
                supported_services TEXT,
                configuration TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Government service fee catalog
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS service_fees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                service_type TEXT NOT NULL,
                service_name TEXT NOT NULL,
                fee_amount DECIMAL(10,2) NOT NULL,
                tax_percentage DECIMAL(5,2) DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                effective_from DATETIME DEFAULT CURRENT_TIMESTAMP,
                effective_until DATETIME,
                description TEXT,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Payment gateway status tracking
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS gateway_health (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                gateway_name TEXT NOT NULL,
                status TEXT NOT NULL,
                response_time INTEGER,
                last_check DATETIME DEFAULT CURRENT_TIMESTAMP,
                error_count INTEGER DEFAULT 0,
                success_count INTEGER DEFAULT 0,
                uptime_percentage DECIMAL(5,2)
            )
        `);
        
        // Create indexes
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_payment_transactions_citizen ON payment_transactions(citizen_id)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_payment_transactions_service ON payment_transactions(service_type)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_payment_receipts_citizen ON payment_receipts(citizen_id)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_refund_requests_transaction ON refund_requests(transaction_id)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_service_fees_type ON service_fees(service_type)`);
        
        // Initialize default payment methods
        this.initializeDefaultPaymentMethods();
        this.initializeDefaultServiceFees();
    }
    
    initializeDefaultPaymentMethods() {
        const defaultMethods = [
            {
                method_type: 'upi',
                method_name: 'UPI Payment',
                min_amount: 1,
                max_amount: 100000,
                processing_fee: 0,
                supported_services: JSON.stringify(['all'])
            },
            {
                method_type: 'netbanking',
                method_name: 'Net Banking',
                min_amount: 1,
                max_amount: 500000,
                processing_fee: 5,
                supported_services: JSON.stringify(['all'])
            },
            {
                method_type: 'wallet',
                method_name: 'Digital Wallet',
                min_amount: 1,
                max_amount: 50000,
                processing_fee: 2,
                supported_services: JSON.stringify(['utility_bills', 'fines', 'certificates'])
            },
            {
                method_type: 'card',
                method_name: 'Credit/Debit Card',
                min_amount: 1,
                max_amount: 200000,
                processing_fee: 0,
                processing_fee_percentage: 1.5,
                supported_services: JSON.stringify(['all'])
            }
        ];
        
        for (const method of defaultMethods) {
            this.db.prepare(`
                INSERT OR IGNORE INTO payment_methods 
                (method_type, method_name, min_amount, max_amount, processing_fee, processing_fee_percentage, supported_services)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
                method.method_type,
                method.method_name,
                method.min_amount,
                method.max_amount,
                method.processing_fee,
                method.processing_fee_percentage || 0,
                method.supported_services
            );
        }
    }
    
    initializeDefaultServiceFees() {
        const defaultFees = [
            { service_type: 'passport', service_name: 'New Passport Application', fee_amount: 1500, tax_percentage: 18 },
            { service_type: 'passport', service_name: 'Tatkal Passport', fee_amount: 3500, tax_percentage: 18 },
            { service_type: 'pan_card', service_name: 'New PAN Card', fee_amount: 93, tax_percentage: 18 },
            { service_type: 'driving_license', service_name: 'New Driving License', fee_amount: 200, tax_percentage: 18 },
            { service_type: 'birth_certificate', service_name: 'Birth Certificate', fee_amount: 50, tax_percentage: 0 },
            { service_type: 'rti_application', service_name: 'RTI Application Fee', fee_amount: 10, tax_percentage: 0 },
            { service_type: 'court_fees', service_name: 'Civil Court Fee', fee_amount: 100, tax_percentage: 0 },
            { service_type: 'fines', service_name: 'Traffic Violation Fine', fee_amount: 500, tax_percentage: 0 }
        ];
        
        for (const fee of defaultFees) {
            this.db.prepare(`
                INSERT OR IGNORE INTO service_fees 
                (service_type, service_name, fee_amount, tax_percentage)
                VALUES (?, ?, ?, ?)
            `).run(fee.service_type, fee.service_name, fee.fee_amount, fee.tax_percentage);
        }
    }
    
    // Initiate payment transaction
    async initiatePayment(paymentRequest, citizenId) {
        try {
            const {
                service_type,
                service_name,
                amount,
                payment_method,
                description,
                callback_url,
                success_url,
                failure_url,
                metadata = {}
            } = paymentRequest;
            
            // Generate unique transaction ID
            const transactionId = this.generateTransactionId();
            
            // Validate service and amount
            const serviceValidation = await this.validateServiceFee(service_type, service_name, amount);
            if (!serviceValidation.isValid) {
                throw new Error(serviceValidation.error);
            }
            
            // Store transaction in database
            const stmt = this.db.prepare(`
                INSERT INTO payment_transactions 
                (citizen_id, transaction_id, payment_gateway, service_type, service_name, amount, 
                 payment_method, description, callback_url, success_url, failure_url, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            stmt.run(
                citizenId,
                transactionId,
                this.getGatewayForMethod(payment_method),
                service_type,
                service_name,
                amount,
                payment_method,
                description,
                callback_url,
                success_url,
                failure_url,
                JSON.stringify(metadata)
            );
            
            // Process payment based on method
            let paymentResponse;
            switch (payment_method) {
                case 'upi':
                    paymentResponse = await this.processUPIPayment(transactionId, amount, description);
                    break;
                case 'netbanking':
                    paymentResponse = await this.processNetBankingPayment(transactionId, amount, description);
                    break;
                case 'wallet':
                    paymentResponse = await this.processWalletPayment(transactionId, amount, description, metadata.wallet_provider);
                    break;
                case 'card':
                    paymentResponse = await this.processCardPayment(transactionId, amount, description);
                    break;
                default:
                    throw new Error(`Unsupported payment method: ${payment_method}`);
            }
            
            // Update transaction with gateway response
            this.updateTransaction(transactionId, {
                gateway_transaction_id: paymentResponse.gateway_transaction_id,
                gateway_response: JSON.stringify(paymentResponse)
            });
            
            return {
                transaction_id: transactionId,
                payment_url: paymentResponse.payment_url,
                qr_code: paymentResponse.qr_code,
                status: 'initiated',
                gateway_response: paymentResponse
            };
            
        } catch (error) {
            throw new Error(`Payment initiation failed: ${error.message}`);
        }
    }
    
    // Process UPI payment
    async processUPIPayment(transactionId, amount, description) {
        try {
            // Simulate UPI payment initiation
            const upiResponse = {
                gateway_transaction_id: 'UPI' + Date.now(),
                payment_url: `upi://pay?pa=${this.paymentGateways.upi.vpa}&pn=Government Services&am=${amount}&tr=${transactionId}&tn=${encodeURIComponent(description)}`,
                qr_code: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`, // Placeholder QR
                status: 'pending',
                expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
            };
            
            // In production, make actual API call to UPI gateway
            /*
            const response = await axios.post(`${this.paymentGateways.upi.baseUrl}/collect`, {
                merchantId: this.paymentGateways.upi.merchantId,
                transactionId: transactionId,
                amount: amount,
                description: description,
                callbackUrl: callback_url
            }, {
                headers: {
                    'Authorization': `Bearer ${this.paymentGateways.upi.merchantKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: this.paymentGateways.upi.timeout
            });
            */
            
            return upiResponse;
            
        } catch (error) {
            throw new Error(`UPI payment processing failed: ${error.message}`);
        }
    }
    
    // Process Net Banking payment
    async processNetBankingPayment(transactionId, amount, description) {
        try {
            const netBankingResponse = {
                gateway_transaction_id: 'NB' + Date.now(),
                payment_url: `${this.paymentGateways.govPayGateway.baseUrl}/payment?txnid=${transactionId}&amount=${amount}&desc=${encodeURIComponent(description)}`,
                status: 'pending',
                bank_options: ['SBI', 'HDFC', 'ICICI', 'Axis', 'PNB', 'BOB'],
                expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
            };
            
            return netBankingResponse;
            
        } catch (error) {
            throw new Error(`Net Banking payment processing failed: ${error.message}`);
        }
    }
    
    // Process Wallet payment
    async processWalletPayment(transactionId, amount, description, walletProvider = 'paytm') {
        try {
            const walletConfig = this.paymentGateways.wallets[walletProvider];
            if (!walletConfig) {
                throw new Error(`Unsupported wallet provider: ${walletProvider}`);
            }
            
            const walletResponse = {
                gateway_transaction_id: 'WALLET' + Date.now(),
                payment_url: `${walletConfig.baseUrl}/payment?txnid=${transactionId}&amount=${amount}&desc=${encodeURIComponent(description)}`,
                wallet_provider: walletProvider,
                status: 'pending',
                expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString() // 20 minutes
            };
            
            return walletResponse;
            
        } catch (error) {
            throw new Error(`Wallet payment processing failed: ${error.message}`);
        }
    }
    
    // Process Card payment
    async processCardPayment(transactionId, amount, description) {
        try {
            const cardResponse = {
                gateway_transaction_id: 'CARD' + Date.now(),
                payment_url: `${this.paymentGateways.govPayGateway.baseUrl}/card-payment?txnid=${transactionId}&amount=${amount}&desc=${encodeURIComponent(description)}`,
                status: 'pending',
                supported_cards: ['Visa', 'MasterCard', 'RuPay', 'American Express'],
                expires_at: new Date(Date.now() + 25 * 60 * 1000).toISOString() // 25 minutes
            };
            
            return cardResponse;
            
        } catch (error) {
            throw new Error(`Card payment processing failed: ${error.message}`);
        }
    }
    
    // Handle payment callback/webhook
    async handlePaymentCallback(callbackData) {
        try {
            const {
                transaction_id,
                gateway_transaction_id,
                status,
                gateway_response
            } = callbackData;
            
            // Update transaction status
            const updateData = {
                status: status,
                gateway_transaction_id: gateway_transaction_id,
                gateway_response: JSON.stringify(gateway_response)
            };
            
            if (status === 'success') {
                updateData.completed_at = new Date().toISOString();
                
                // Generate receipt
                await this.generateReceipt(transaction_id);
                
            } else if (status === 'failed') {
                updateData.failed_at = new Date().toISOString();
            }
            
            this.updateTransaction(transaction_id, updateData);
            
            return { success: true, transaction_id };
            
        } catch (error) {
            throw new Error(`Payment callback handling failed: ${error.message}`);
        }
    }
    
    // Generate payment receipt
    async generateReceipt(transactionId) {
        try {
            const transaction = this.getTransaction(transactionId);
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            
            const receiptNumber = this.generateReceiptNumber();
            const taxAmount = (transaction.amount * 0.18); // 18% GST if applicable
            const totalAmount = transaction.amount + taxAmount;
            
            // Create digital signature for receipt
            const digitalSignature = this.generateDigitalSignature({
                receipt_number: receiptNumber,
                transaction_id: transactionId,
                amount: totalAmount,
                date: new Date().toISOString()
            });
            
            const stmt = this.db.prepare(`
                INSERT INTO payment_receipts 
                (transaction_id, receipt_number, citizen_id, service_type, amount, tax_amount, 
                 total_amount, payment_date, digital_signature)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            stmt.run(
                transactionId,
                receiptNumber,
                transaction.citizen_id,
                transaction.service_type,
                transaction.amount,
                taxAmount,
                totalAmount,
                new Date().toISOString(),
                digitalSignature
            );
            
            return receiptNumber;
            
        } catch (error) {
            throw new Error(`Receipt generation failed: ${error.message}`);
        }
    }
    
    // Request refund
    async requestRefund(transactionId, citizenId, refundAmount, reason) {
        try {
            const transaction = this.getTransaction(transactionId);
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            
            if (transaction.citizen_id !== citizenId) {
                throw new Error('Unauthorized refund request');
            }
            
            if (transaction.status !== 'success') {
                throw new Error('Can only refund successful transactions');
            }
            
            if (refundAmount > transaction.amount) {
                throw new Error('Refund amount cannot exceed transaction amount');
            }
            
            const stmt = this.db.prepare(`
                INSERT INTO refund_requests 
                (transaction_id, citizen_id, refund_amount, reason)
                VALUES (?, ?, ?, ?)
            `);
            
            const result = stmt.run(transactionId, citizenId, refundAmount, reason);
            
            return {
                refund_request_id: result.lastInsertRowid,
                status: 'pending',
                estimated_processing_time: '5-7 business days'
            };
            
        } catch (error) {
            throw new Error(`Refund request failed: ${error.message}`);
        }
    }
    
    // Utility functions
    generateTransactionId() {
        return 'TXN' + Date.now() + crypto.randomBytes(4).toString('hex').toUpperCase();
    }
    
    generateReceiptNumber() {
        return 'RCP' + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();
    }
    
    generateDigitalSignature(data) {
        return crypto.createHash('sha256')
            .update(JSON.stringify(data) + (process.env.RECEIPT_SECRET || 'default_secret'))
            .digest('hex');
    }
    
    getGatewayForMethod(paymentMethod) {
        const gatewayMap = {
            'upi': 'upi',
            'netbanking': 'govPayGateway',
            'wallet': 'wallets',
            'card': 'govPayGateway'
        };
        return gatewayMap[paymentMethod] || 'govPayGateway';
    }
    
    async validateServiceFee(serviceType, serviceName, amount) {
        const stmt = this.db.prepare(`
            SELECT fee_amount, tax_percentage FROM service_fees 
            WHERE service_type = ? AND service_name = ? AND is_active = 1
        `);
        const serviceInfo = stmt.get(serviceType, serviceName);
        
        if (!serviceInfo) {
            return { isValid: false, error: 'Service not found or inactive' };
        }
        
        const expectedAmount = serviceInfo.fee_amount * (1 + serviceInfo.tax_percentage / 100);
        
        if (Math.abs(amount - expectedAmount) > 0.01) {
            return { 
                isValid: false, 
                error: `Amount mismatch. Expected: ${expectedAmount}, Provided: ${amount}` 
            };
        }
        
        return { isValid: true };
    }
    
    updateTransaction(transactionId, updateData) {
        const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updateData);
        values.push(transactionId);
        
        const stmt = this.db.prepare(`
            UPDATE payment_transactions SET ${fields} WHERE transaction_id = ?
        `);
        stmt.run(...values);
    }
    
    getTransaction(transactionId) {
        const stmt = this.db.prepare(`
            SELECT * FROM payment_transactions WHERE transaction_id = ?
        `);
        return stmt.get(transactionId);
    }
    
    // Get payment statistics
    getPaymentStats(citizenId = null, days = 30) {
        const dateFilter = `datetime('now', '-${days} days')`;
        let query = `
            SELECT 
                payment_method,
                service_type,
                COUNT(*) as total_transactions,
                SUM(amount) as total_amount,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_transactions,
                SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as successful_amount,
                AVG(CASE WHEN status = 'success' THEN 1.0 ELSE 0.0 END) * 100 as success_rate
            FROM payment_transactions 
            WHERE initiated_at > ${dateFilter}
        `;
        
        const params = [];
        if (citizenId) {
            query += ` AND citizen_id = ?`;
            params.push(citizenId);
        }
        
        query += ` GROUP BY payment_method, service_type ORDER BY total_amount DESC`;
        
        return this.db.prepare(query).all(...params);
    }
    
    // Cleanup old data
    cleanup(olderThanDays = 365) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        const cutoffISO = cutoffDate.toISOString();
        
        // Clean old failed transactions (keep successful ones longer)
        const transactionsDeleted = this.db.prepare(`
            DELETE FROM payment_transactions 
            WHERE initiated_at < ? AND status = 'failed'
        `).run(cutoffISO).changes;
        
        // Clean old refund requests (completed)
        const refundsDeleted = this.db.prepare(`
            DELETE FROM refund_requests 
            WHERE requested_at < ? AND status = 'completed'
        `).run(cutoffISO).changes;
        
        return { transactionsDeleted, refundsDeleted };
    }
}

module.exports = GovernmentPaymentService;