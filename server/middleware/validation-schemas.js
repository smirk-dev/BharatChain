/**
 * Validation Schemas for BharatChain API
 * Comprehensive validation rules for all endpoints
 */

const Joi = require('joi');

/**
 * Common Validation Rules
 */
const commonRules = {
    id: Joi.string().min(1).max(255).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    aadhaar: Joi.string().pattern(/^\d{4}-?\d{4}-?\d{4}$/).required(),
    password: Joi.string().min(8).max(128).required(),
    name: Joi.string().min(2).max(100).required(),
    address: Joi.string().min(10).max(500).required(),
    pincode: Joi.string().pattern(/^\d{6}$/).required(),
    walletAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
    documentHash: Joi.string().length(64).pattern(/^[a-fA-F0-9]+$/).required(),
    amount: Joi.number().positive().precision(2).required(),
    pagination: {
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10)
    }
};

/**
 * Authentication Schemas
 */
const authSchemas = {
    register: Joi.object({
        name: commonRules.name,
        email: commonRules.email,
        password: commonRules.password,
        phone: commonRules.phone,
        aadhaar: commonRules.aadhaar,
        address: commonRules.address,
        pincode: commonRules.pincode,
        role: Joi.string().valid('citizen', 'official', 'admin').default('citizen')
    }),

    login: Joi.object({
        email: commonRules.email,
        password: commonRules.password,
        rememberMe: Joi.boolean().default(false)
    }),

    changePassword: Joi.object({
        currentPassword: commonRules.password,
        newPassword: commonRules.password,
        confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    }),

    resetPassword: Joi.object({
        email: commonRules.email,
        token: Joi.string().required(),
        newPassword: commonRules.password,
        confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    })
};

/**
 * Citizen Schemas
 */
const citizenSchemas = {
    update: Joi.object({
        name: Joi.string().min(2).max(100),
        phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
        address: commonRules.address,
        pincode: commonRules.pincode,
        emergencyContact: Joi.object({
            name: Joi.string().min(2).max(100).required(),
            phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
            relationship: Joi.string().min(2).max(50).required()
        })
    }).min(1),

    search: Joi.object({
        query: Joi.string().min(1).max(100),
        aadhaar: Joi.string().pattern(/^\d{4}-?\d{4}-?\d{4}$/),
        email: Joi.string().email(),
        phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
        ...commonRules.pagination
    }).or('query', 'aadhaar', 'email', 'phone')
};

/**
 * Document Schemas
 */
const documentSchemas = {
    upload: Joi.object({
        title: Joi.string().min(1).max(200).required(),
        type: Joi.string().valid(
            'birth_certificate',
            'death_certificate', 
            'marriage_certificate',
            'domicile_certificate',
            'income_certificate',
            'caste_certificate',
            'disability_certificate',
            'age_certificate',
            'character_certificate',
            'residence_certificate'
        ).required(),
        description: Joi.string().max(1000),
        category: Joi.string().valid('personal', 'educational', 'professional', 'legal').default('personal'),
        isPublic: Joi.boolean().default(false),
        metadata: Joi.object().max(10) // Additional metadata fields
    }),

    update: Joi.object({
        title: Joi.string().min(1).max(200),
        description: Joi.string().max(1000),
        category: Joi.string().valid('personal', 'educational', 'professional', 'legal'),
        isPublic: Joi.boolean(),
        metadata: Joi.object().max(10)
    }).min(1),

    search: Joi.object({
        query: Joi.string().min(1).max(100),
        type: Joi.string().valid(
            'birth_certificate', 'death_certificate', 'marriage_certificate',
            'domicile_certificate', 'income_certificate', 'caste_certificate',
            'disability_certificate', 'age_certificate', 'character_certificate',
            'residence_certificate'
        ),
        category: Joi.string().valid('personal', 'educational', 'professional', 'legal'),
        citizenId: commonRules.id,
        ...commonRules.pagination
    })
};

/**
 * Grievance Schemas
 */
