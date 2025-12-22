import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Submit or update a rating
export const submitRating = async (freelancerId, rating, review = '', projectId = null) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await axios.post(
            `${API_BASE_URL}/api/ratings`,
            { freelancerId, rating, review, projectId },
            {
                headers: { Authorization: token }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error submitting rating:', error);
        throw error;
    }
};

// Get all ratings for a freelancer
export const getFreelancerRatings = async (freelancerId) => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/api/ratings/freelancer/${freelancerId}`
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching freelancer ratings:', error);
        throw error;
    }
};

// Check if current user has rated a freelancer
export const checkUserRating = async (freelancerId) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(
            `${API_BASE_URL}/api/ratings/check/${freelancerId}`,
            {
                headers: { Authorization: token }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error checking user rating:', error);
        throw error;
    }
};
