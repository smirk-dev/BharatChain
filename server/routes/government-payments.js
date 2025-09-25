const express = require('express');
const router = express.Router();
const PaymentGatewayService = require('../services/payment-gateway');
const { verifyToken } = require('../middleware/auth');
const db = require('../database/init');

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
        res.json({
            success: true,
            data: {
                payments: [],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 0,
                    pages: 0
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
 * @route GET /api/payments/stats
 * @desc Get payment gateway statistics
 * @access Private
 */
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const gatewayStats = paymentGateway.getPaymentStats();

        res.json({
            success: true,
            data: {
                gateway: gatewayStats,
                user_stats: {
                    total_payments: 0,
                    total_spent: 0,
                    successful_payments: 0,
                    failed_payments: 0,
                    refunded_payments: 0
                }
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

module.exports = router;