const request = require('supertest');
const app = require('../../server/server');
const { sequelize, Citizen } = require('../../server/models');
const jwt = require('jsonwebtoken');

describe('Citizens API', () => {
  let authToken;
  let testCitizen;

  beforeAll(async () => {
    // Setup test database
    await sequelize.sync({ force: true });
    
    // Create test citizen
    testCitizen = await Citizen.create({
      address: '0x1234567890123456789012345678901234567890',
      aadharHash: 'testhash123',
      name: 'Test Citizen',
      email: 'test@example.com',
      phone: '+1234567890',
      isVerified: true,
    });

    // Generate auth token
    authToken = jwt.sign(
      { address: testCitizen.address, role: 'citizen' },
      process.env.JWT_SECRET || 'test-secret'
    );
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/citizens/profile', () => {
    it('should return citizen profile', async () => {
      const response = await request(app)
        .get('/api/citizens/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', 'Test Citizen');
      expect(response.body.data).toHaveProperty('email', 'test@example.com');
    });

    it('should return 401 without auth token', async () => {
      await request(app)
        .get('/api/citizens/profile')
        .expect(401);
    });
  });

  describe('PUT /api/citizens/profile', () => {
    it('should update citizen profile', async () => {
      const updateData = {
        name: 'Updated Test Citizen',
        email: 'updated@example.com',
        phone: '+1234567891',
      };

      const response = await request(app)
        .put('/api/citizens/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', 'Updated Test Citizen');
    });

    it('should validate email format', async () => {
      const invalidData = {
        email: 'invalid-email',
      };

      const response = await request(app)
        .put('/api/citizens/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Validation failed');
    });
  });

  describe('GET /api/citizens/stats', () => {
    it('should return citizen statistics', async () => {
      const response = await request(app)
        .get('/api/citizens/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('totalDocuments');
      expect(response.body.data).toHaveProperty('verifiedDocuments');
      expect(response.body.data).toHaveProperty('totalGrievances');
    });
  });
});
