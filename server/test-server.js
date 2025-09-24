const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002; // Use different port

// Basic middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Simple test route
app.get('/api/test', (req, res) => {
  console.log('🧪 Test endpoint hit');
  res.json({ success: true, message: 'Test successful!' });
});

// Simple health route
app.get('/api/health', (req, res) => {
  console.log('❤️ Health endpoint hit');
  res.json({ 
    success: true, 
    message: 'Health check passed',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`);
});

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

console.log('🧪 Minimal test server started');