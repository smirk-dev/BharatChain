const Razorpay = require('razorpay');
const crypto = require('crypto');
const config = require('../../config/env-config');

class PaymentGatewayService {
    constructor() {
        this.isProduction = process.env.NODE_ENV === 'production';
        
        // Initialize Razorpay with environment-specific keys
        this.razorpay = new Razorpay({
            key_id: config.RAZORPAY_KEY_ID || 'rzp_test_demo_key',
            key_secret: config.RAZORPAY_KEY_SECRET || 'rzp_test_demo_secret'
        });

        this.webhookSecret = config.PAYMENT_WEBHOOK_SECRET;
        this.mockPayments = config.MOCK_PAYMENTS || !this.isProduction;

        console.log(`💳 Payment Gateway initialized - Mock Mode: ${this.mockPayments}`);
    }

    /**
     * Create a payment order for government services
     */
    async createPaymentOrder(paymentData) {
        try {
            const { amount, serviceType, citizenId, description, metadata = {} } = paymentData;

            if (this.mockPayments) {
                return this.createMockOrder(paymentData);
            }

            // Create Razorpay order
            const orderOptions = {
                amount: Math.round(amount * 100), // Convert to paisa
                currency: 'INR',
                receipt: this.generateReceiptId(serviceType, citizenId),
                notes: {
                    service_type: serviceType,
                    citizen_id: citizenId,
                    description: description,
                    created_via: 'BharatChain',
                    ...metadata
                }
            };

            const order = await this.razorpay.orders.create(orderOptions);

            return {
                success: true,
                data: {
                    orderId: order.id,
                    amount: order.amount / 100,
                    currency: order.currency,
                    receipt: order.receipt,
                    status: order.status,
                    created_at: order.created_at,
                    razorpay_key: this.razorpay.key_id,
                    service_type: serviceType,
                    citizen_id: citizenId
                }
            };

        } catch (error) {
            console.error('Payment order creation error:', error);
            return {
                success: false,
                error: error.message || 'Failed to create payment order'
            };
        }
    }

