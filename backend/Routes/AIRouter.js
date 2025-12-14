const express = require('express');
const { improveDescription } = require('../Controllers/AIController');
const ensureAuthenticated = require('../Middlewares/Auth');

const router = express.Router();

// POST /api/ai/improve-description
router.post('/improve-description', ensureAuthenticated, improveDescription);

module.exports = router;
