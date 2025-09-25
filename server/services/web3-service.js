/**
 * Web3 Service for BharatChain - MetaMask Integration
 * Handles blockchain interactions, wallet connections, and smart contract calls
 */

const { ethers } = require('ethers');
const config = require('../../config/env-config');

class Web3Service {
    constructor() {
        this.provider = null;
        this.contracts = {};
        this.networkConfig = {
            chainId: '0x7A69', // 31337 - Hardhat localhost
            chainName: 'Hardhat Local',
            nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18
            },
            rpcUrls: ['http://127.0.0.1:8545'],
            blockExplorerUrls: ['http://localhost:8545']
        };
        
        // Initialize provider
        this.initializeProvider();
        
        console.log('🔗 Web3Service initialized for BharatChain');
    }

    /**
     * Initialize blockchain provider
     */
    initializeProvider() {
        try {
            // Use Hardhat local provider with quick timeout
            this.provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545', {
                pollingInterval: 30000, // 30 seconds
                timeout: 5000 // 5 seconds timeout
            });
            
            // Load contract ABIs and addresses
            this.loadContracts();
            
        } catch (error) {
            console.warn('⚠️ Blockchain provider not available, using mock mode');
            this.provider = null;
        }
    }

    /**
     * Load deployed smart contracts
     */
    loadContracts() {
        try {
            const fs = require('fs');
            const path = require('path');
            
            // Load contract artifacts
            const citizenRegistryArtifact = JSON.parse(
                fs.readFileSync(path.join(__dirname, '../../artifacts/contracts/CitizenRegistry.sol/CitizenRegistry.json'), 'utf8')
            );
            
            const documentRegistryArtifact = JSON.parse(
                fs.readFileSync(path.join(__dirname, '../../artifacts/contracts/DocumentRegistry.sol/DocumentRegistry.json'), 'utf8')
            );
            
            const grievanceSystemArtifact = JSON.parse(
                fs.readFileSync(path.join(__dirname, '../../artifacts/contracts/GrievanceSystem.sol/GrievanceSystem.json'), 'utf8')
            );

            // Load deployment addresses (mock for now)
            const deployments = {
                CitizenRegistry: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
                DocumentRegistry: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
                GrievanceSystem: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
            };

            // Initialize contract instances
            if (this.provider) {
                this.contracts.CitizenRegistry = new ethers.Contract(
                    deployments.CitizenRegistry,
                    citizenRegistryArtifact.abi,
                    this.provider
                );

                this.contracts.DocumentRegistry = new ethers.Contract(
                    deployments.DocumentRegistry,
                    documentRegistryArtifact.abi,
                    this.provider
                );

                this.contracts.GrievanceSystem = new ethers.Contract(
                    deployments.GrievanceSystem,
                    grievanceSystemArtifact.abi,
                    this.provider
                );
            }

        } catch (error) {
            console.warn('⚠️ Could not load contract artifacts:', error.message);
        }
    }

    /**
     * Generate MetaMask connection parameters
     */
    getConnectionConfig() {
        return {
            networkConfig: this.networkConfig,
            requiredPermissions: ['eth_requestAccounts'],
            supportedChainIds: ['0x7A69', '0x1'], // Hardhat + Mainnet
            contractAddresses: {
                CitizenRegistry: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
                DocumentRegistry: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
                GrievanceSystem: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
            }
        };
    }

    /**
     * Validate wallet address format
     */
    isValidAddress(address) {
        try {
            return ethers.isAddress(address);
        } catch {
            return false;
        }
    }

    /**
     * Get citizen data from blockchain
     */
    async getCitizenData(walletAddress) {
        try {
            if (!this.contracts.CitizenRegistry) {
                return this.getMockCitizenData(walletAddress);
            }

            const citizenData = await this.contracts.CitizenRegistry.getCitizen(walletAddress);
            
            return {
                success: true,
                data: {
                    walletAddress,
                    isRegistered: citizenData.isRegistered,
                    name: citizenData.name,
                    aadhaar: citizenData.aadhaar,
                    phone: citizenData.phone,
                    registrationDate: new Date(citizenData.registrationDate * 1000).toISOString()
                }
            };

        } catch (error) {
            return {
                success: false,
                error: `Failed to fetch citizen data: ${error.message}`
            };
        }
    }

    /**
     * Register citizen on blockchain
     */
    async registerCitizen(citizenData, signerAddress) {
        try {
            if (!this.contracts.CitizenRegistry) {
                return this.getMockTransactionResult('registerCitizen', citizenData);
            }

            const signer = await this.provider.getSigner(signerAddress);
            const contractWithSigner = this.contracts.CitizenRegistry.connect(signer);

            const tx = await contractWithSigner.registerCitizen(
                citizenData.name,
                citizenData.aadhaar,
                citizenData.phone
            );

            await tx.wait();

            return {
                success: true,
                data: {
                    transactionHash: tx.hash,
                    blockNumber: tx.blockNumber,
                    gasUsed: tx.gasLimit.toString(),
                    citizen: citizenData
                }
            };

        } catch (error) {
            return {
                success: false,
                error: `Failed to register citizen: ${error.message}`
            };
        }
    }

    /**
     * Store document hash on blockchain
     */
    async storeDocumentHash(documentHash, documentType, citizenAddress, signerAddress) {
        try {
            if (!this.contracts.DocumentRegistry) {
                return this.getMockTransactionResult('storeDocument', { documentHash, documentType });
            }

            const signer = await this.provider.getSigner(signerAddress);
            const contractWithSigner = this.contracts.DocumentRegistry.connect(signer);

            const tx = await contractWithSigner.storeDocument(
                documentHash,
                documentType,
                citizenAddress
            );

            await tx.wait();

            return {
                success: true,
                data: {
                    transactionHash: tx.hash,
                    blockNumber: tx.blockNumber,
                    documentHash,
                    documentType,
                    owner: citizenAddress
                }
            };

        } catch (error) {
            return {
                success: false,
                error: `Failed to store document: ${error.message}`
            };
        }
    }

    /**
     * Submit grievance on blockchain
     */
    async submitGrievance(grievanceData, signerAddress) {
        try {
            if (!this.contracts.GrievanceSystem) {
                return this.getMockTransactionResult('submitGrievance', grievanceData);
            }

            const signer = await this.provider.getSigner(signerAddress);
            const contractWithSigner = this.contracts.GrievanceSystem.connect(signer);

            const tx = await contractWithSigner.submitGrievance(
                grievanceData.title,
                grievanceData.description,
                grievanceData.category
            );

            await tx.wait();

            return {
                success: true,
                data: {
                    transactionHash: tx.hash,
                    blockNumber: tx.blockNumber,
                    grievanceId: tx.logs[0]?.args?.grievanceId || Date.now(),
                    submitter: signerAddress
                }
            };

        } catch (error) {
            return {
                success: false,
                error: `Failed to submit grievance: ${error.message}`
            };
        }
    }

    /**
     * Verify document authenticity
     */
    async verifyDocument(documentHash) {
        try {
            if (!this.contracts.DocumentRegistry) {
                return this.getMockVerificationResult(documentHash);
            }

            const documentData = await this.contracts.DocumentRegistry.getDocument(documentHash);

            return {
                success: true,
                data: {
                    exists: documentData.exists,
                    owner: documentData.owner,
                    documentType: documentData.documentType,
                    timestamp: new Date(documentData.timestamp * 1000).toISOString(),
                    verified: documentData.exists
                }
            };

        } catch (error) {
            return {
                success: false,
                error: `Failed to verify document: ${error.message}`
            };
        }
    }

    /**
     * Get blockchain network status
     */
    async getNetworkStatus() {
        try {
            if (!this.provider) {
                return {
                    success: true,
                    data: {
                        connected: false,
                        network: 'Mock Network',
                        blockNumber: 12345,
                        chainId: 31337,
                        gasPrice: '20000000000',
                        mockMode: true
                    }
                };
            }

            // Quick timeout for network requests
            const networkPromise = Promise.race([
                this.provider.getNetwork(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout')), 3000))
            ]);

            const blockPromise = Promise.race([
                this.provider.getBlockNumber(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Block timeout')), 3000))
            ]);

            const [network, blockNumber] = await Promise.all([networkPromise, blockPromise]);
            const gasPrice = await this.provider.getFeeData();

            return {
                success: true,
                data: {
                    connected: true,
                    network: network.name,
                    chainId: Number(network.chainId),
                    blockNumber,
                    gasPrice: gasPrice.gasPrice?.toString() || '0',
                    mockMode: false
                }
            };

        } catch (error) {
            // Return mock data if blockchain is not available
            return {
                success: true,
                data: {
                    connected: false,
                    network: 'Mock Network (Blockchain Unavailable)',
                    blockNumber: 12345,
                    chainId: 31337,
                    gasPrice: '20000000000',
                    mockMode: true,
                    error: error.message
                }
            };
        }
    }

    /**
     * Mock citizen data for testing
     */
    getMockCitizenData(walletAddress) {
        return {
            success: true,
            data: {
                walletAddress,
                isRegistered: true,
                name: 'Mock Citizen',
                aadhaar: '1234-5678-9012',
                phone: '+91-9876543210',
                registrationDate: new Date().toISOString(),
                mockData: true
            }
        };
    }

    /**
     * Mock transaction result for testing
     */
    getMockTransactionResult(operation, data) {
        return {
            success: true,
            data: {
                transactionHash: `0x${Date.now().toString(16)}mock`,
                blockNumber: Math.floor(Math.random() * 1000000),
                gasUsed: '21000',
                operation,
                input: data,
                mockTransaction: true
            }
        };
    }

    /**
     * Mock verification result for testing
     */
    getMockVerificationResult(documentHash) {
        return {
            success: true,
            data: {
                exists: true,
                owner: '0x' + '1'.repeat(40),
                documentType: 'income_certificate',
                timestamp: new Date().toISOString(),
                verified: true,
                mockVerification: true
            }
        };
    }

    /**
     * Generate transaction data for MetaMask
     */
    generateTransactionData(method, params) {
        return {
            to: this.contracts[method]?.address || '0x' + '0'.repeat(40),
            data: '0x' + Buffer.from(JSON.stringify({ method, params })).toString('hex'),
            value: '0x0',
            gas: '0x5208' // 21000 gas
        };
    }

    /**
     * Get service statistics
     */
    getWeb3Stats() {
        return {
            service: 'BharatChain Web3 Service',
            provider: this.provider ? 'Ethers.js + Hardhat' : 'Mock Provider',
            contracts_loaded: Object.keys(this.contracts).length,
            network: this.networkConfig.chainName,
            chain_id: this.networkConfig.chainId,
            supported_operations: [
                'Citizen Registration',
                'Document Storage',
                'Grievance Submission',
                'Document Verification',
                'Network Status'
            ]
        };
    }
}

module.exports = Web3Service;