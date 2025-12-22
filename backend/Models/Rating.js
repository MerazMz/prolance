const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RatingSchema = new Schema({
    freelancerId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    clientId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'projects',
        required: false // Optional - can rate based on chat/contract too
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    review: {
        type: String,
        default: '',
        maxlength: 500
    }
}, {
    timestamps: true
});

// Unique compound index - one client can rate one freelancer only once
// This allows a client to rate multiple different freelancers
RatingSchema.index({ clientId: 1, freelancerId: 1 }, { unique: true });

// Index for efficient queries (get all ratings for a freelancer)
RatingSchema.index({ freelancerId: 1, createdAt: -1 });

const RatingModel = mongoose.model('ratings', RatingSchema);
module.exports = RatingModel;
