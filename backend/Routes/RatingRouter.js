const express = require('express');
const {
    submitRating,
    getFreelancerRatings,
    checkUserRating
} = require('../Controllers/RatingController');
const ensureAuthenticated = require('../Middlewares/Auth');

const router = express.Router();

// POST /api/ratings - Submit or update a rating
router.post('/', ensureAuthenticated, submitRating);

// GET /api/ratings/freelancer/:freelancerId - Get all ratings for a freelancer
router.get('/freelancer/:freelancerId', getFreelancerRatings);

// GET /api/ratings/check/:freelancerId - Check if current user has rated this freelancer
router.get('/check/:freelancerId', ensureAuthenticated, checkUserRating);

module.exports = router;
