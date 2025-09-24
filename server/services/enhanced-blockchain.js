const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

/**
 * Enhanced Blockchain Service with Robust Offline Support
 * Provides full functionality both online and offline with intelligent fallbacks
 */
class EnhancedBlockchainService extends EventEmitter {
  constructor() {
    super();
    this.provider = null;
    this.signer = null;
    this.contracts = {};
    this.isInitialized = false;
    this.isOnline = false;
    this.offlineMode = true; // Default to offline
    
    // Enhanced mock data storage for offline mode
    this.mockData = {
      citizens: new Map(),
      documents: new Map(),
      grievances: new Map(),
      transactions: [],
      blockNumber: 1000000,
      gasPrice: ethers.parseUnits('20', 'gwei')
    };
    
    // Network configurations
    this.networkConfig = {
      localhost: {
        rpcUrl: 'http://127.0.0.1:8545',
        chainId: 1337,
        name: 'Local Development'
      },
      hardhat: {
        rpcUrl: 'http://127.0.0.1:8545', 
        chainId: 31337,
        name: 'Hardhat Network'
      },
      mumbai: {
        rpcUrl: process.env.MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
        chainId: 80001,
        name: 'Polygon Mumbai Testnet'
      },
      polygon: {
        rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
        chainId: 137,
        name: 'Polygon Mainnet'
      }
    };
    
    // Initialize with sample data
    this.initializeMockData();
  }

  /**
   * Initialize mock data for offline testing
   */
  initializeMockData() {
    // Sample citizens
    const sampleCitizens = [
      {
        address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        aadharHash: 'hash_123456789',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+91-9876543210',
        isVerified: true,
        registrationDate: new Date('2024-01-15')
      },
      {
        address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        aadharHash: 'hash_987654321',
        name: 'Jane Smith',
        email: 'jane@example.com', 
        phone: '+91-9876543211',
        isVerified: false,
        registrationDate: new Date('2024-02-20')
      }
    ];

    sampleCitizens.forEach(citizen => {
      this.mockData.citizens.set(citizen.address.toLowerCase(), citizen);
    });

    // Sample documents
    const sampleDocuments = [
      {
        id: '1001',
        owner: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        documentHash: 'doc_hash_aadhar_001',
        docType: 0, // AADHAR
        status: 1, // VERIFIED
        metadata: 'Aadhar Card - John Doe',
        uploadDate: new Date('2024-01-16'),
        verificationDate: new Date('2024-01-17'),
        verifier: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
      },
      {
        id: '1002', 
        owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        documentHash: 'doc_hash_pan_001',
        docType: 1, // PAN
        status: 0, // PENDING
        metadata: 'PAN Card - Jane Smith',
        uploadDate: new Date('2024-02-21'),
        verificationDate: null,
        verifier: null
      }
    ];

    sampleDocuments.forEach(doc => {
      this.mockData.documents.set(doc.id, doc);
    });

    // Sample grievances
    const sampleGrievances = [
      {
        id: '2001',
        citizen: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        title: 'Street Light Not Working',
        description: 'The street light outside my house has been non-functional for 2 weeks',
        category: 0, // INFRASTRUCTURE
        priority: 1, // MEDIUM
        status: 1, // IN_PROGRESS
        submitDate: new Date('2024-03-01'),
        resolvedDate: null,
        assignedOfficer: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        resolution: '',
        location: 'MG Road, Block A',
        attachments: []
      },
      {
        id: '2002',
        citizen: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 
        title: 'Water Supply Issue',
        description: 'Irregular water supply in our area for past month',
        category: 1, // PUBLIC_SERVICES
        priority: 2, // HIGH
        status: 0, // PENDING
        submitDate: new Date('2024-03-05'),
        resolvedDate: null,
        assignedOfficer: null,
        resolution: '',
        location: 'Sector 15, Apartment Complex',
        attachments: []
      }
    ];

    sampleGrievances.forEach(grievance => {
      this.mockData.grievances.set(grievance.id, grievance);
    });

    console.log('🎭 Mock blockchain data initialized with sample records');
  }

