const express = require('express');
const router = express.Router();

// Add your auth routes here
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route working' });
});

module.exports = router;
