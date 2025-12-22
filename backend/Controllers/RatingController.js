const RatingModel = require('../Models/Rating');
const UserModel = require('../Models/User');

// Submit or update a rating
const submitRating = async (req, res) => {
    try {
        const clientId = req.user._id;
        const { freelancerId, rating, review, projectId } = req.body;

        // Validation
        if (!freelancerId || !rating) {
            return res.status(400).json({
                success: false,
                message: 'Freelancer ID and rating are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Check if freelancer exists
        const freelancer = await UserModel.findById(freelancerId);
        if (!freelancer) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer not found'
            });
        }

        // Check if client is trying to rate themselves
        if (clientId.toString() === freelancerId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot rate yourself'
            });
        }

        // Check if rating already exists
        const existingRating = await RatingModel.findOne({
            clientId,
            freelancerId,
            ...(projectId && { projectId })
        });

        let ratingDoc;

        if (existingRating) {
            // Update existing rating
            existingRating.rating = rating;
            if (review !== undefined) existingRating.review = review;
            ratingDoc = await existingRating.save();
        } else {
            // Create new rating
            ratingDoc = await RatingModel.create({
                freelancerId,
                clientId,
                rating,
                review: review || '',
                projectId: projectId || null
            });
        }

        // Recalculate avg rating for freelancer
        await updateFreelancerRating(freelancerId);

        // Populate the rating document
        await ratingDoc.populate('clientId', 'name avatar username');

        res.status(200).json({
            success: true,
            message: existingRating ? 'Rating updated successfully' : 'Rating submitted successfully',
            rating: ratingDoc
        });

    } catch (error) {
        console.error('Error submitting rating:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Helper function to recalculate freelancer's average rating
const updateFreelancerRating = async (freelancerId) => {
    try {
        const ratings = await RatingModel.find({ freelancerId });

        if (ratings.length === 0) {
            await UserModel.findByIdAndUpdate(freelancerId, {
                rating: 0,
                totalReviews: 0
            });
            return;
        }

        const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = totalRating / ratings.length;

        await UserModel.findByIdAndUpdate(freelancerId, {
            rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
            totalReviews: ratings.length
        });

    } catch (error) {
        console.error('Error updating freelancer rating:', error);
        throw error;
    }
};

// Get all ratings for a freelancer
const getFreelancerRatings = async (req, res) => {
    try {
        const { freelancerId } = req.params;

        const ratings = await RatingModel.find({ freelancerId })
            .populate('clientId', 'name avatar username')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            ratings
        });

    } catch (error) {
        console.error('Error fetching ratings:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Check if current user has rated a freelancer
const checkUserRating = async (req, res) => {
    try {
        const clientId = req.user._id;
        const { freelancerId } = req.params;

        const rating = await RatingModel.findOne({
            clientId,
            freelancerId
        });

        res.status(200).json({
            success: true,
            hasRated: !!rating,
            rating: rating || null
        });

    } catch (error) {
        console.error('Error checking rating:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    submitRating,
    getFreelancerRatings,
    checkUserRating
};
