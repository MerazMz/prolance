import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Generate smart reply suggestions based on conversation history
 * @param {Array} messages - Recent messages from the conversation
 * @param {String} userRole - 'client' or 'freelancer'
 * @returns {Promise} Array of 3 smart reply suggestions
 */
export const generateSmartReplies = async (messages, userRole = 'freelancer') => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await axios.post(
            `${API_BASE_URL}/api/ai/smart-replies`,
            { messages, userRole },
            {
                headers: { Authorization: token },
                timeout: 15000 // 15 second timeout
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error generating smart replies:', error);
        throw error;
    }
};

/**
 * Analyze the tone of a message
 * @param {String} message - Message to analyze
 * @returns {Promise} Tone analysis with tone type, confidence, and warnings
 */
export const analyzeMessageTone = async (message) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await axios.post(
            `${API_BASE_URL}/api/ai/analyze-tone`,
            { message },
            {
                headers: { Authorization: token },
                timeout: 10000 // 10 second timeout
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error analyzing tone:', error);
        throw error;
    }
};

/**
 * Detect the intent of a message
 * @param {String} message - Message to analyze
 * @returns {Promise} Intent detection result
 */
export const detectMessageIntent = async (message) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await axios.post(
            `${API_BASE_URL}/api/ai/detect-intent`,
            { message },
            {
                headers: { Authorization: token },
                timeout: 10000
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error detecting intent:', error);
        throw error;
    }
};

/**
 * Summarize a conversation
 * @param {Array} messages - All messages to summarize
 * @param {Number} limit - Optional limit for number of recent messages
 * @returns {Promise} Structured conversation summary
 */
export const summarizeConversation = async (messages, limit = null) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await axios.post(
            `${API_BASE_URL}/api/ai/summarize-conversation`,
            { messages, limit },
            {
                headers: { Authorization: token },
                timeout: 20000 // 20 second timeout for summarization
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error summarizing conversation:', error);
        throw error;
    }
};
