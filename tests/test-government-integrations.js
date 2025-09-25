/**
 * BharatChain Government Integration Test Suite
 * Tests all 12 government integration features
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test configuration
const testConfig = {
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
    }
};

/**
 * Government Integration Features Test Suite
 */
async function testGovernmentIntegrations() {
    console.log('🎯 Testing BharatChain Government Integrations');
    console.log('='.repeat(60));

    const results = {
        passed: 0,
        failed: 0,
        total: 0
    };

    // Test 1: QR Code System
    await testEndpoint('QR Code System', async () => {
        const qrResponse = await axios.post(`${BASE_URL}/qr-codes/generate`, {
            type: 'citizen',
            data: { citizenId: 'TEST001' }
        }, testConfig);
        
        const verifyResponse = await axios.post(`${BASE_URL}/qr-codes/verify`, {
            qrCode: qrResponse.data.qrCode
        }, testConfig);
        
        return qrResponse.data.success && verifyResponse.data.valid;
    }, results);

    // Test 2: Mobile Authentication
    await testEndpoint('Mobile Authentication', async () => {
        const otpResponse = await axios.post(`${BASE_URL}/mobile-auth/send-otp`, {
            phoneNumber: '+919876543210'
        }, testConfig);
        
        return otpResponse.data.success;
    }, results);

    // Test 3: Mobile Configuration
    await testEndpoint('Mobile Configuration', async () => {
        const configResponse = await axios.get(`${BASE_URL}/mobile-config/app-config`, testConfig);
        return configResponse.data.success;
    }, results);

    // Test 4: Offline Sync
    await testEndpoint('Offline Sync', async () => {
        const syncResponse = await axios.post(`${BASE_URL}/offline-sync/queue-operation`, {
            operation: 'test',
            data: { test: true }
        }, testConfig);
        
        return syncResponse.data.success;
    }, results);

    // Test 5: Government APIs
    await testEndpoint('Government APIs', async () => {
        const apisResponse = await axios.get(`${BASE_URL}/government-apis/available`, testConfig);
        return apisResponse.data.success && apisResponse.data.apis.length > 0;
    }, results);

    // Test 6: Government Services
    await testEndpoint('Government Services', async () => {
        const servicesResponse = await axios.get(`${BASE_URL}/government-services/available`, testConfig);
        return servicesResponse.data.success && servicesResponse.data.services.length > 0;
    }, results);

    // Test 7: Government Payments
    await testEndpoint('Government Payments', async () => {
        const feesResponse = await axios.get(`${BASE_URL}/government-payments/fees/passport`, testConfig);
        return feesResponse.data.success;
    }, results);

    // Test 8: Emergency & Safety APIs
    await testEndpoint('Emergency & Safety APIs', async () => {
        const emergencyResponse = await axios.get(`${BASE_URL}/emergency-safety/contacts`, testConfig);
        return emergencyResponse.data.success && emergencyResponse.data.contacts.length > 0;
    }, results);

    // Test 9: Open Government Data
    await testEndpoint('Open Government Data', async () => {
        const openDataResponse = await axios.get(`${BASE_URL}/open-data/datasets/search?query=budget`, testConfig);
        return openDataResponse.data.success && openDataResponse.data.datasets.length > 0;
    }, results);

    // Test 10: Secure Data Exchange
    await testEndpoint('Secure Data Exchange', async () => {
        const exchangeResponse = await axios.post(`${BASE_URL}/secure-data-exchange/request`, {
            requestType: 'identity_verification',
            purpose: 'service_application',
            dataTypes: ['name', 'address']
        }, testConfig);
        
        return exchangeResponse.data.success;
    }, results);

    // Test 11: Compliance & Audit
    await testEndpoint('Compliance & Audit', async () => {
        const complianceResponse = await axios.get(`${BASE_URL}/compliance-audit/assessment/gdpr`, testConfig);
        return complianceResponse.data.success;
    }, results);

    // Test 12: System Health Check
    await testEndpoint('System Health Check', async () => {
        const healthResponse = await axios.get(`${BASE_URL}/health`, testConfig);
        return healthResponse.data.status === 'healthy';
    }, results);

    // Print Results
    console.log('\n📊 Test Results Summary');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed}/${results.total}`);
    console.log(`❌ Failed: ${results.failed}/${results.total}`);
    console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    
    if (results.failed === 0) {
        console.log('\n🎉 All Government Integration Features Working!');
        console.log('✅ BharatChain is ready for real-world deployment');
    } else {
        console.log('\n⚠️ Some features need attention');
        console.log('🔧 Check server logs for detailed error information');
    }
}

/**
 * Test individual endpoint
 */
async function testEndpoint(name, testFunction, results) {
    results.total++;
    process.stdout.write(`🔄 Testing ${name}... `);
    
    try {
        const success = await testFunction();
        if (success) {
            console.log('✅ PASS');
            results.passed++;
        } else {
            console.log('❌ FAIL');
            results.failed++;
        }
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        results.failed++;
    }
}

/**
 * Wait for server to start
 */
async function waitForServer() {
    console.log('⏳ Waiting for server to start...');
    
    for (let i = 0; i < 30; i++) {
        try {
            await axios.get(`${BASE_URL}/health`, { timeout: 2000 });
            console.log('✅ Server is ready!\n');
            return true;
        } catch (error) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    throw new Error('Server failed to start within 30 seconds');
}

/**
 * Main test runner
 */
async function runTests() {
    try {
        await waitForServer();
        await testGovernmentIntegrations();
    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = { testGovernmentIntegrations, waitForServer };