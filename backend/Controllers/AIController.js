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

// Score application using AI
const scoreApplication = async (projectTitle, projectDescription, projectSkills, coverLetter) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an expert hiring consultant evaluating a freelancer's application for a project. Analyze the cover letter and score it objectively.

PROJECT DETAILS:
Title: ${projectTitle}
Description: ${projectDescription}
Required Skills: ${projectSkills?.join(', ') || 'Not specified'}

FREELANCER'S COVER LETTER:
"${coverLetter}"

SCORING CRITERIA (0-100 each):
1. Relevance: How well does the application address the specific project requirements?
2. Professionalism: Quality of writing, grammar, and professional tone
3. Clarity: How clearly does the freelancer communicate their approach?
4. Experience: Does the freelancer mention relevant experience or portfolio?

IMPORTANT: Return ONLY a valid JSON object with no additional text, markdown, or code blocks. Format:
{"overallScore":75,"relevance":80,"professionalism":70,"clarity":75,"experience":75,"summary":"Brief 1-sentence assessment"}`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        let responseText = response.text().trim();

        // Remove markdown code blocks if present
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const scores = JSON.parse(responseText);

        return {
            success: true,
            aiScore: scores.overallScore,
            aiAnalysis: {
                relevance: scores.relevance,
                professionalism: scores.professionalism,
                clarity: scores.clarity,
                experience: scores.experience,
                summary: scores.summary
            }
        };
    } catch (error) {
        console.error("Error scoring application:", error);
        return {
            success: false,
            error: error.message
        };
    }
};

// API endpoint for manual rescoring
const scoreApplicationAPI = async (req, res) => {
    try {
        const { projectTitle, projectDescription, projectSkills, coverLetter } = req.body;

        if (!coverLetter || !projectTitle) {
            return res.status(400).json({
                success: false,
                message: "Cover letter and project title are required"
            });
        }

        const result = await scoreApplication(projectTitle, projectDescription, projectSkills, coverLetter);

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: "Application scored successfully",
                aiScore: result.aiScore,
                aiAnalysis: result.aiAnalysis
            });
        } else {
            return res.status(500).json({
                success: false,
                message: "Failed to score application",
                error: result.error
            });
        }
    } catch (error) {
        console.error("Error in scoring API:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to score application",
            error: error.message
        });
    }
};

module.exports = {
    improveDescription,
    scoreApplication,
    scoreApplicationAPI
};
