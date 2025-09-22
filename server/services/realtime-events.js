const WebSocket = require('ws');
const blockchainService = require('./blockchain');

class RealtimeEventService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map of client connections with their metadata
    this.isInitialized = false;
  }

  /**
   * Initialize WebSocket server and blockchain event listeners
   * @param {Object} server - HTTP server instance
   * @param {number} port - WebSocket port (optional)
   */
  initialize(server, port = null) {
    try {
      // Create WebSocket server
      if (port) {
        this.wss = new WebSocket.Server({ port });
        console.log(`🎧 WebSocket server started on port ${port}`);
      } else {
        this.wss = new WebSocket.Server({ server });
        console.log('🎧 WebSocket server started on HTTP server');
      }

      // Setup WebSocket connection handling
      this.setupWebSocketHandlers();

      // Setup blockchain event listeners
      this.setupBlockchainEventListeners();

      this.isInitialized = true;
      console.log('✅ Real-time event service initialized');

    } catch (error) {
      console.error('❌ Failed to initialize real-time event service:', error);
      throw error;
    }
  }

  /**
   * Setup WebSocket connection handlers
   */
  setupWebSocketHandlers() {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      console.log(`📱 New WebSocket client connected: ${clientId}`);

      // Store client with metadata
      this.clients.set(clientId, {
        ws,
        address: null,
        subscriptions: new Set(),
        connectedAt: new Date(),
        lastPing: new Date()
      });

      // Handle incoming messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(clientId, data);
        } catch (error) {
          console.error('❌ Invalid message from client:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log(`📱 Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      // Handle WebSocket errors
      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for client ${clientId}:`, error);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        clientId,
        message: 'Connected to BharatChain real-time events',
        timestamp: new Date().toISOString()
      }));

      // Setup ping/pong for connection health
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
        const client = this.clients.get(clientId);
        if (client) {
          client.lastPing = new Date();
        }
      });
    });

    // Setup ping interval for connection health check
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  /**
   * Handle messages from WebSocket clients
   * @param {string} clientId - Client identifier
   * @param {Object} data - Message data
   */
  handleClientMessage(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (data.type) {
      case 'authenticate':
        this.handleAuthentication(clientId, data);
        break;
      
      case 'subscribe':
        this.handleSubscription(clientId, data);
        break;
      
      case 'unsubscribe':
        this.handleUnsubscription(clientId, data);
        break;
      
      case 'ping':
        client.ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
        break;
      
      default:
        client.ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${data.type}`
        }));
    }
  }

  /**
   * Handle client authentication
   * @param {string} clientId - Client identifier
   * @param {Object} data - Authentication data
   */
  handleAuthentication(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { address, signature } = data;
    
    // TODO: Implement proper signature verification
    // For now, accept any valid Ethereum address
    if (address && address.match(/^0x[a-fA-F0-9]{40}$/)) {
      client.address = address.toLowerCase();
      
      client.ws.send(JSON.stringify({
        type: 'authenticated',
        address: client.address,
        message: 'Successfully authenticated',
        timestamp: new Date().toISOString()
      }));
      
      console.log(`✅ Client ${clientId} authenticated as ${client.address}`);
    } else {
      client.ws.send(JSON.stringify({
        type: 'auth_error',
        message: 'Invalid address or signature',
        timestamp: new Date().toISOString()
      }));
    }
  }

  /**
   * Handle subscription requests
   * @param {string} clientId - Client identifier
   * @param {Object} data - Subscription data
   */
  handleSubscription(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { events } = data;
    
    if (!Array.isArray(events)) {
      client.ws.send(JSON.stringify({
        type: 'error',
        message: 'Events must be an array'
      }));
      return;
    }

    const validEvents = [
      'citizen_registered',
      'citizen_verified', 
      'document_uploaded',
      'document_verified',
      'document_rejected',
      'grievance_submitted',
      'grievance_assigned',
      'grievance_resolved',
      'all_events'
    ];

    const subscribedEvents = events.filter(event => validEvents.includes(event));
    
    subscribedEvents.forEach(event => {
      client.subscriptions.add(event);
    });

    client.ws.send(JSON.stringify({
      type: 'subscribed',
      events: subscribedEvents,
      message: `Subscribed to ${subscribedEvents.length} event(s)`,
      timestamp: new Date().toISOString()
    }));

    console.log(`📡 Client ${clientId} subscribed to:`, subscribedEvents);
  }

  /**
   * Handle unsubscription requests
   * @param {string} clientId - Client identifier
   * @param {Object} data - Unsubscription data
   */
  handleUnsubscription(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { events } = data;
    
    if (!Array.isArray(events)) {
      client.ws.send(JSON.stringify({
        type: 'error',
        message: 'Events must be an array'
      }));
      return;
    }

    events.forEach(event => {
      client.subscriptions.delete(event);
    });

    client.ws.send(JSON.stringify({
      type: 'unsubscribed',
      events,
      message: `Unsubscribed from ${events.length} event(s)`,
      timestamp: new Date().toISOString()
    }));

    console.log(`📡 Client ${clientId} unsubscribed from:`, events);
  }

  /**
   * Setup blockchain event listeners
   */
  setupBlockchainEventListeners() {
    if (!blockchainService.isInitialized) {
      console.warn('⚠️ Blockchain service not initialized, skipping event listeners setup');
      return;
    }

    // Citizen Registry Events
    blockchainService.onCitizenRegistered = (citizenAddress, name, timestamp, event) => {
      this.broadcastEvent('citizen_registered', {
        citizenAddress,
        name,
        timestamp: new Date(Number(timestamp) * 1000).toISOString(),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      });
    };

    blockchainService.onCitizenVerified = (citizenAddress, verifier, timestamp, event) => {
      this.broadcastEvent('citizen_verified', {
        citizenAddress,
        verifier,
        timestamp: new Date(Number(timestamp) * 1000).toISOString(),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      });
    };

    // Document Registry Events
    blockchainService.onDocumentUploaded = (documentId, owner, docType, documentHash, timestamp, event) => {
      const docTypes = ['AADHAR', 'PAN', 'DRIVING_LICENSE', 'PASSPORT', 'VOTER_ID', 'BIRTH_CERTIFICATE', 'OTHER'];
      
      this.broadcastEvent('document_uploaded', {
        documentId: documentId.toString(),
        owner,
        documentType: docTypes[Number(docType)] || 'OTHER',
        documentHash,
        timestamp: new Date(Number(timestamp) * 1000).toISOString(),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      });
    };

    blockchainService.onDocumentVerified = (documentId, verifier, timestamp, event) => {
      this.broadcastEvent('document_verified', {
        documentId: documentId.toString(),
        verifier,
        timestamp: new Date(Number(timestamp) * 1000).toISOString(),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      });
    };

    // Grievance System Events
    blockchainService.onGrievanceSubmitted = (grievanceId, citizen, category, priority, timestamp, event) => {
      const categories = ['INFRASTRUCTURE', 'WATER_SUPPLY', 'ELECTRICITY', 'SANITATION', 'ROADS', 'HEALTHCARE', 'EDUCATION', 'CORRUPTION', 'OTHER'];
      const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      
      this.broadcastEvent('grievance_submitted', {
        grievanceId: grievanceId.toString(),
        citizen,
        category: categories[Number(category)] || 'OTHER',
        priority: priorities[Number(priority)] || 'LOW',
        timestamp: new Date(Number(timestamp) * 1000).toISOString(),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      });
    };

    blockchainService.onGrievanceResolved = (grievanceId, officer, resolution, timestamp, event) => {
      this.broadcastEvent('grievance_resolved', {
        grievanceId: grievanceId.toString(),
        officer,
        resolution,
        timestamp: new Date(Number(timestamp) * 1000).toISOString(),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      });
    };

    // Setup event listeners on blockchain service
    blockchainService.setupEventListeners().catch(error => {
      console.error('❌ Failed to setup blockchain event listeners:', error);
    });

    console.log('🎧 Blockchain event listeners configured');
  }

  /**
   * Broadcast event to all subscribed clients
   * @param {string} eventType - Type of event
   * @param {Object} eventData - Event data
   */
  broadcastEvent(eventType, eventData) {
    if (!this.isInitialized) return;

    const message = {
      type: 'blockchain_event',
      eventType,
      data: eventData,
      timestamp: new Date().toISOString()
    };

    let sentCount = 0;

    this.clients.forEach((client, clientId) => {
      // Check if client is subscribed to this event or all events
      if (client.subscriptions.has(eventType) || client.subscriptions.has('all_events')) {
        try {
          // Additional filtering based on user address (for personalized events)
          let shouldSend = true;

          // Only send user-specific events to the relevant user
          if (eventData.citizenAddress && client.address) {
            shouldSend = eventData.citizenAddress.toLowerCase() === client.address;
          } else if (eventData.owner && client.address) {
            shouldSend = eventData.owner.toLowerCase() === client.address;
          } else if (eventData.citizen && client.address) {
            shouldSend = eventData.citizen.toLowerCase() === client.address;
          }

          if (shouldSend && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(message));
            sentCount++;
          }
        } catch (error) {
          console.error(`❌ Failed to send event to client ${clientId}:`, error);
        }
      }
    });

    console.log(`📡 Broadcasted ${eventType} event to ${sentCount} client(s)`);
  }

  /**
   * Send custom notification to specific address
   * @param {string} address - Target address
   * @param {Object} notification - Notification data
   */
  sendNotificationToAddress(address, notification) {
    if (!this.isInitialized) return;

    const targetAddress = address.toLowerCase();
    let sentCount = 0;

    this.clients.forEach((client, clientId) => {
      if (client.address === targetAddress && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(JSON.stringify({
            type: 'notification',
            data: notification,
            timestamp: new Date().toISOString()
          }));
          sentCount++;
        } catch (error) {
          console.error(`❌ Failed to send notification to client ${clientId}:`, error);
        }
      }
    });

    console.log(`📧 Sent notification to ${sentCount} client(s) for address ${address}`);
  }

  /**
   * Get real-time statistics
   * @returns {Object} Statistics object
   */
  getStatistics() {
    const stats = {
      totalClients: this.clients.size,
      authenticatedClients: 0,
      totalSubscriptions: 0,
      subscriptionsByEvent: {},
      isInitialized: this.isInitialized
    };

    this.clients.forEach((client) => {
      if (client.address) {
        stats.authenticatedClients++;
      }
      
      stats.totalSubscriptions += client.subscriptions.size;
      
      client.subscriptions.forEach(event => {
        stats.subscriptionsByEvent[event] = (stats.subscriptionsByEvent[event] || 0) + 1;
      });
    });

    return stats;
  }

  /**
   * Generate unique client ID
   * @returns {string} Client ID
   */
  generateClientId() {
    return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Graceful shutdown
   */
  shutdown() {
    if (this.wss) {
      console.log('🔌 Closing WebSocket server...');
      
      // Notify all clients about shutdown
      this.clients.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({
            type: 'server_shutdown',
            message: 'Server is shutting down',
            timestamp: new Date().toISOString()
          }));
        }
      });

      // Close all connections
      this.wss.close(() => {
        console.log('✅ WebSocket server closed');
      });
    }
  }
}

// Create singleton instance
const realtimeEventService = new RealtimeEventService();

module.exports = realtimeEventService;