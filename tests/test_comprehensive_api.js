const request = require('supertest');
const app = require('../server');
const db = require('../database/bharatchain.db');

// Test data
const testUser = {
  walletAddress: '0x1234567890123456789012345678901234567890',
  name: 'Test User',
  email: 'test@example.com',
  phone: '+919876543210',
  aadharHash: 'hash_123456789012'
};

const testDocument = {
  title: 'Test Document',
  type: 'aadhar',
  description: 'Test document for API testing',
  isPublic: false
};

const testGrievance = {
  title: 'Test Grievance',
  description: 'This is a test grievance for API testing purposes. It should be at least 20 characters long.',
  category: 'DOCUMENTATION',
  priority: 'MEDIUM',
  department: 'Test Department'
};

describe('BharatChain API Tests', () => {
  let authToken;
  let citizenId;
  let documentId;
  let grievanceId;

  beforeAll(async () => {
    // Clean up any existing test data
    try {
      db.run('DELETE FROM citizens WHERE email = ?', [testUser.email]);
      db.run('DELETE FROM documents WHERE title = ?', [testDocument.title]);
      db.run('DELETE FROM grievances WHERE title = ?', [testGrievance.title]);
    } catch (error) {
      console.log('Cleanup error (expected for first run):', error.message);
    }
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (citizenId) {
        db.run('DELETE FROM citizens WHERE id = ?', [citizenId]);
      }
      if (documentId) {
        db.run('DELETE FROM documents WHERE id = ?', [documentId]);
      }
      if (grievanceId) {
        db.run('DELETE FROM grievances WHERE id = ?', [grievanceId]);
      }
    } catch (error) {
      console.log('Cleanup error:', error.message);
    }
  });

  describe('Authentication Endpoints', () => {
    test('POST /api/auth/register - should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.token).toBeDefined();
      authToken = response.body.token;
    });

    test('POST /api/auth/login - should login existing user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          walletAddress: testUser.walletAddress
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    test('POST /api/auth/register - should not register duplicate wallet address', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('Citizen Endpoints', () => {
    test('POST /api/citizens/register - should register citizen profile', async () => {
      const response = await request(app)
        .post('/api/citizens/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.citizen).toBeDefined();
      citizenId = response.body.citizen.id;
    });

    test('GET /api/citizens/profile - should get citizen profile', async () => {
      const response = await request(app)
        .get('/api/citizens/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.citizen).toBeDefined();
      expect(response.body.citizen.email).toBe(testUser.email);
    });

    test('GET /api/citizens/profile - should fail without auth token', async () => {
      const response = await request(app)
        .get('/api/citizens/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });
  });

  describe('Document Endpoints', () => {
    test('GET /api/documents - should get documents list', async () => {
      const response = await request(app)
        .get(`/api/documents?address=${testUser.walletAddress}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.documents).toBeDefined();
      expect(Array.isArray(response.body.data.documents)).toBe(true);
    });

    test('GET /api/documents - should fail without wallet address', async () => {
      const response = await request(app)
        .get('/api/documents')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });
  });

  describe('Grievance Endpoints', () => {
    test('POST /api/grievances - should create a new grievance', async () => {
      const response = await request(app)
        .post('/api/grievances')
        .send({
          ...testGrievance,
          address: testUser.walletAddress
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.grievance).toBeDefined();
      grievanceId = response.body.data.grievance.id;
    });

    test('GET /api/grievances - should get grievances list', async () => {
      const response = await request(app)
        .get(`/api/grievances?address=${testUser.walletAddress}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.grievances).toBeDefined();
      expect(Array.isArray(response.body.data.grievances)).toBe(true);
      expect(response.body.data.grievances.length).toBeGreaterThan(0);
    });

    test('PUT /api/grievances/:id/status - should update grievance status', async () => {
      const response = await request(app)
        .put(`/api/grievances/${grievanceId}/status`)
        .send({
          status: 'IN_PROGRESS',
          resolution: 'Investigating the issue',
          address: testUser.walletAddress
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('POST /api/grievances - should fail with invalid data', async () => {
      const response = await request(app)
        .post('/api/grievances')
        .send({
          title: '', // Empty title
          description: 'Too short', // Too short description
          address: testUser.walletAddress
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('QR Code Endpoints', () => {
    test('POST /api/qr/generate - should generate QR code', async () => {
      const response = await request(app)
        .post('/api/qr/generate')
        .send({
          type: 'citizen',
          data: {
            citizenId: testUser.walletAddress,
            name: testUser.name
          },
          expiresIn: 3600
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.qrCode).toBeDefined();
      expect(response.body.data.id).toBeDefined();
    });

    test('POST /api/qr/verify - should verify valid QR code', async () => {
      // First generate a QR code
      const generateResponse = await request(app)
        .post('/api/qr/generate')
        .send({
          type: 'document',
          data: { documentId: 'test123' },
          expiresIn: 3600
        });

      const qrId = generateResponse.body.data.id;

      const response = await request(app)
        .post('/api/qr/verify')
        .send({
          id: qrId,
          signature: generateResponse.body.data.signature
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
    });

    test('POST /api/qr/generate - should fail with invalid data', async () => {
      const response = await request(app)
        .post('/api/qr/generate')
        .send({
          type: 'invalid_type',
          data: {}
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Payment Endpoints', () => {
    test('GET /api/payments/fees - should get service fees', async () => {
      const response = await request(app)
        .get('/api/payments/fees')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test('POST /api/payments/create-order - should create payment order', async () => {
      const response = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          serviceType: 'document_verification',
          amount: 50,
          description: 'Test payment order'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.orderId).toBeDefined();
    });

    test('GET /api/payments/history - should get payment history', async () => {
      const response = await request(app)
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payments).toBeDefined();
      expect(Array.isArray(response.body.data.payments)).toBe(true);
    });

    test('POST /api/payments/create-order - should fail without auth', async () => {
      const response = await request(app)
        .post('/api/payments/create-order')
        .send({
          serviceType: 'document_verification',
          amount: 50
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Web3 Integration Endpoints', () => {
    test('GET /api/web3/network - should get network status', async () => {
      const response = await request(app)
        .get('/api/web3/network')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test('POST /api/web3/register-citizen - should register citizen on blockchain', async () => {
      const response = await request(app)
        .post('/api/web3/register-citizen')
        .send({
          walletAddress: testUser.walletAddress,
          citizenData: {
            name: testUser.name,
            aadharHash: testUser.aadharHash
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test('GET /api/web3/citizen/:address - should get citizen data from blockchain', async () => {
      const response = await request(app)
        .get(`/api/web3/citizen/${testUser.walletAddress}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.citizen).toBeDefined();
    });
  });

  describe('AI Service Integration', () => {
    test('POST /ai/analyze/document - should analyze document (mock)', async () => {
      const response = await request(app)
        .post('/ai/analyze/document')
        .send({
          documentText: 'Sample document text for analysis',
          documentType: 'aadhar'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analysis).toBeDefined();
    });

    test('POST /ai/analyze/grievance - should analyze grievance text', async () => {
      const response = await request(app)
        .post('/ai/analyze/grievance')
        .send({
          text: 'I am facing issues with my document verification process. It has been delayed for weeks.'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analysis).toBeDefined();
      expect(response.body.analysis.sentiment).toBeDefined();
    });

    test('POST /ai/analyze/document - should fail with empty text', async () => {
      const response = await request(app)
        .post('/ai/analyze/document')
        .send({
          documentText: '',
          documentType: 'aadhar'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Health Check Endpoints', () => {
    test('GET /health - should return system health', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.services).toBeDefined();
    });

    test('GET /api/status - should return API status', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200);

      expect(response.body.status).toBe('active');
      expect(response.body.version).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('GET /api/nonexistent - should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    test('POST /api/auth/register - should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          walletAddress: 'invalid_address',
          name: '',
          email: 'invalid_email'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.details).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    test('Should handle rate limiting on auth endpoints', async () => {
      // Make multiple rapid requests
      const requests = Array(10).fill().map(() =>
        request(app)
          .post('/api/auth/login')
          .send({ walletAddress: 'test_address' })
      );

      const responses = await Promise.all(requests);
      
      // At least one should be rate limited
      const rateLimited = responses.some(response => response.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('Database Integration', () => {
    test('Should maintain data integrity across operations', async () => {
      // Test that citizen data remains consistent
      const profileResponse = await request(app)
        .get('/api/citizens/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.citizen.email).toBe(testUser.email);

      // Test that grievances are properly linked to citizen
      const grievancesResponse = await request(app)
        .get(`/api/grievances?address=${testUser.walletAddress}`);

      expect(grievancesResponse.body.success).toBe(true);
      const grievances = grievancesResponse.body.data.grievances;
      expect(grievances.some(g => g.title === testGrievance.title)).toBe(true);
    });
  });

  describe('Security Features', () => {
    test('Should reject requests without proper authentication', async () => {
      const response = await request(app)
        .post('/api/citizens/register')
        .send(testUser)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Should validate input data properly', async () => {
      const response = await request(app)
        .post('/api/grievances')
        .send({
          title: 'A',
          description: 'Too short',
          address: testUser.walletAddress
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Should handle SQL injection attempts', async () => {
      const response = await request(app)
        .get("/api/documents?address='; DROP TABLE citizens; --")
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

// Performance Tests
describe('Performance Tests', () => {
  test('API responses should be within acceptable time limits', async () => {
    const start = Date.now();
    
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000); // Should respond within 1 second
    expect(response.body.status).toBe('OK');
  });

  test('Database queries should be optimized', async () => {
    const start = Date.now();
    
    await request(app)
      .get(`/api/grievances?address=${testUser.walletAddress}`)
      .expect(200);
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500); // Database queries should be fast
  });
});

console.log('🧪 Running comprehensive API tests...');
console.log('✅ Testing authentication, citizen management, documents, grievances, QR codes, payments, Web3, AI services, and more!');
console.log('🔒 Security tests included: authentication, input validation, SQL injection protection');
console.log('⚡ Performance tests included: response times, database optimization');
console.log('🎯 Integration tests included: database integrity, service communication');