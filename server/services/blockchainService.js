const { ethers } = require('ethers');
require('dotenv').config();

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contracts = {};
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('Initializing Blockchain Service...');
      
      // Initialize provider
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Test connection
      await this.provider.getNetwork();
      console.log('✅ Connected to blockchain network');
      
      // Initialize signer if private key is provided
      if (process.env.PRIVATE_KEY) {
        this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        console.log('✅ Wallet connected:', this.signer.address);
      }
      
      // Load contract artifacts and initialize contracts
      await this.loadContracts();
      
      this.isInitialized = true;
      console.log('✅ Blockchain service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error.message);
      throw error;
    }
  }

  async loadContracts() {
    try {
      // Load contract ABIs from artifacts
      const path = require('path');
      
      const contracts = {
        CitizenRegistry: {
          address: process.env.CITIZEN_REGISTRY_ADDRESS,
          artifactPath: path.join(__dirname, '../../artifacts/contracts/CitizenRegistry.sol/CitizenRegistry.json')
        },
        DocumentRegistry: {
          address: process.env.DOCUMENT_REGISTRY_ADDRESS,
          artifactPath: path.join(__dirname, '../../artifacts/contracts/DocumentRegistry.sol/DocumentRegistry.json')
        },
        GrievanceSystem: {
          address: process.env.GRIEVANCE_SYSTEM_ADDRESS,
          artifactPath: path.join(__dirname, '../../artifacts/contracts/GrievanceSystem.sol/GrievanceSystem.json')
        }
      };

      // Initialize contract instances if addresses are available
      for (const [name, config] of Object.entries(contracts)) {
        if (config.address && require('fs').existsSync(config.artifactPath)) {
          const artifact = require(config.artifactPath);
          this.contracts[name] = new ethers.Contract(
            config.address,
            artifact.abi,
            this.signer || this.provider
          );
          console.log(`✅ ${name} contract loaded at ${config.address}`);
        } else {
          console.log(`⚠️ ${name} contract not configured (missing address or artifact)`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load contracts:', error.message);
      // Don't throw here, allow service to work with limited functionality
    }
  }

  // Citizen Registry Methods
  async registerCitizen(address, name, aadharHash, email, phoneHash) {
    this.ensureInitialized();
    
    if (!this.contracts.CitizenRegistry) {
      throw new Error('CitizenRegistry contract not available');
    }

    try {
      const tx = await this.contracts.CitizenRegistry.registerCitizen(
        name,
        aadharHash,
        email,
        phoneHash
      );
      
      const receipt = await tx.wait();
      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      throw new Error(`Failed to register citizen: ${error.message}`);
    }
  }

  async getCitizen(address) {
    this.ensureInitialized();
    
    if (!this.contracts.CitizenRegistry) {
      throw new Error('CitizenRegistry contract not available');
    }

    try {
      const citizen = await this.contracts.CitizenRegistry.getCitizen(address);
      return {
        name: citizen.name,
        email: citizen.email,
        isVerified: citizen.isVerified,
        isActive: citizen.isActive,
        registrationDate: new Date(citizen.registrationDate * 1000),
        verificationDate: citizen.verificationDate > 0 ? new Date(citizen.verificationDate * 1000) : null,
      };
    } catch (error) {
      throw new Error(`Failed to get citizen: ${error.message}`);
    }
  }

  // Document Registry Methods
  async uploadDocument(citizenAddress, documentType, ipfsHash, metadataHash, expiryTimestamp) {
    this.ensureInitialized();
    
    if (!this.contracts.DocumentRegistry) {
      throw new Error('DocumentRegistry contract not available');
    }

    try {
      const tx = await this.contracts.DocumentRegistry.uploadDocument(
        this.getDocumentTypeEnum(documentType),
        ipfsHash,
        metadataHash,
        expiryTimestamp
      );
      
      const receipt = await tx.wait();
      
      // Extract document ID from event logs
      const event = receipt.logs.find(log => log.fragment?.name === 'DocumentUploaded');
      const documentId = event ? event.args[0] : null;
      
      return {
        documentId,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      throw new Error(`Failed to upload document: ${error.message}`);
    }
  }

  async getDocument(documentId) {
    this.ensureInitialized();
    
    if (!this.contracts.DocumentRegistry) {
      throw new Error('DocumentRegistry contract not available');
    }

    try {
      const doc = await this.contracts.DocumentRegistry.getDocument(documentId);
      return {
        owner: doc.owner,
        issuer: doc.issuer,
        documentType: this.getDocumentTypeString(doc.docType),
        ipfsHash: doc.ipfsHash,
        status: this.getDocumentStatusString(doc.status),
        issuedDate: doc.issuedDate > 0 ? new Date(doc.issuedDate * 1000) : null,
        expiryDate: doc.expiryDate > 0 ? new Date(doc.expiryDate * 1000) : null,
        isActive: doc.isActive,
      };
    } catch (error) {
      throw new Error(`Failed to get document: ${error.message}`);
    }
  }

  async getCitizenDocuments(citizenAddress) {
    this.ensureInitialized();
    
    if (!this.contracts.DocumentRegistry) {
      throw new Error('DocumentRegistry contract not available');
    }

    try {
      const documentIds = await this.contracts.DocumentRegistry.getCitizenDocuments(citizenAddress);
      return documentIds;
    } catch (error) {
      throw new Error(`Failed to get citizen documents: ${error.message}`);
    }
  }

  // Utility methods
  getDocumentTypeEnum(typeString) {
    const types = {
      'aadhar': 0,
      'pan': 1,
      'voter_id': 2,
      'driving_license': 3,
      'passport': 4,
      'birth_certificate': 5,
      'other': 6,
    };
    return types[typeString] || 6; // Default to 'other'
  }

  getDocumentTypeString(typeEnum) {
    const types = ['aadhar', 'pan', 'voter_id', 'driving_license', 'passport', 'birth_certificate', 'other'];
    return types[typeEnum] || 'other';
  }

  getDocumentStatusString(statusEnum) {
    const statuses = ['pending', 'verified', 'rejected', 'expired'];
    return statuses[statusEnum] || 'pending';
  }

  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized. Call initialize() first.');
    }
  }

  // Health check method
  async getNetworkInfo() {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      
      return {
        chainId: network.chainId.toString(),
        name: network.name,
        currentBlock: blockNumber,
        isConnected: true,
      };
    } catch (error) {
      return {
        isConnected: false,
        error: error.message,
      };
    }
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();

module.exports = blockchainService;
