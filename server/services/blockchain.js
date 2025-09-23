const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contracts = {};
    this.isInitialized = false;
    this.networkConfig = {
      localhost: {
        rpcUrl: 'http://127.0.0.1:8545',
        chainId: 1337
      },
      mumbai: {
        rpcUrl: process.env.MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
        chainId: 80001
      },
      polygon: {
        rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
        chainId: 137
      }
    };
  }

  /**
   * Initialize blockchain connection
   * @param {string} network - Network to connect to (localhost, mumbai, polygon)
   * @param {string} privateKey - Private key for signing transactions (optional)
   */
  async initialize(network = 'localhost', privateKey = null) {
    try {
      const config = this.networkConfig[network];
      if (!config) {
        throw new Error(`Unknown network: ${network}`);
      }

      console.log(`🔗 Attempting to connect to ${network} blockchain...`);

      // Setup provider
      this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
      
      // Test connection with timeout
      const connectionPromise = this.provider.getNetwork();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      );
      
      const networkInfo = await Promise.race([connectionPromise, timeoutPromise]);
      console.log(`✅ Connected to ${network} (Chain ID: ${networkInfo.chainId})`);

      // Setup signer if private key provided
      if (privateKey) {
        this.signer = new ethers.Wallet(privateKey, this.provider);
        console.log(`✅ Signer initialized: ${this.signer.address}`);
      } else {
        console.log(`⚠️ Private key not provided, blockchain will run in read-only mode.`);
      }

      // Load contract ABIs and initialize contracts
      await this.loadContracts();

      this.isInitialized = true;
      console.log('✅ Blockchain service initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error);
      console.log('🔄 Blockchain will run in offline mode. Some features may be limited.');
      
      // Set offline mode
      this.isInitialized = false;
      this.provider = null;
      this.signer = null;
      this.contracts = {};
      
      // Don't throw error, allow backend to continue without blockchain
      console.log('❌ Blockchain initialization failed:', error.message);
    }
  }

  /**
   * Load smart contracts from artifacts
   */
  async loadContracts() {
    try {
      const artifactsPath = path.join(__dirname, '../../artifacts/contracts');
      
      // Contract configurations
      const contractConfigs = [
        {
          name: 'CitizenRegistry',
          fileName: 'CitizenRegistry.sol/CitizenRegistry.json',
          address: process.env.CITIZEN_REGISTRY_ADDRESS
        },
        {
          name: 'DocumentRegistry',
          fileName: 'DocumentRegistry.sol/DocumentRegistry.json',
          address: process.env.DOCUMENT_REGISTRY_ADDRESS
        },
        {
          name: 'GrievanceSystem',
          fileName: 'GrievanceSystem.sol/GrievanceSystem.json',
          address: process.env.GRIEVANCE_SYSTEM_ADDRESS
        }
      ];

      for (const config of contractConfigs) {
        const artifactPath = path.join(artifactsPath, config.fileName);
        
        if (fs.existsSync(artifactPath)) {
          const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
          
          if (config.address) {
            // Create contract instance with address
            this.contracts[config.name] = new ethers.Contract(
              config.address,
              artifact.abi,
              this.signer || this.provider
            );
            console.log(`✅ Loaded ${config.name} contract at ${config.address}`);
          } else {
            // Store ABI for later deployment
            this.contracts[config.name] = {
              abi: artifact.abi,
              bytecode: artifact.bytecode
            };
            console.log(`⚠️ ${config.name} address not found in environment variables`);
          }
        } else {
          console.warn(`⚠️ Contract artifact not found: ${artifactPath}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load contracts:', error);
      throw error;
    }
  }

  /**
   * Deploy a contract
   * @param {string} contractName - Name of the contract to deploy
   * @param {Array} constructorArgs - Constructor arguments
   * @returns {Object} Deployed contract instance and transaction receipt
   */
  async deployContract(contractName, constructorArgs = []) {
    if (!this.signer) {
      throw new Error('Signer required for contract deployment');
    }

    const contractData = this.contracts[contractName];
    if (!contractData || !contractData.abi || !contractData.bytecode) {
      throw new Error(`Contract ${contractName} not found or missing ABI/bytecode`);
    }

    try {
      const contractFactory = new ethers.ContractFactory(
        contractData.abi,
        contractData.bytecode,
        this.signer
      );

      console.log(`🚀 Deploying ${contractName}...`);
      const contract = await contractFactory.deploy(...constructorArgs);
      
      console.log(`⏳ Waiting for deployment confirmation...`);
      const receipt = await contract.waitForDeployment();
      
      const address = await contract.getAddress();
      console.log(`✅ ${contractName} deployed at: ${address}`);

      // Update contract instance
      this.contracts[contractName] = contract;

      return {
        contract,
        address,
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error(`❌ Failed to deploy ${contractName}:`, error);
      throw error;
    }
  }

  /**
   * Check if blockchain is available
   */
  isBlockchainAvailable() {
    return this.isInitialized && this.provider !== null;
  }

  /**
   * Get contract instance with availability check
   * @param {string} contractName - Name of the contract
   * @returns {ethers.Contract} Contract instance
   */
  getContract(contractName) {
    if (!this.isBlockchainAvailable()) {
      throw new Error('Blockchain service not available. Running in offline mode.');
    }
    
    const contract = this.contracts[contractName];
    if (!contract || typeof contract.interface === 'undefined') {
      throw new Error(`Contract ${contractName} not initialized or not deployed`);
    }
    return contract;
  }

  /**
   * Citizen Registry Operations
   */
  
  async registerCitizen(aadharHash, name, email, phone) {
    try {
      const contract = this.getContract('CitizenRegistry');
      
      console.log(`📝 Registering citizen: ${name}`);
      const tx = await contract.registerCitizen(aadharHash, name, email, phone);
      
      console.log(`⏳ Transaction submitted: ${tx.hash}`);
      const receipt = await tx.wait();
      
      console.log(`✅ Citizen registered successfully`);
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('❌ Failed to register citizen:', error);
      throw this.parseContractError(error);
    }
  }

  async getCitizen(address) {
    try {
      const contract = this.getContract('CitizenRegistry');
      const citizen = await contract.getCitizen(address);
      
      return {
        aadharHash: citizen.aadharHash,
        name: citizen.name,
        email: citizen.email,
        phone: citizen.phone,
        isVerified: citizen.isVerified,
        registrationDate: new Date(Number(citizen.registrationDate) * 1000),
        walletAddress: citizen.walletAddress
      };
    } catch (error) {
      console.error('❌ Failed to get citizen:', error);
      throw this.parseContractError(error);
    }
  }

  async verifyCitizen(citizenAddress) {
    try {
      const contract = this.getContract('CitizenRegistry');
      
      console.log(`✅ Verifying citizen: ${citizenAddress}`);
      const tx = await contract.verifyCitizen(citizenAddress);
      
      const receipt = await tx.wait();
      console.log(`✅ Citizen verified successfully`);
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('❌ Failed to verify citizen:', error);
      throw this.parseContractError(error);
    }
  }

  async isCitizenRegistered(address) {
    try {
      const contract = this.getContract('CitizenRegistry');
      return await contract.isCitizenRegistered(address);
    } catch (error) {
      console.error('❌ Failed to check citizen registration:', error);
      return false;
    }
  }

  /**
   * Document Registry Operations
   */
  
  async uploadDocument(documentHash, docType, metadata, expiryDate = 0) {
    try {
      const contract = this.getContract('DocumentRegistry');
      
      console.log(`📄 Uploading document: ${documentHash}`);
      const tx = await contract.uploadDocument(documentHash, docType, metadata, expiryDate);
      
      const receipt = await tx.wait();
      
      // Extract document ID from events
      const events = receipt.logs.map(log => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      }).filter(Boolean);
      
      const uploadEvent = events.find(event => event.name === 'DocumentUploaded');
      const documentId = uploadEvent ? uploadEvent.args.documentId.toString() : null;
      
      console.log(`✅ Document uploaded with ID: ${documentId}`);
      
      return {
        documentId,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('❌ Failed to upload document:', error);
      throw this.parseContractError(error);
    }
  }

  async getDocument(documentId) {
    try {
      const contract = this.getContract('DocumentRegistry');
      const doc = await contract.getDocument(documentId);
      
      return {
        id: doc.id.toString(),
        owner: doc.owner,
        documentHash: doc.documentHash,
        docType: Number(doc.docType),
        status: Number(doc.status),
        metadata: doc.metadata,
        uploadDate: new Date(Number(doc.uploadDate) * 1000),
        verificationDate: doc.verificationDate > 0 ? new Date(Number(doc.verificationDate) * 1000) : null,
        verifier: doc.verifier !== ethers.ZeroAddress ? doc.verifier : null,
        rejectionReason: doc.rejectionReason,
        expiryDate: doc.expiryDate > 0 ? new Date(Number(doc.expiryDate) * 1000) : null
      };
    } catch (error) {
      console.error('❌ Failed to get document:', error);
      throw this.parseContractError(error);
    }
  }

  async verifyDocument(documentId) {
    try {
      const contract = this.getContract('DocumentRegistry');
      
      console.log(`✅ Verifying document: ${documentId}`);
      const tx = await contract.verifyDocument(documentId);
      
      const receipt = await tx.wait();
      console.log(`✅ Document verified successfully`);
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('❌ Failed to verify document:', error);
      throw this.parseContractError(error);
    }
  }

  async getUserDocuments(userAddress) {
    try {
      const contract = this.getContract('DocumentRegistry');
      const documentIds = await contract.getUserDocuments(userAddress);
      
      return documentIds.map(id => id.toString());
    } catch (error) {
      console.error('❌ Failed to get user documents:', error);
      throw this.parseContractError(error);
    }
  }

  /**
   * Grievance System Operations
   */
  
  async submitGrievance(title, description, category, priority, location, attachments = []) {
    try {
      const contract = this.getContract('GrievanceSystem');
      
      console.log(`📢 Submitting grievance: ${title}`);
      const tx = await contract.submitGrievance(
        title, description, category, priority, location, attachments
      );
      
      const receipt = await tx.wait();
      
      // Extract grievance ID from events
      const events = receipt.logs.map(log => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      }).filter(Boolean);
      
      const submitEvent = events.find(event => event.name === 'GrievanceSubmitted');
      const grievanceId = submitEvent ? submitEvent.args.grievanceId.toString() : null;
      
      console.log(`✅ Grievance submitted with ID: ${grievanceId}`);
      
      return {
        grievanceId,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('❌ Failed to submit grievance:', error);
      throw this.parseContractError(error);
    }
  }

  async getGrievance(grievanceId) {
    try {
      const contract = this.getContract('GrievanceSystem');
      const grievance = await contract.getGrievance(grievanceId);
      
      return {
        id: grievance.id.toString(),
        citizen: grievance.citizen,
        title: grievance.title,
        description: grievance.description,
        category: Number(grievance.category),
        priority: Number(grievance.priority),
        status: Number(grievance.status),
        submitDate: new Date(Number(grievance.submitDate) * 1000),
        resolvedDate: grievance.resolvedDate > 0 ? new Date(Number(grievance.resolvedDate) * 1000) : null,
        assignedOfficer: grievance.assignedOfficer !== ethers.ZeroAddress ? grievance.assignedOfficer : null,
        resolution: grievance.resolution,
        satisfactionRating: Number(grievance.satisfactionRating),
        location: grievance.location,
        attachments: grievance.attachments
      };
    } catch (error) {
      console.error('❌ Failed to get grievance:', error);
      throw this.parseContractError(error);
    }
  }

  async assignGrievance(grievanceId, officerAddress) {
    try {
      const contract = this.getContract('GrievanceSystem');
      
      console.log(`👮 Assigning grievance ${grievanceId} to ${officerAddress}`);
      const tx = await contract.assignGrievance(grievanceId, officerAddress);
      
      const receipt = await tx.wait();
      console.log(`✅ Grievance assigned successfully`);
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('❌ Failed to assign grievance:', error);
      throw this.parseContractError(error);
    }
  }

  async resolveGrievance(grievanceId, resolution) {
    try {
      const contract = this.getContract('GrievanceSystem');
      
      console.log(`✅ Resolving grievance: ${grievanceId}`);
      const tx = await contract.resolveGrievance(grievanceId, resolution);
      
      const receipt = await tx.wait();
      console.log(`✅ Grievance resolved successfully`);
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('❌ Failed to resolve grievance:', error);
      throw this.parseContractError(error);
    }
  }

  async getCitizenGrievances(citizenAddress) {
    try {
      const contract = this.getContract('GrievanceSystem');
      const grievanceIds = await contract.getCitizenGrievances(citizenAddress);
      
      return grievanceIds.map(id => id.toString());
    } catch (error) {
      console.error('❌ Failed to get citizen grievances:', error);
      throw this.parseContractError(error);
    }
  }

  /**
   * Event Listening
   */
  
  async setupEventListeners() {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // Citizen Registry Events
      if (this.contracts.CitizenRegistry && typeof this.contracts.CitizenRegistry.on === 'function') {
        const citizenRegistry = this.contracts.CitizenRegistry;
        
        citizenRegistry.on('CitizenRegistered', (citizenAddress, name, timestamp, event) => {
          console.log(`🎉 New citizen registered: ${name} (${citizenAddress})`);
          this.onCitizenRegistered?.(citizenAddress, name, timestamp, event);
        });

        citizenRegistry.on('CitizenVerified', (citizenAddress, verifier, timestamp, event) => {
          console.log(`✅ Citizen verified: ${citizenAddress} by ${verifier}`);
          this.onCitizenVerified?.(citizenAddress, verifier, timestamp, event);
        });
      }

      // Document Registry Events
      if (this.contracts.DocumentRegistry && typeof this.contracts.DocumentRegistry.on === 'function') {
        const documentRegistry = this.contracts.DocumentRegistry;
        
        documentRegistry.on('DocumentUploaded', (documentId, owner, docType, documentHash, timestamp, event) => {
          console.log(`📄 New document uploaded: ID ${documentId} by ${owner}`);
          this.onDocumentUploaded?.(documentId, owner, docType, documentHash, timestamp, event);
        });

        documentRegistry.on('DocumentVerified', (documentId, verifier, timestamp, event) => {
          console.log(`✅ Document verified: ID ${documentId} by ${verifier}`);
          this.onDocumentVerified?.(documentId, verifier, timestamp, event);
        });
      }

      // Grievance System Events
      if (this.contracts.GrievanceSystem && typeof this.contracts.GrievanceSystem.on === 'function') {
        const grievanceSystem = this.contracts.GrievanceSystem;
        
        grievanceSystem.on('GrievanceSubmitted', (grievanceId, citizen, category, priority, timestamp, event) => {
          console.log(`📢 New grievance submitted: ID ${grievanceId} by ${citizen}`);
          this.onGrievanceSubmitted?.(grievanceId, citizen, category, priority, timestamp, event);
        });

        grievanceSystem.on('GrievanceResolved', (grievanceId, officer, resolution, timestamp, event) => {
          console.log(`✅ Grievance resolved: ID ${grievanceId} by ${officer}`);
          this.onGrievanceResolved?.(grievanceId, officer, resolution, timestamp, event);
        });
      }

      console.log('🎧 Event listeners setup complete');
    } catch (error) {
      console.error('❌ Failed to setup event listeners:', error);
      throw error;
    }
  }

  /**
   * Utility Functions
   */
  
  parseContractError(error) {
    if (error.reason) {
      return new Error(`Contract Error: ${error.reason}`);
    }
    if (error.data && error.data.message) {
      return new Error(`Contract Error: ${error.data.message}`);
    }
    if (error.message.includes('revert')) {
      const match = error.message.match(/revert (.+?)(?:\s|$)/);
      if (match) {
        return new Error(`Contract Error: ${match[1]}`);
      }
    }
    return error;
  }

  async getBalance(address = null) {
    try {
      const targetAddress = address || this.signer?.address;
      if (!targetAddress) {
        throw new Error('No address provided and no signer available');
      }
      
      const balance = await this.provider.getBalance(targetAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('❌ Failed to get balance:', error);
      throw error;
    }
  }

  async estimateGas(contract, methodName, ...args) {
    try {
      const contractInstance = this.getContract(contract);
      const gasEstimate = await contractInstance[methodName].estimateGas(...args);
      return gasEstimate.toString();
    } catch (error) {
      console.error('❌ Failed to estimate gas:', error);
      throw error;
    }
  }

  // Event handler setters (can be overridden by the application)
  onCitizenRegistered = null;
  onCitizenVerified = null;
  onDocumentUploaded = null;
  onDocumentVerified = null;
  onGrievanceSubmitted = null;
  onGrievanceResolved = null;
}

// Create singleton instance
const blockchainService = new BlockchainService();

module.exports = blockchainService;