  /**
   * Enhanced initialization with better error handling and offline fallback
   */
  async initialize(network = 'localhost', privateKey = null, forceOffline = false) {
    try {
      console.log(`🚀 Initializing Enhanced Blockchain Service...`);
      
      if (forceOffline) {
        console.log('🔄 Force offline mode enabled');
        this.enableOfflineMode();
        return;
      }

      const config = this.networkConfig[network];
      if (!config) {
        throw new Error(`Unknown network: ${network}`);
      }

      console.log(`🔗 Attempting to connect to ${config.name}...`);

      // Enhanced connection attempt with timeout and retries
      await this.attemptConnection(config, privateKey);

      // If we reach here, connection was successful
      await this.loadContracts();
      await this.deployMissingContracts();
      
      this.isInitialized = true;
      this.isOnline = true;
      this.offlineMode = false;
      
      console.log(`✅ Blockchain service online - Connected to ${config.name}`);
      this.emit('connected', { network, chainId: config.chainId });

    } catch (error) {
      console.error('❌ Blockchain connection failed:', error.message);
      console.log('🔄 Switching to enhanced offline mode...');
      this.enableOfflineMode();
    }
  }

  /**
   * Attempt blockchain connection with retries
   */
  async attemptConnection(config, privateKey, maxRetries = 2) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📡 Connection attempt ${attempt}/${maxRetries}...`);

        // Setup provider with timeout
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
        
        // Test connection
        const connectionPromise = this.provider.getNetwork();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 3000)
        );
        
        const networkInfo = await Promise.race([connectionPromise, timeoutPromise]);
        
        // Verify chain ID
        if (Number(networkInfo.chainId) !== config.chainId) {
          throw new Error(`Chain ID mismatch: expected ${config.chainId}, got ${networkInfo.chainId}`);
        }

        console.log(`✅ Connected to ${config.name} (Chain ID: ${networkInfo.chainId})`);

        // Setup signer if private key provided
        if (privateKey) {
          this.signer = new ethers.Wallet(privateKey, this.provider);
          console.log(`✅ Signer initialized: ${this.signer.address}`);
          
          // Test signer balance
          const balance = await this.provider.getBalance(this.signer.address);
          console.log(`💰 Signer balance: ${ethers.formatEther(balance)} ETH`);
        } else {
          console.log(`⚠️ No private key provided - read-only mode`);
        }

        return; // Success!

      } catch (error) {
        console.log(`❌ Attempt ${attempt} failed: ${error.message}`);
        if (attempt === maxRetries) {
          throw error;
        }
        await this.delay(1000 * attempt); // Progressive delay
      }
    }
  }

  /**
   * Enable offline mode with full functionality
   */
  enableOfflineMode() {
    this.isInitialized = true;
    this.isOnline = false;
    this.offlineMode = true;
    this.provider = null;
    this.signer = null;
    
    console.log('🔄 Enhanced offline mode enabled');
    console.log(`📊 Mock data loaded: ${this.mockData.citizens.size} citizens, ${this.mockData.documents.size} documents, ${this.mockData.grievances.size} grievances`);
    
    this.emit('offline', { reason: 'Blockchain network unavailable' });
  }

  /**
   * Generate realistic mock transaction
   */
  generateMockTransaction(type = 'transaction', gasEstimate = '50000') {
    const txHash = '0x' + Array.from({length: 64}, () => 
      Math.floor(Math.random() * 16).toString(16)).join('');
    
    const transaction = {
      transactionHash: txHash,
      blockNumber: ++this.mockData.blockNumber,
      blockHash: '0x' + Array.from({length: 64}, () => 
        Math.floor(Math.random() * 16).toString(16)).join(''),
      gasUsed: gasEstimate,
      gasPrice: this.mockData.gasPrice.toString(),
      timestamp: Math.floor(Date.now() / 1000),
      type: type,
      mock: true
    };

    this.mockData.transactions.push(transaction);
    
    // Simulate blockchain delay
    setTimeout(() => {
      this.emit('transaction', transaction);
    }, 500 + Math.random() * 1000);

    return transaction;
  }

  /**
   * Enhanced contract loading with offline fallback
   */
  async loadContracts() {
    try {
      const artifactsPath = path.join(__dirname, '../../artifacts/contracts');
      
      const contractConfigs = [
        {
          name: 'CitizenRegistry',
          fileName: 'CitizenRegistry.sol/CitizenRegistry.json',
          address: process.env.CITIZEN_REGISTRY_ADDRESS,
          deployArgs: []
        },
        {
          name: 'DocumentRegistry', 
          fileName: 'DocumentRegistry.sol/DocumentRegistry.json',
          address: process.env.DOCUMENT_REGISTRY_ADDRESS,
          deployArgs: []
        },
        {
          name: 'GrievanceSystem',
          fileName: 'GrievanceSystem.sol/GrievanceSystem.json', 
          address: process.env.GRIEVANCE_SYSTEM_ADDRESS,
          deployArgs: []
        }
      ];

      for (const config of contractConfigs) {
        const artifactPath = path.join(artifactsPath, config.fileName);
        
        if (fs.existsSync(artifactPath)) {
          const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
          
          if (this.isOnline && config.address && this.provider) {
            // Online mode - create contract instance
            this.contracts[config.name] = new ethers.Contract(
              config.address,
              artifact.abi,
              this.signer || this.provider
            );
            console.log(`✅ Loaded ${config.name} at ${config.address}`);
          } else {
            // Store ABI and bytecode for offline or deployment
            this.contracts[config.name] = {
              abi: artifact.abi,
              bytecode: artifact.bytecode,
              deployArgs: config.deployArgs
            };
            console.log(`📋 Loaded ${config.name} definition (offline/deployment)`);
          }
        } else {
          console.warn(`⚠️ Contract artifact not found: ${artifactPath}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load contracts:', error);
      if (this.isOnline) {
        throw error;
      }
    }
  }

  /**
   * Deploy missing contracts automatically
   */
  async deployMissingContracts() {
    if (!this.isOnline || !this.signer) {
      console.log('⏸️ Skipping contract deployment (offline mode or no signer)');
      return;
    }

    const contractsToCheck = ['CitizenRegistry', 'DocumentRegistry', 'GrievanceSystem'];
    
    for (const contractName of contractsToCheck) {
      const envVar = `${contractName.toUpperCase().replace(/([A-Z])/g, '_$1').slice(1)}_ADDRESS`;
      
      if (!process.env[envVar] || process.env[envVar] === '') {
        try {
          console.log(`🚀 Auto-deploying ${contractName}...`);
          const result = await this.deployContract(contractName);
          console.log(`✅ ${contractName} deployed at: ${result.address}`);
          console.log(`💡 Add to environment: ${envVar}=${result.address}`);
        } catch (error) {
          console.error(`❌ Failed to deploy ${contractName}:`, error.message);
        }
      }
    }
  }

  /**
   * Enhanced contract deployment
   */
  async deployContract(contractName, constructorArgs = null) {
    if (!this.isOnline) {
      const mockAddress = '0x' + Array.from({length: 40}, () => 
        Math.floor(Math.random() * 16).toString(16)).join('');
      
      console.log(`🎭 Mock deploying ${contractName} at ${mockAddress}`);
      
      return {
        contract: { address: mockAddress },
        address: mockAddress,
        ...this.generateMockTransaction('deployment', '150000')
      };
    }

    if (!this.signer) {
      throw new Error('Signer required for contract deployment');
    }

    const contractData = this.contracts[contractName];
    if (!contractData || !contractData.abi || !contractData.bytecode) {
      throw new Error(`Contract ${contractName} not found or missing ABI/bytecode`);
    }

    try {
      const args = constructorArgs || contractData.deployArgs || [];
      
      const contractFactory = new ethers.ContractFactory(
        contractData.abi,
        contractData.bytecode, 
        this.signer
      );

      console.log(`🚀 Deploying ${contractName} with args:`, args);
      const contract = await contractFactory.deploy(...args);
      
      console.log(`⏳ Waiting for deployment confirmation...`);
      const receipt = await contract.waitForDeployment();
      
      const address = await contract.getAddress();
      console.log(`✅ ${contractName} deployed at: ${address}`);

      // Update contract instance
      this.contracts[contractName] = contract;

      return {
        contract,
        address,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error(`❌ Failed to deploy ${contractName}:`, error);
      throw error;
    }
  }

  // =============================================================
  // CITIZEN REGISTRY OPERATIONS  
  // =============================================================

  /**
   * Register a new citizen
   */
  async registerCitizen(aadharHash, name, email, phone, walletAddress = null) {
    const address = walletAddress || this.signer?.address || this.generateMockAddress();
    
    if (this.offlineMode) {
      // Check if already registered
      if (this.mockData.citizens.has(address.toLowerCase())) {
        throw new Error('Citizen already registered');
      }

      const citizen = {
        address: address,
        aadharHash,
        name,
        email, 
        phone,
        isVerified: false,
        registrationDate: new Date(),
        walletAddress: address
      };

      this.mockData.citizens.set(address.toLowerCase(), citizen);
      
      console.log(`🎭 Mock registered citizen: ${name} (${address})`);
      
      const transaction = this.generateMockTransaction('registerCitizen', '75000');
      
      // Emit event after delay
      setTimeout(() => {
        this.emit('citizenRegistered', {
          citizenAddress: address,
          name,
          timestamp: citizen.registrationDate,
          transaction
        });
      }, 800);

      return transaction;
    }

    // Online mode
    const contract = this.getContract('CitizenRegistry');
    console.log(`📝 Registering citizen: ${name}`);
    
    const tx = await contract.registerCitizen(aadharHash, name, email, phone);
    const receipt = await tx.wait();
    
    console.log(`✅ Citizen registered successfully`);
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }

  /**
   * Get citizen details
   */
  async getCitizen(address) {
    if (this.offlineMode) {
      const citizen = this.mockData.citizens.get(address.toLowerCase());
      if (!citizen) {
        throw new Error('Citizen not found');
      }
      return citizen;
    }

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
  }

  /**
   * Check if citizen is registered
   */
  async isCitizenRegistered(address) {
    if (this.offlineMode) {
      return this.mockData.citizens.has(address.toLowerCase());
    }

    try {
      const contract = this.getContract('CitizenRegistry');
      return await contract.isCitizenRegistered(address);
    } catch (error) {
      console.error('❌ Failed to check citizen registration:', error);
      return false;
    }
  }

  /**
   * Verify citizen (admin operation)
   */
  async verifyCitizen(citizenAddress, verifierAddress = null) {
    if (this.offlineMode) {
      const citizen = this.mockData.citizens.get(citizenAddress.toLowerCase());
      if (!citizen) {
        throw new Error('Citizen not found');
      }
      if (citizen.isVerified) {
        throw new Error('Citizen already verified');
      }

      citizen.isVerified = true;
      citizen.verificationDate = new Date();
      citizen.verifier = verifierAddress || this.generateMockAddress();

      console.log(`🎭 Mock verified citizen: ${citizen.name}`);
      
      const transaction = this.generateMockTransaction('verifyCitizen', '45000');
      
      setTimeout(() => {
        this.emit('citizenVerified', {
          citizenAddress,
          verifier: citizen.verifier,
          timestamp: citizen.verificationDate,
          transaction
        });
      }, 600);

      return transaction;
    }

    const contract = this.getContract('CitizenRegistry');
    console.log(`✅ Verifying citizen: ${citizenAddress}`);
    
    const tx = await contract.verifyCitizen(citizenAddress);
    const receipt = await tx.wait();
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }

  // =============================================================
  // DOCUMENT REGISTRY OPERATIONS
  // =============================================================

  /**
   * Upload a document
   */
  async uploadDocument(documentHash, docType, metadata, expiryDate = 0, ownerAddress = null) {
    const owner = ownerAddress || this.signer?.address || this.generateMockAddress();
    
    if (this.offlineMode) {
      const documentId = (this.mockData.documents.size + 1000).toString();
      
      const document = {
        id: documentId,
        owner,
        documentHash,
        docType: Number(docType),
        status: 0, // PENDING
        metadata,
        uploadDate: new Date(),
        verificationDate: null,
        verifier: null,
        rejectionReason: '',
        expiryDate: expiryDate > 0 ? new Date(expiryDate * 1000) : null
      };

      this.mockData.documents.set(documentId, document);
      
      console.log(`🎭 Mock uploaded document: ${documentHash} (ID: ${documentId})`);
      
      const transaction = this.generateMockTransaction('uploadDocument', '85000');
      transaction.documentId = documentId;
      
      setTimeout(() => {
        this.emit('documentUploaded', {
          documentId,
          owner,
          docType,
          documentHash,
          timestamp: document.uploadDate,
          transaction
        });
      }, 900);

      return transaction;
    }

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
    
    return {
      documentId,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }

  /**
   * Get document details
   */
  async getDocument(documentId) {
    if (this.offlineMode) {
      const document = this.mockData.documents.get(documentId);
      if (!document) {
        throw new Error('Document not found');
      }
      return document;
    }

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
  }

  /**
   * Verify a document
   */
  async verifyDocument(documentId, verifierAddress = null) {
    if (this.offlineMode) {
      const document = this.mockData.documents.get(documentId);
      if (!document) {
        throw new Error('Document not found');
      }
      if (document.status === 1) {
        throw new Error('Document already verified');
      }

      document.status = 1; // VERIFIED
      document.verificationDate = new Date();
      document.verifier = verifierAddress || this.generateMockAddress();

      console.log(`🎭 Mock verified document ID: ${documentId}`);
      
      const transaction = this.generateMockTransaction('verifyDocument', '55000');
      
      setTimeout(() => {
        this.emit('documentVerified', {
          documentId,
          verifier: document.verifier,
          timestamp: document.verificationDate,
          transaction
        });
      }, 700);

      return transaction;
    }

    const contract = this.getContract('DocumentRegistry');
    console.log(`✅ Verifying document: ${documentId}`);
    
    const tx = await contract.verifyDocument(documentId);
    const receipt = await tx.wait();
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }

  /**
   * Get user documents
   */
  async getUserDocuments(userAddress) {
    if (this.offlineMode) {
      const userDocs = Array.from(this.mockData.documents.values())
        .filter(doc => doc.owner.toLowerCase() === userAddress.toLowerCase())
        .map(doc => doc.id);
      
      return userDocs;
    }

    const contract = this.getContract('DocumentRegistry');
    const documentIds = await contract.getUserDocuments(userAddress);
    
    return documentIds.map(id => id.toString());
  }

  // =============================================================
  // GRIEVANCE SYSTEM OPERATIONS
  // =============================================================

  /**
   * Submit a grievance
   */
  async submitGrievance(title, description, category, priority, location, attachments = [], citizenAddress = null) {
    const citizen = citizenAddress || this.signer?.address || this.generateMockAddress();
    
    if (this.offlineMode) {
      const grievanceId = (this.mockData.grievances.size + 2000).toString();
      
      const grievance = {
        id: grievanceId,
        citizen,
        title,
        description,
        category: Number(category),
        priority: Number(priority),
        status: 0, // PENDING
        submitDate: new Date(),
        resolvedDate: null,
        assignedOfficer: null,
        resolution: '',
        satisfactionRating: 0,
        location,
        attachments: attachments || []
      };

      this.mockData.grievances.set(grievanceId, grievance);
      
      console.log(`🎭 Mock submitted grievance: ${title} (ID: ${grievanceId})`);
      
      const transaction = this.generateMockTransaction('submitGrievance', '110000');
      transaction.grievanceId = grievanceId;
      
      setTimeout(() => {
        this.emit('grievanceSubmitted', {
          grievanceId,
          citizen,
          category,
          priority,
          timestamp: grievance.submitDate,
          transaction
        });
      }, 1000);

      return transaction;
    }

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
    
    return {
      grievanceId,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }

  /**
   * Get grievance details
   */
  async getGrievance(grievanceId) {
    if (this.offlineMode) {
      const grievance = this.mockData.grievances.get(grievanceId);
      if (!grievance) {
        throw new Error('Grievance not found');
      }
      return grievance;
    }

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
  }

  /**
   * Assign grievance to officer
   */
  async assignGrievance(grievanceId, officerAddress) {
    if (this.offlineMode) {
      const grievance = this.mockData.grievances.get(grievanceId);
      if (!grievance) {
        throw new Error('Grievance not found');
      }

      grievance.assignedOfficer = officerAddress;
      grievance.status = 1; // IN_PROGRESS

      console.log(`🎭 Mock assigned grievance ${grievanceId} to ${officerAddress}`);
      
      return this.generateMockTransaction('assignGrievance', '35000');
    }

    const contract = this.getContract('GrievanceSystem');
    console.log(`👮 Assigning grievance ${grievanceId} to ${officerAddress}`);
    
    const tx = await contract.assignGrievance(grievanceId, officerAddress);
    const receipt = await tx.wait();
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }

  /**
   * Resolve grievance
   */
  async resolveGrievance(grievanceId, resolution) {
    if (this.offlineMode) {
      const grievance = this.mockData.grievances.get(grievanceId);
      if (!grievance) {
        throw new Error('Grievance not found');
      }

      grievance.status = 2; // RESOLVED
      grievance.resolution = resolution;
      grievance.resolvedDate = new Date();

      console.log(`🎭 Mock resolved grievance: ${grievanceId}`);
      
      const transaction = this.generateMockTransaction('resolveGrievance', '60000');
      
      setTimeout(() => {
        this.emit('grievanceResolved', {
          grievanceId,
          officer: grievance.assignedOfficer,
          resolution,
          timestamp: grievance.resolvedDate,
          transaction
        });
      }, 800);

      return transaction;
    }

    const contract = this.getContract('GrievanceSystem');
    console.log(`✅ Resolving grievance: ${grievanceId}`);
    
    const tx = await contract.resolveGrievance(grievanceId, resolution);
    const receipt = await tx.wait();
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }

  /**
   * Get citizen grievances
   */
  async getCitizenGrievances(citizenAddress) {
    if (this.offlineMode) {
      const userGrievances = Array.from(this.mockData.grievances.values())
        .filter(grievance => grievance.citizen.toLowerCase() === citizenAddress.toLowerCase())
        .map(grievance => grievance.id);
      
      return userGrievances;
    }

    const contract = this.getContract('GrievanceSystem');
    const grievanceIds = await contract.getCitizenGrievances(citizenAddress);
    
    return grievanceIds.map(id => id.toString());
  }

  // =============================================================
  // UTILITY FUNCTIONS
  // =============================================================

  /**
   * Check if blockchain is available
   */
  isBlockchainAvailable() {
    return this.isInitialized;
  }

  /**
   * Check if running in offline mode
   */
  isOffline() {
    return this.offlineMode;
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      initialized: this.isInitialized,
      online: this.isOnline,
      offline: this.offlineMode,
      hasProvider: !!this.provider,
      hasSigner: !!this.signer,
      mockDataSize: {
        citizens: this.mockData.citizens.size,
        documents: this.mockData.documents.size,
        grievances: this.mockData.grievances.size,
        transactions: this.mockData.transactions.length
      }
    };
  }

  /**
   * Get contract instance with availability check
   */
  getContract(contractName) {
    if (this.offlineMode) {
      throw new Error(`Contract ${contractName} not available in offline mode`);
    }
    
    if (!this.isOnline || !this.provider) {
      throw new Error('Blockchain service not available - running in offline mode');
    }
    
    const contract = this.contracts[contractName];
    if (!contract || typeof contract.interface === 'undefined') {
      throw new Error(`Contract ${contractName} not initialized or not deployed`);
    }
    return contract;
  }

  /**
   * Generate mock Ethereum address
   */
  generateMockAddress() {
    return '0x' + Array.from({length: 40}, () => 
      Math.floor(Math.random() * 16).toString(16)).join('');
  }

  /**
   * Get mock statistics
   */
  getMockStats() {
    if (!this.offlineMode) {
      return null;
    }

    const stats = {
      totalCitizens: this.mockData.citizens.size,
      verifiedCitizens: Array.from(this.mockData.citizens.values()).filter(c => c.isVerified).length,
      totalDocuments: this.mockData.documents.size,
      verifiedDocuments: Array.from(this.mockData.documents.values()).filter(d => d.status === 1).length,
      totalGrievances: this.mockData.grievances.size,
      resolvedGrievances: Array.from(this.mockData.grievances.values()).filter(g => g.status === 2).length,
      totalTransactions: this.mockData.transactions.length,
      currentBlockNumber: this.mockData.blockNumber
    };

    return stats;
  }

  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Parse contract errors
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

  /**
   * Get balance (mock in offline mode)
   */
  async getBalance(address = null) {
    if (this.offlineMode) {
      // Return mock balance
      return (Math.random() * 10 + 1).toFixed(4); // 1-11 ETH
    }

    const targetAddress = address || this.signer?.address;
    if (!targetAddress) {
      throw new Error('No address provided and no signer available');
    }
    
    const balance = await this.provider.getBalance(targetAddress);
    return ethers.formatEther(balance);
  }

  /**
   * Export mock data (for testing/backup)
   */
  exportMockData() {
    return {
      citizens: Array.from(this.mockData.citizens.entries()),
      documents: Array.from(this.mockData.documents.entries()),
      grievances: Array.from(this.mockData.grievances.entries()),
      transactions: this.mockData.transactions,
      blockNumber: this.mockData.blockNumber
    };
  }

  /**
   * Import mock data
   */
  importMockData(data) {
    if (data.citizens) {
      this.mockData.citizens = new Map(data.citizens);
    }
    if (data.documents) {
      this.mockData.documents = new Map(data.documents);
    }
    if (data.grievances) {
      this.mockData.grievances = new Map(data.grievances);
    }
    if (data.transactions) {
      this.mockData.transactions = data.transactions;
    }
    if (data.blockNumber) {
      this.mockData.blockNumber = data.blockNumber;
    }
    
    console.log('📥 Mock data imported successfully');
  }
}

// Create singleton instance
const enhancedBlockchainService = new EnhancedBlockchainService();

module.exports = enhancedBlockchainService;