const express = require('express');
const {
    improveDescription,
    generateSmartReplies,
    analyzeMessageTone,
    detectMessageIntent,
    summarizeConversation
} = require('../Controllers/AIController');
const ensureAuthenticated = require('../Middlewares/Auth');

const router = express.Router();

// POST /api/ai/improve-description
router.post('/improve-description', ensureAuthenticated, improveDescription);

// POST /api/ai/smart-replies - Generate smart reply suggestions
router.post('/smart-replies', ensureAuthenticated, generateSmartReplies);

// POST /api/ai/analyze-tone - Analyze message tone
router.post('/analyze-tone', ensureAuthenticated, analyzeMessageTone);

// POST /api/ai/detect-intent - Detect message intent
router.post('/detect-intent', ensureAuthenticated, detectMessageIntent);

// POST /api/ai/summarize-conversation - Summarize conversation
router.post('/summarize-conversation', ensureAuthenticated, summarizeConversation);

module.exports = router;
