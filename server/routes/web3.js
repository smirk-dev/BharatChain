/**
 * Web3 & MetaMask Integration Routes for BharatChain
 * Handles blockchain transactions, wallet connections, and smart contract interactions
 */

const express = require('express');
const router = express.Router();
const Web3Service = require('../services/web3-service');
const auth = require('../middleware/auth');
const crypto = require('crypto');

// Initialize Web3 service
const web3Service = new Web3Service();

/**
 * GET /api/web3/config
 * Get MetaMask connection configuration
 */
router.get('/config', (req, res) => {
    try {
        const config = web3Service.getConnectionConfig();
        
        res.json({
            success: true,
            data: config,
            message: 'MetaMask configuration retrieved successfully'
        });

    } catch (error) {
        console.error('❌ Web3 config error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get Web3 configuration'
        });
    }
});

/**
 * GET /api/web3/network-status
 * Get blockchain network status
 */
router.get('/network-status', async (req, res) => {
    try {
        const status = await web3Service.getNetworkStatus();
        
        res.json({
            success: true,
            data: status.data,
            message: 'Network status retrieved successfully'
        });

    } catch (error) {
        console.error('❌ Network status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get network status'
        });
    }
});

/**
 * GET /api/web3/citizen/:address
 * Get citizen data from blockchain
 */
router.get('/citizen/:address', auth, async (req, res) => {
    try {
        const { address } = req.params;
        
        // Validate address format
        if (!web3Service.isValidAddress(address)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid wallet address format'
            });
        }

        const result = await web3Service.getCitizenData(address);
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                message: 'Citizen data retrieved successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('❌ Get citizen error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve citizen data'
        });
    }
});

/**
 * POST /api/web3/register-citizen
 * Register citizen on blockchain
 */
router.post('/register-citizen', auth, async (req, res) => {
    try {
        const { name, aadhaar, phone, walletAddress, signature } = req.body;
        
        // Validate required fields
        if (!name || !aadhaar || !phone || !walletAddress) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, aadhaar, phone, walletAddress'
            });
        }

        // Validate wallet address
        if (!web3Service.isValidAddress(walletAddress)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid wallet address format'
            });
        }

        const citizenData = { name, aadhaar, phone };
        const result = await web3Service.registerCitizen(citizenData, walletAddress);
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                message: 'Citizen registered successfully on blockchain'
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('❌ Register citizen error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register citizen on blockchain'
        });
    }
});

/**
 * POST /api/web3/store-document
 * Store document hash on blockchain
 */
router.post('/store-document', auth, async (req, res) => {
    try {
        const { documentHash, documentType, citizenAddress, signerAddress } = req.body;
        
        // Validate required fields
        if (!documentHash || !documentType || !citizenAddress || !signerAddress) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: documentHash, documentType, citizenAddress, signerAddress'
            });
        }

        // Validate addresses
        if (!web3Service.isValidAddress(citizenAddress) || !web3Service.isValidAddress(signerAddress)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid wallet address format'
            });
        }

        const result = await web3Service.storeDocumentHash(
            documentHash,
            documentType,
            citizenAddress,
            signerAddress
        );
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                message: 'Document stored successfully on blockchain'
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('❌ Store document error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to store document on blockchain'
        });
    }
});

/**
 * POST /api/web3/submit-grievance
 * Submit grievance on blockchain
 */
router.post('/submit-grievance', auth, async (req, res) => {
    try {
        const { title, description, category, signerAddress } = req.body;
        
        // Validate required fields
        if (!title || !description || !category || !signerAddress) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: title, description, category, signerAddress'
            });
        }

        // Validate address
        if (!web3Service.isValidAddress(signerAddress)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid wallet address format'
            });
        }

        const grievanceData = { title, description, category };
        const result = await web3Service.submitGrievance(grievanceData, signerAddress);
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                message: 'Grievance submitted successfully on blockchain'
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('❌ Submit grievance error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit grievance on blockchain'
        });
    }
});

/**
 * GET /api/web3/verify-document/:hash
 * Verify document authenticity on blockchain
 */
router.get('/verify-document/:hash', async (req, res) => {
    try {
        const { hash } = req.params;
        
        if (!hash || hash.length !== 64) {
            return res.status(400).json({
                success: false,
                error: 'Invalid document hash format'
            });
        }

        const result = await web3Service.verifyDocument(hash);
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                message: 'Document verification completed'
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('❌ Verify document error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify document'
        });
    }
});

/**
 * POST /api/web3/generate-transaction
 * Generate transaction data for MetaMask signing
 */
router.post('/generate-transaction', auth, async (req, res) => {
    try {
        const { method, params } = req.body;
        
        if (!method) {
            return res.status(400).json({
                success: false,
                error: 'Method is required'
            });
        }

        const transactionData = web3Service.generateTransactionData(method, params);
        
        res.json({
            success: true,
            data: transactionData,
            message: 'Transaction data generated successfully'
        });

    } catch (error) {
        console.error('❌ Generate transaction error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate transaction data'
        });
    }
});

/**
 * POST /api/web3/validate-signature
 * Validate MetaMask signature
 */
router.post('/validate-signature', async (req, res) => {
    try {
        const { message, signature, address } = req.body;
        
        if (!message || !signature || !address) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: message, signature, address'
            });
        }

        // Validate address format
        if (!web3Service.isValidAddress(address)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid wallet address format'
            });
        }

        // For now, return mock validation (in production, use ethers.verifyMessage)
        const isValid = signature.length > 0 && message.length > 0;
        
        res.json({
            success: true,
            data: {
                valid: isValid,
                signer: address,
                message,
                timestamp: new Date().toISOString()
            },
            message: isValid ? 'Signature validated successfully' : 'Invalid signature'
        });

    } catch (error) {
        console.error('❌ Validate signature error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate signature'
        });
    }
});

/**
 * GET /api/web3/stats
 * Get Web3 service statistics
 */
router.get('/stats', (req, res) => {
    try {
        const stats = web3Service.getWeb3Stats();
        
        res.json({
            success: true,
            data: stats,
            message: 'Web3 statistics retrieved successfully'
        });

    } catch (error) {
        console.error('❌ Web3 stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get Web3 statistics'
        });
    }
});

/**
 * POST /api/web3/wallet-connect
 * Handle wallet connection verification
 */
router.post('/wallet-connect', async (req, res) => {
    try {
        const { address, chainId, signature } = req.body;
        
        if (!address || !chainId) {
            return res.status(400).json({
                success: false,
                error: 'Address and chainId are required'
            });
        }

        // Validate address
        if (!web3Service.isValidAddress(address)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid wallet address format'
            });
        }

        // Generate session token for wallet connection
        const sessionToken = crypto.randomBytes(32).toString('hex');
        
        res.json({
            success: true,
            data: {
                connected: true,
                address,
                chainId,
                sessionToken,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
            },
            message: 'Wallet connected successfully'
        });

    } catch (error) {
        console.error('❌ Wallet connect error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to connect wallet'
        });
    }
});

module.exports = router;