const grievanceSchemas = {
    submit: Joi.object({
        title: Joi.string().min(5).max(200).required(),
        description: Joi.string().min(20).max(2000).required(),
        category: Joi.string().valid(
            'public_services',
            'corruption',
            'infrastructure',
            'healthcare',
            'education',
            'transport',
            'utilities',
            'law_order',
            'environment',
            'other'
        ).required(),
        priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
        department: Joi.string().min(2).max(100),
        location: Joi.object({
            address: commonRules.address,
            pincode: commonRules.pincode,
            coordinates: Joi.object({
                lat: Joi.number().min(-90).max(90),
                lng: Joi.number().min(-180).max(180)
            })
        }),
        isAnonymous: Joi.boolean().default(false),
        attachments: Joi.array().items(Joi.string()).max(5)
    }),

    update: Joi.object({
        title: Joi.string().min(5).max(200),
        description: Joi.string().min(20).max(2000),
        priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
        department: Joi.string().min(2).max(100),
        status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed', 'rejected')
    }).min(1),

    response: Joi.object({
        message: Joi.string().min(10).max(1000).required(),
        status: Joi.string().valid('acknowledged', 'in_progress', 'resolved', 'requires_info').required(),
        attachments: Joi.array().items(Joi.string()).max(3),
        estimatedResolution: Joi.date().greater('now')
    })
};

/**
 * Payment Schemas
 */
const paymentSchemas = {
    createOrder: Joi.object({
        serviceType: Joi.string().valid(
            'birth_certificate', 'death_certificate', 'marriage_certificate',
            'domicile_certificate', 'income_certificate', 'caste_certificate',
            'disability_certificate', 'age_certificate', 'character_certificate',
            'residence_certificate', 'business_license', 'noc_fire', 'noc_pollution',
            'trade_license', 'other'
        ).required(),
        amount: commonRules.amount,
        citizenId: commonRules.id,
        description: Joi.string().max(500),
        metadata: Joi.object().max(10)
    }),

    verify: Joi.object({
        razorpay_order_id: Joi.string().required(),
        razorpay_payment_id: Joi.string().required(),
        razorpay_signature: Joi.string().required()
    }),

    refund: Joi.object({
        paymentId: Joi.string().required(),
        amount: Joi.number().positive().precision(2),
        reason: Joi.string().min(10).max(500).required()
    })
};

/**
 * Web3 Schemas  
 */
const web3Schemas = {
    registerCitizen: Joi.object({
        name: commonRules.name,
        aadhaar: commonRules.aadhaar,
        phone: commonRules.phone,
        walletAddress: commonRules.walletAddress,
        signature: Joi.string().required()
    }),

    storeDocument: Joi.object({
        documentHash: commonRules.documentHash,
        documentType: Joi.string().required(),
        citizenAddress: commonRules.walletAddress,
        signerAddress: commonRules.walletAddress
    }),

    submitGrievance: Joi.object({
        title: Joi.string().min(5).max(200).required(),
        description: Joi.string().min(20).max(2000).required(),
        category: Joi.string().valid(
            'public_services', 'corruption', 'infrastructure', 'healthcare',
            'education', 'transport', 'utilities', 'law_order', 'environment', 'other'
        ).required(),
        signerAddress: commonRules.walletAddress
    }),

    validateSignature: Joi.object({
        message: Joi.string().required(),
        signature: Joi.string().required(),
        address: commonRules.walletAddress
    }),

    walletConnect: Joi.object({
        address: commonRules.walletAddress,
        chainId: Joi.string().required(),
        signature: Joi.string()
    })
};

/**
 * QR Code Schemas
 */
const qrSchemas = {
    generate: Joi.object({
        type: Joi.string().valid('document', 'citizen', 'grievance').required(),
        data: Joi.object().required(),
        options: Joi.object({
            size: Joi.number().integer().min(100).max(1000).default(300),
            format: Joi.string().valid('png', 'svg', 'pdf').default('png'),
            errorLevel: Joi.string().valid('L', 'M', 'Q', 'H').default('M')
        }).default({})
    }),

    verify: Joi.object({
        qrData: Joi.string().required(),
        signature: Joi.string().required()
    })
};

/**
 * AI Analysis Schemas
 */
const aiSchemas = {
    analyze: Joi.object({
        text: Joi.string().min(1).max(10000).required(),
        type: Joi.string().valid('grievance', 'document', 'feedback').required(),
        language: Joi.string().valid('en', 'hi', 'auto').default('auto')
    }),

    ocr: Joi.object({
        imageData: Joi.string().required(), // Base64 encoded image
        documentType: Joi.string().valid(
            'aadhaar', 'pan', 'voter_id', 'passport', 'driving_license', 'other'
        ).default('other'),
        extractFields: Joi.array().items(Joi.string()).default([])
    })
};

module.exports = {
    auth: authSchemas,
    citizen: citizenSchemas,
    document: documentSchemas,
    grievance: grievanceSchemas,
    payment: paymentSchemas,
    web3: web3Schemas,
    qr: qrSchemas,
    ai: aiSchemas,
    common: commonRules
};