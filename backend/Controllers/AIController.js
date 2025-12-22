const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const improveDescription = async (req, res) => {
    try {
        const { description, title } = req.body;

        if (!description || description.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Description is required"
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are a professional project 30-40 word description writer. A user is posting a project${title ? ` titled "${title}"` : ''} and needs help improving their description.

Original description: "${description}"

Task: Write an improved, professional 30-40 word description for this project. The description should be:
- Between 30-40 words
- Clear and concise
- Professional in tone
- Highlight key requirements and goals
Return ONLY the improved description text, nothing else. Do not include any quotes, explanations, or meta-text.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const improvedDescription = response.text().trim();

        return res.status(200).json({
            success: true,
            message: "Description improved successfully",
            improvedDescription
        });

    } catch (error) {
        console.error("Error improving description:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to improve description. Please try again.",
            error: error.message
        });
    }
};

// Generate smart reply suggestions based on conversation context
const generateSmartReplies = async (req, res) => {
    try {
        const { messages, userRole } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Messages array is required"
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Get last 5-10 messages for context
        const recentMessages = messages.slice(-10);
        const conversationContext = recentMessages
            .map(msg => `${msg.isMine ? 'You' : 'Other'}: ${msg.content}`)
            .join('\n');

        const roleContext = userRole === 'freelancer'
            ? 'You are a professional freelancer responding to a client.'
            : 'You are a client communicating with a freelancer.';

        const prompt = `${roleContext}

Given this conversation:
${conversationContext}

Generate 3 smart, professional reply suggestions that:
- Are contextually appropriate and relevant
- Are concise (10-20 words each)
- Maintain a professional but friendly tone
- Offer different types of responses (e.g., acknowledgment, question, action)

Return ONLY a JSON array with 3 reply strings, nothing else. Format: ["reply1", "reply2", "reply3"]`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        let repliesText = response.text().trim();

        // Clean up response - remove markdown code blocks if present
        repliesText = repliesText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const replies = JSON.parse(repliesText);

        return res.status(200).json({
            success: true,
            replies: Array.isArray(replies) ? replies.slice(0, 3) : []
        });

    } catch (error) {
        console.error("Error generating smart replies:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate replies",
            error: error.message
        });
    }
};

// Analyze message tone before sending
const analyzeMessageTone = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Message is required"
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Analyze the tone of this message:
"${message}"

Classify the tone as one of: professional, friendly, casual, neutral, urgent, aggressive, disappointed, enthusiastic

Also provide:
- confidence score (0-100)
- isProblematic (true/false) - true if tone might cause issues (aggressive, harsh, rude)
- suggestion (optional text if tone needs improvement)

Return ONLY a JSON object with this exact format:
{
  "tone": "tone_name",
  "confidence": 85,
  "isProblematic": false,
  "suggestion": "optional suggestion text"
}`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        let analysisText = response.text().trim();

        // Clean up response
        analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const analysis = JSON.parse(analysisText);

        return res.status(200).json({
            success: true,
            analysis
        });

    } catch (error) {
        console.error("Error analyzing tone:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to analyze tone",
            error: error.message
        });
    }
};

// Detect message intent
const detectMessageIntent = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Message is required"
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Analyze this message and detect the user's intent:
"${message}"

Classify the intent as one of:
- contract_proposal: proposing or discussing a work agreement
- meeting_request: requesting a call or meeting
- file_request: asking for files or documents
- question: asking a question
- clarification: seeking clarification on something
- update: providing a status update
- feedback: giving feedback or review
- general: general conversation

Return ONLY a JSON object with this format:
{
  "intent": "intent_name",
  "confidence": 85
}`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        let intentText = response.text().trim();

        // Clean up response
        intentText = intentText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const intentData = JSON.parse(intentText);

        return res.status(200).json({
            success: true,
            intent: intentData
        });

    } catch (error) {
        console.error("Error detecting intent:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to detect intent",
            error: error.message
        });
    }
};

// Summarize conversation
const summarizeConversation = async (req, res) => {
    try {
        const { messages, limit } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Messages array is required"
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Get messages to summarize (last N or all)
        const messagesToSummarize = limit ? messages.slice(-limit) : messages;
        const conversationText = messagesToSummarize
            .map(msg => `[${msg.isMine ? 'You' : 'Other'}]: ${msg.content}`)
            .join('\n');

        const prompt = `Summarize this conversation between a client and freelancer:

${conversationText}

Provide a structured summary with:
1. Main Discussion Points (2-4 bullet points)
2. Key Decisions Made (if any)
3. Action Items (if any)
4. Important Deadlines or Dates (if mentioned)

Format as JSON:
{
  "discussionPoints": ["point1", "point2"],
  "decisions": ["decision1"],
  "actionItems": ["action1"],
  "deadlines": ["deadline1"]
}

If a section has no items, use an empty array.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        let summaryText = response.text().trim();

        // Clean up response
        summaryText = summaryText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const summary = JSON.parse(summaryText);

        return res.status(200).json({
            success: true,
            summary
        });

    } catch (error) {
        console.error("Error summarizing conversation:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to summarize conversation",
            error: error.message
        });
    }
};

module.exports = {
    improveDescription,
    generateSmartReplies,
    analyzeMessageTone,
    detectMessageIntent,
    summarizeConversation
};
