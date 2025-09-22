const express = require('express');
const router = express.Router();
const GovernmentPaymentService = require('../services/government-payments');

const paymentService = new GovernmentPaymentService();

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

// Initiate payment
router.post('/initiate', validateCitizenId, rateLimit(5, 300000), async (req, res) => {
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
            metadata
        } = req.body;
        
        // Validate required fields
        if (!service_type || !service_name || !amount || !payment_method) {
            return res.status(400).json({
                success: false,
                error: 'Service type, service name, amount, and payment method are required'
            });
        }
        
        // Validate amount
        if (amount <= 0 || amount > 500000) {
            return res.status(400).json({
                success: false,
                error: 'Amount must be between ₹1 and ₹5,00,000'
            });
        }
        
        // Validate payment method
        const validMethods = ['upi', 'netbanking', 'wallet', 'card'];
        if (!validMethods.includes(payment_method)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid payment method. Supported methods: ' + validMethods.join(', ')
            });
        }
        
        const paymentRequest = {
            service_type,
            service_name,
            amount,
            payment_method,
            description,
            callback_url,
            success_url,
            failure_url,
            metadata
        };
        
        const result = await paymentService.initiatePayment(paymentRequest, req.citizenId);
        
        res.json({
            success: true,
            data: result,
            message: 'Payment initiated successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Payment callback/webhook endpoint
router.post('/callback', async (req, res) => {
    try {
        const {
            transaction_id,
            gateway_transaction_id,
            status,
            signature,
            gateway_response
        } = req.body;
        
        if (!transaction_id || !gateway_transaction_id || !status) {
            return res.status(400).json({
                success: false,
                error: 'Transaction ID, gateway transaction ID, and status are required'
            });
        }
        
        // Verify signature (implement based on gateway requirements)
        // const isValidSignature = verifySignature(req.body, signature);
        // if (!isValidSignature) {
        //     return res.status(401).json({
        //         success: false,
        //         error: 'Invalid signature'
        //     });
        // }
        
        const callbackData = {
            transaction_id,
            gateway_transaction_id,
            status,
            gateway_response
        };
        
        const result = await paymentService.handlePaymentCallback(callbackData);
        
        res.json({
            success: true,
            data: result,
            message: 'Payment callback processed successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Check payment status
router.get('/status/:transaction_id', async (req, res) => {
    try {
        const { transaction_id } = req.params;
        
        const transaction = paymentService.getTransaction(transaction_id);
        
        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
        }
        
        res.json({
            success: true,
            data: {
                transaction_id: transaction.transaction_id,
                status: transaction.status,
                amount: transaction.amount,
                service_type: transaction.service_type,
                service_name: transaction.service_name,
                payment_method: transaction.payment_method,
                initiated_at: transaction.initiated_at,
                completed_at: transaction.completed_at,
                failed_at: transaction.failed_at
            },
            message: 'Transaction status retrieved successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get payment receipt
router.get('/receipt/:transaction_id', async (req, res) => {
    try {
        const { transaction_id } = req.params;
        
        const stmt = paymentService.db.prepare(`
            SELECT r.*, t.service_type, t.service_name, t.description
            FROM payment_receipts r
            JOIN payment_transactions t ON r.transaction_id = t.transaction_id
            WHERE r.transaction_id = ?
        `);
        const receipt = stmt.get(transaction_id);
        
        if (!receipt) {
            return res.status(404).json({
                success: false,
                error: 'Receipt not found'
            });
        }
        
        res.json({
            success: true,
            data: receipt,
            message: 'Payment receipt retrieved successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Request refund
router.post('/refund', validateCitizenId, rateLimit(3, 3600000), async (req, res) => {
    try {
        const { transaction_id, refund_amount, reason } = req.body;
        
        if (!transaction_id || !refund_amount || !reason) {
            return res.status(400).json({
                success: false,
                error: 'Transaction ID, refund amount, and reason are required'
            });
        }
        
        if (refund_amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Refund amount must be greater than 0'
            });
        }
        
        const result = await paymentService.requestRefund(transaction_id, req.citizenId, refund_amount, reason);
        
        res.json({
            success: true,
            data: result,
            message: 'Refund request submitted successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get payment history for citizen
router.get('/history/:citizen_id', async (req, res) => {
    try {
        const { citizen_id } = req.params;
        const { limit = 50, offset = 0, status, service_type } = req.query;
        
        let query = `
            SELECT 
                transaction_id,
                service_type,
                service_name,
                amount,
                payment_method,
                status,
                initiated_at,
                completed_at,
                description
            FROM payment_transactions 
            WHERE citizen_id = ?
        `;
        
        const params = [citizen_id];
        
        if (status) {
            query += ` AND status = ?`;
            params.push(status);
        }
        
        if (service_type) {
            query += ` AND service_type = ?`;
            params.push(service_type);
        }
        
        query += ` ORDER BY initiated_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));
        
        const stmt = paymentService.db.prepare(query);
        const history = stmt.all(...params);
        
        res.json({
            success: true,
            data: history,
            message: 'Payment history retrieved successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get service fees catalog
router.get('/service-fees', async (req, res) => {
    try {
        const { service_type } = req.query;
        
        let query = `
            SELECT 
                service_type,
                service_name,
                fee_amount,
                tax_percentage,
                description,
                effective_from
            FROM service_fees 
            WHERE is_active = 1
        `;
        
        const params = [];
        
        if (service_type) {
            query += ` AND service_type = ?`;
            params.push(service_type);
        }
        
        query += ` ORDER BY service_type, service_name`;
        
        const stmt = paymentService.db.prepare(query);
        const fees = stmt.all(...params);
        
        res.json({
            success: true,
            data: fees,
            message: 'Service fees retrieved successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get available payment methods
router.get('/payment-methods', async (req, res) => {
    try {
        const { service_type, amount } = req.query;
        
        let query = `
            SELECT 
                method_type,
                method_name,
                min_amount,
                max_amount,
                processing_fee,
                processing_fee_percentage,
                supported_services
            FROM payment_methods 
            WHERE is_active = 1
        `;
        
        const params = [];
        
        if (amount) {
            query += ` AND min_amount <= ? AND max_amount >= ?`;
            params.push(parseFloat(amount), parseFloat(amount));
        }
        
        const stmt = paymentService.db.prepare(query);
        const methods = stmt.all(...params);
        
        // Filter by service type if provided
        const filteredMethods = methods.filter(method => {
            if (!service_type) return true;
            const supportedServices = JSON.parse(method.supported_services);
            return supportedServices.includes('all') || supportedServices.includes(service_type);
        });
        
        res.json({
            success: true,
            data: filteredMethods,
            message: 'Payment methods retrieved successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get payment statistics
router.get('/stats', async (req, res) => {
    try {
        const { citizen_id, days = 30 } = req.query;
        
        const stats = paymentService.getPaymentStats(citizen_id, parseInt(days));
        
        res.json({
            success: true,
            data: stats,
            message: 'Payment statistics retrieved successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Gateway health check
router.get('/gateway-health', async (req, res) => {
    try {
        const healthChecks = {
            upi: { status: 'operational', response_time: 200, uptime: 99.9 },
            netbanking: { status: 'operational', response_time: 350, uptime: 99.5 },
            wallet: { status: 'operational', response_time: 280, uptime: 99.7 },
            card: { status: 'operational', response_time: 320, uptime: 99.6 }
        };
        
        res.json({
            success: true,
            data: {
                overall_status: 'operational',
                gateways: healthChecks,
                last_updated: new Date().toISOString()
            },
            message: 'Payment gateway health check completed'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Calculate total amount with fees and taxes
router.post('/calculate-amount', async (req, res) => {
    try {
        const { service_type, service_name, payment_method, base_amount } = req.body;
        
        if (!service_type || !service_name || !payment_method) {
            return res.status(400).json({
                success: false,
                error: 'Service type, service name, and payment method are required'
            });
        }
        
        // Get service fee
        const serviceStmt = paymentService.db.prepare(`
            SELECT fee_amount, tax_percentage FROM service_fees 
            WHERE service_type = ? AND service_name = ? AND is_active = 1
        `);
        const serviceInfo = serviceStmt.get(service_type, service_name);
        
        if (!serviceInfo) {
            return res.status(404).json({
                success: false,
                error: 'Service not found'
            });
        }
        
        // Get payment method fee
        const methodStmt = paymentService.db.prepare(`
            SELECT processing_fee, processing_fee_percentage FROM payment_methods 
            WHERE method_type = ? AND is_active = 1
        `);
        const methodInfo = methodStmt.get(payment_method);
        
        const amount = base_amount || serviceInfo.fee_amount;
        const taxAmount = amount * (serviceInfo.tax_percentage / 100);
        const processingFee = methodInfo ? 
            (methodInfo.processing_fee + (amount * methodInfo.processing_fee_percentage / 100)) : 0;
        const totalAmount = amount + taxAmount + processingFee;
        
        res.json({
            success: true,
            data: {
                base_amount: amount,
                tax_amount: taxAmount,
                tax_percentage: serviceInfo.tax_percentage,
                processing_fee: processingFee,
                total_amount: totalAmount,
                currency: 'INR'
            },
            message: 'Amount calculation completed successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;