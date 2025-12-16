const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConversationSchema = new Schema({
    participants: [{
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    }],
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'projects',
        required: true
    },
    applicationId: {
        type: Schema.Types.ObjectId,
        ref: 'applications',
        required: true
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    lastMessage: {
        content: String,
        senderId: {
            type: Schema.Types.ObjectId,
            ref: 'users'
        },
        createdAt: Date
    }
}, {
    timestamps: true
});

// Validate exactly 2 participants
ConversationSchema.pre('save', function (next) {
    if (this.participants.length !== 2) {
        next(new Error('A conversation must have exactly 2 participants'));
    }
    next();
});

// Index for faster queries
ConversationSchema.index({ participants: 1, lastMessageAt: -1 });
ConversationSchema.index({ projectId: 1 });

// Ensure unique conversation per application (this also creates an index)
ConversationSchema.index({ applicationId: 1 }, { unique: true });

const ConversationModel = mongoose.model('conversations', ConversationSchema);
module.exports = ConversationModel;
