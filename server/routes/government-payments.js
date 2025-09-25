const express = require('express');
const router = express.Router();
const PaymentGatewayService = require('../services/payment-gateway');
const { verifyToken } = require('../middleware/auth');
const db = require('../../database/bharatchain.db');

const paymentGateway = new PaymentGatewayService();

/**
 * @route POST /api/payments/create-order
 * @desc Create payment order for government service
 * @access Private
 */
router.post('/create-order', verifyToken, async (req, res) => {
    try {
        const { serviceType, amount, description, metadata = {} } = req.body;
        
        if (!serviceType) {
            return res.status(400).json({
                success: false,
                error: 'Service type is required'
            });
        }

        // Get service fees
        const serviceFees = paymentGateway.getServiceFees();
        const serviceAmount = amount || serviceFees[serviceType]?.amount;

        if (serviceAmount === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Invalid service type or amount not specified'
            });
        }

        // Create payment order
        const orderResult = await paymentGateway.createPaymentOrder({
            amount: serviceAmount,
            serviceType,
            citizenId: req.user.id,
            description: description || serviceFees[serviceType]?.description,
            metadata: {
                user_id: req.user.id,
                user_email: req.user.email,
                ...metadata
            }
        });

        if (!orderResult.success) {
            return res.status(500).json({
                success: false,
                error: orderResult.error
            });
        }

        // Store payment record in database
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO payments (citizen_id, service_type, amount, currency, order_id, receipt_id, status, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    req.user.id,
                    serviceType,
                    orderResult.data.amount,
                    orderResult.data.currency,
                    orderResult.data.orderId,
                    orderResult.data.receipt,
                    'created',
                    new Date()
                ],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        res.json({
            success: true,
            data: orderResult.data
        });

    } catch (error) {
        console.error('Create payment order error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create payment order'
        });
    }
});

/**
 * @route POST /api/payments/verify
 * @desc Verify payment after successful payment
 * @access Private
 */
router.post('/verify', verifyToken, async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                error: 'Payment verification data is incomplete'
            });
        }

        // Verify payment signature
        const verification = paymentGateway.verifyPaymentSignature({
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature
        });

        if (!verification.verified) {
            return res.status(400).json({
                success: false,
                error: 'Payment verification failed'
            });
        }

        // Update payment status in database
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE payments SET payment_id = ?, status = 'completed', verified_at = ?, signature = ?
                 WHERE order_id = ? AND citizen_id = ?`,
                [
                    razorpay_payment_id,
                    new Date(),
                    razorpay_signature,
                    razorpay_order_id,
                    req.user.id
                ],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });

        res.json({
            success: true,
            data: {
                payment_verified: true,
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id,
                status: 'completed'
            }
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Payment verification failed'
        });
    }
});

/**
 * @route GET /api/payments/fees
 * @desc Get service fees for all government services
 * @access Public
 */
router.get('/fees', (req, res) => {
    try {
        const serviceFees = paymentGateway.getServiceFees();
        
        res.json({
            success: true,
            data: serviceFees
        });

    } catch (error) {
        console.error('Get service fees error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch service fees'
        });
    }
});

/**
 * @route GET /api/payments/history
 * @desc Get payment history for the authenticated user
 * @access Private
 */
router.get('/history', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;

        let query = `SELECT * FROM payments WHERE citizen_id = ?`;
        let params = [req.user.id];

        if (status) {
            query += ` AND status = ?`;
            params.push(status);
        }

        query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), offset);

        const payments = await new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        // Get total count
        const totalCount = await new Promise((resolve, reject) => {
            let countQuery = `SELECT COUNT(*) as count FROM payments WHERE citizen_id = ?`;
            let countParams = [req.user.id];

            if (status) {
                countQuery += ` AND status = ?`;
                countParams.push(status);
            }

            db.get(countQuery, countParams, (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        res.json({
            success: true,
            data: {
                payments,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    pages: Math.ceil(totalCount / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch payment history'
        });
    }
});

/**
 * @route POST /api/payments/refund
 * @desc Process refund for a payment
 * @access Private
 */
router.post('/refund', verifyToken, async (req, res) => {
    try {
        const { payment_id, amount, reason } = req.body;

        if (!payment_id) {
            return res.status(400).json({
                success: false,
                error: 'Payment ID is required'
            });
        }

        // Verify payment belongs to user
        const payment = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM payments WHERE payment_id = ? AND citizen_id = ?',
                [payment_id, req.user.id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found'
            });
        }

        if (payment.status !== 'completed') {
            return res.status(400).json({
                success: false,
                error: 'Only completed payments can be refunded'
            });
        }

        // Process refund
        const refundResult = await paymentGateway.processRefund({
            paymentId: payment_id,
            amount: amount,
            reason: reason || 'User requested refund',
            metadata: {
                user_id: req.user.id,
                original_order_id: payment.order_id
            }
        });

        if (!refundResult.success) {
            return res.status(500).json({
                success: false,
                error: refundResult.error
            });
        }

        // Update payment record
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE payments SET status = 'refunded', refund_id = ?, refunded_at = ?
                 WHERE payment_id = ?`,
                [refundResult.data.refund_id, new Date(), payment_id],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });

        res.json({
            success: true,
            data: refundResult.data
        });

    } catch (error) {
        console.error('Refund processing error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process refund'
        });
    }
});

/**
 * @route GET /api/payments/stats
 * @desc Get payment gateway statistics
 * @access Private
 */
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const gatewayStats = paymentGateway.getPaymentStats();

        // Get user payment statistics
        const userStats = await new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    COUNT(*) as total_payments,
                    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_spent,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_payments,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
                    COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_payments
                FROM payments 
                WHERE citizen_id = ?
            `, [req.user.id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows[0] || {});
            });
        });

        res.json({
            success: true,
            data: {
                gateway: gatewayStats,
                user_stats: userStats
            }
        });

    } catch (error) {
        console.error('Get payment stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get payment statistics'
        });
    }
});
        
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