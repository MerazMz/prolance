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

module.exports = {
    improveDescription
};