    /**
     * Verify payment signature from Razorpay webhook
     */
    verifyPaymentSignature(paymentData) {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

            if (this.mockPayments) {
                return this.verifyMockPayment(paymentData);
            }

            const generated_signature = crypto
                .createHmac('sha256', this.razorpay.key_secret)
                .update(razorpay_order_id + "|" + razorpay_payment_id)
                .digest('hex');

            return {
                verified: generated_signature === razorpay_signature,
                order_id: razorpay_order_id,
                payment_id: razorpay_payment_id
            };

        } catch (error) {
            console.error('Payment verification error:', error);
            return {
                verified: false,
                error: error.message
            };
        }
    }

    /**
     * Get payment details by payment ID
     */
    async getPaymentDetails(paymentId) {
        try {
            if (this.mockPayments) {
                return this.getMockPaymentDetails(paymentId);
            }

            const payment = await this.razorpay.payments.fetch(paymentId);
            
            return {
                success: true,
                data: {
                    payment_id: payment.id,
                    order_id: payment.order_id,
                    amount: payment.amount / 100,
                    currency: payment.currency,
                    status: payment.status,
                    method: payment.method,
                    bank: payment.bank,
                    wallet: payment.wallet,
                    vpa: payment.vpa,
                    email: payment.email,
                    contact: payment.contact,
                    created_at: payment.created_at,
                    fee: payment.fee / 100,
                    tax: payment.tax / 100,
                    notes: payment.notes
                }
            };

        } catch (error) {
            console.error('Get payment details error:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch payment details'
            };
        }
    }

    /**
     * Process refund for a payment
     */
    async processRefund(refundData) {
        try {
            const { paymentId, amount, reason = 'Service cancellation', metadata = {} } = refundData;

            if (this.mockPayments) {
                return this.processMockRefund(refundData);
            }

            const refundOptions = {
                amount: amount ? Math.round(amount * 100) : undefined, // Full refund if amount not specified
                notes: {
                    reason: reason,
                    processed_via: 'BharatChain',
                    ...metadata
                }
            };

            const refund = await this.razorpay.payments.refund(paymentId, refundOptions);

            return {
                success: true,
                data: {
                    refund_id: refund.id,
                    payment_id: refund.payment_id,
                    amount: refund.amount / 100,
                    currency: refund.currency,
                    status: refund.status,
                    created_at: refund.created_at,
                    notes: refund.notes
                }
            };

        } catch (error) {
            console.error('Refund processing error:', error);
            return {
                success: false,
                error: error.message || 'Failed to process refund'
            };
        }
    }

    /**
     * Get service fees for government services
     */
    getServiceFees() {
        return {
            'birth_certificate': { amount: 10, description: 'Birth Certificate Fee' },
            'death_certificate': { amount: 10, description: 'Death Certificate Fee' },
            'marriage_certificate': { amount: 15, description: 'Marriage Certificate Fee' },
            'domicile_certificate': { amount: 20, description: 'Domicile Certificate Fee' },
            'income_certificate': { amount: 25, description: 'Income Certificate Fee' },
            'caste_certificate': { amount: 15, description: 'Caste Certificate Fee' },
            'character_certificate': { amount: 10, description: 'Character Certificate Fee' },
            'land_records': { amount: 50, description: 'Land Records Fee' },
            'business_license': { amount: 100, description: 'Business License Fee' },
            'passport_verification': { amount: 30, description: 'Passport Verification Fee' },
            'driving_license': { amount: 200, description: 'Driving License Fee' },
            'voter_id': { amount: 0, description: 'Voter ID (Free Service)' },
            'pan_card': { amount: 107, description: 'PAN Card Fee' },
            'property_registration': { amount: 500, description: 'Property Registration Fee' },
            'trade_license': { amount: 150, description: 'Trade License Fee' }
        };
    }

    /**
     * Validate payment webhook from Razorpay
     */
    validateWebhook(signature, body) {
        try {
            const expectedSignature = crypto
                .createHmac('sha256', this.webhookSecret)
                .update(JSON.stringify(body))
                .digest('hex');

            return expectedSignature === signature;
        } catch (error) {
            console.error('Webhook validation error:', error);
            return false;
        }
    }

    /**
     * Generate unique receipt ID
     */
    generateReceiptId(serviceType, citizenId) {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(4).toString('hex').toUpperCase();
        return `BC_${serviceType}_${citizenId}_${timestamp}_${random}`;
    }

    // Mock payment methods for testing
    createMockOrder(paymentData) {
        const mockOrderId = `order_mock_${Date.now()}`;
        return {
            success: true,
            data: {
                orderId: mockOrderId,
                amount: paymentData.amount,
                currency: 'INR',
                receipt: this.generateReceiptId(paymentData.serviceType, paymentData.citizenId),
                status: 'created',
                created_at: Math.floor(Date.now() / 1000),
                razorpay_key: 'rzp_test_mock_key',
                service_type: paymentData.serviceType,
                citizen_id: paymentData.citizenId,
                mock_mode: true
            }
        };
    }

    verifyMockPayment(paymentData) {
        // In mock mode, always verify as true for testing
        return {
            verified: true,
            order_id: paymentData.razorpay_order_id,
            payment_id: paymentData.razorpay_payment_id,
            mock_mode: true
        };
    }

    getMockPaymentDetails(paymentId) {
        return {
            success: true,
            data: {
                payment_id: paymentId,
                order_id: `order_mock_${Date.now()}`,
                amount: 100,
                currency: 'INR',
                status: 'captured',
                method: 'card',
                bank: 'HDFC Bank',
                created_at: Math.floor(Date.now() / 1000),
                fee: 2.36,
                tax: 0.36,
                notes: { service_type: 'test' },
                mock_mode: true
            }
        };
    }

    processMockRefund(refundData) {
        return {
            success: true,
            data: {
                refund_id: `rfnd_mock_${Date.now()}`,
                payment_id: refundData.paymentId,
                amount: refundData.amount,
                currency: 'INR',
                status: 'processed',
                created_at: Math.floor(Date.now() / 1000),
                notes: { reason: refundData.reason },
                mock_mode: true
            }
        };
    }

    /**
     * Get payment gateway statistics
     */
    getPaymentStats() {
        return {
            gateway: 'Razorpay',
            mock_mode: this.mockPayments,
            supported_currencies: ['INR'],
            supported_methods: [
                'card', 'netbanking', 'wallet', 'upi', 
                'paylater', 'cardless_emi', 'bank_transfer'
            ],
            features: [
                'instant_refunds',
                'webhook_support', 
                'payment_links',
                'subscription_billing',
                'route_transfers'
            ],
            security: [
                'PCI_DSS_compliant',
                '256_bit_SSL',
                '3D_secure',
                'fraud_detection'
            ]
        };
    }
}

module.exports = PaymentGatewayService;