const express = require('express');
<<<<<<< HEAD
const {
    improveDescription,
    generateSmartReplies,
    analyzeMessageTone,
    detectMessageIntent,
    summarizeConversation
} = require('../Controllers/AIController');
=======
const { improveDescription, scoreApplicationAPI } = require('../Controllers/AIController');
>>>>>>> 0923ce0736c0ba3808d4fcf1042139b46447c4c9
const ensureAuthenticated = require('../Middlewares/Auth');

const router = express.Router();

// POST /api/ai/improve-description
router.post('/improve-description', ensureAuthenticated, improveDescription);

<<<<<<< HEAD
// POST /api/ai/smart-replies - Generate smart reply suggestions
router.post('/smart-replies', ensureAuthenticated, generateSmartReplies);

// POST /api/ai/analyze-tone - Analyze message tone
router.post('/analyze-tone', ensureAuthenticated, analyzeMessageTone);

// POST /api/ai/detect-intent - Detect message intent
router.post('/detect-intent', ensureAuthenticated, detectMessageIntent);

// POST /api/ai/summarize-conversation - Summarize conversation
router.post('/summarize-conversation', ensureAuthenticated, summarizeConversation);
=======
// POST /api/ai/score-application
router.post('/score-application', ensureAuthenticated, scoreApplicationAPI);
>>>>>>> 0923ce0736c0ba3808d4fcf1042139b46447c4c9

module.exports = router;
