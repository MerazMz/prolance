const ConversationModel = require('../Models/Conversation');
const MessageModel = require('../Models/Message');
const UserModel = require('../Models/User');

// Get all conversations for the current user
const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        const conversations = await ConversationModel.find({
            participants: userId
        })
            .populate('participants', 'name avatar username')
            .populate('projectId', 'title thumbnail')
            .sort({ lastMessageAt: -1 });

        // Get unread count for each conversation
        const conversationsWithUnread = await Promise.all(
            conversations.map(async (conv) => {
                const unreadCount = await MessageModel.countDocuments({
                    conversationId: conv._id,
                    senderId: { $ne: userId },
                    read: false
                });

                return {
                    ...conv.toObject(),
                    unreadCount
                };
            })
        );

        res.status(200).json({
            success: true,
            conversations: conversationsWithUnread
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Get conversation by ID with messages
const getConversationById = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const conversation = await ConversationModel.findById(id)
            .populate('participants', 'name avatar username')
            .populate('projectId', 'title category budget');

        if (!conversation) {
            return res.status(404).json({
                message: 'Conversation not found',
                success: false
            });
        }

        // Check if user is a participant
        const isParticipant = conversation.participants.some(
            p => p._id.toString() === userId.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                message: 'You are not authorized to view this conversation',
                success: false
            });
        }

        // Get messages with pagination
        const skip = (Number(page) - 1) * Number(limit);
        const messages = await MessageModel.find({ conversationId: id })
            .populate('senderId', 'name avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await MessageModel.countDocuments({ conversationId: id });

        // Mark messages as read
        await MessageModel.updateMany(
            {
                conversationId: id,
                senderId: { $ne: userId },
                read: false
            },
            {
                $set: { read: true, readAt: new Date() }
            }
        );

        res.status(200).json({
            success: true,
            conversation,
            messages: messages.reverse(), // Show oldest first
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Send a message
const sendMessage = async (req, res) => {
    try {
        const userId = req.user._id;
        const { conversationId, content } = req.body;

        if (!conversationId || !content || !content.trim()) {
            return res.status(400).json({
                message: 'Conversation ID and message content are required',
                success: false
            });
        }

        // Check if conversation exists and user is a participant
        const conversation = await ConversationModel.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                message: 'Conversation not found',
                success: false
            });
        }

        const isParticipant = conversation.participants.some(
            p => p.toString() === userId.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                message: 'You are not authorized to send messages in this conversation',
                success: false
            });
        }

        // Create message
        const message = new MessageModel({
            conversationId,
            senderId: userId,
            content: content.trim()
        });

        await message.save();

        // Update conversation's last message
        conversation.lastMessage = {
            content: content.trim(),
            senderId: userId,
            createdAt: message.createdAt
        };
        conversation.lastMessageAt = message.createdAt;
        await conversation.save();

        // Populate sender info
        await message.populate('senderId', 'name avatar');

        res.status(201).json({
            success: true,
            message
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Mark messages as read
const markAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const { conversationId } = req.body;

        if (!conversationId) {
            return res.status(400).json({
                message: 'Conversation ID is required',
                success: false
            });
        }

        const result = await MessageModel.updateMany(
            {
                conversationId,
                senderId: { $ne: userId },
                read: false
            },
            {
                $set: { read: true, readAt: new Date() }
            }
        );

        res.status(200).json({
            success: true,
            modifiedCount: result.modifiedCount
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Delete a message (user can only delete their own messages)
const deleteMessage = async (req, res) => {
    try {
        const userId = req.user._id;
        const { messageId } = req.params;

        const message = await MessageModel.findById(messageId);

        if (!message) {
            return res.status(404).json({
                message: 'Message not found',
                success: false
            });
        }

        // Check if user is the sender
        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'You can only delete your own messages',
                success: false
            });
        }

        const conversationId = message.conversationId;
        await MessageModel.findByIdAndDelete(messageId);

        // Emit Socket.IO event to notify all participants
        const io = req.app.get('io');
        if (io) {
            io.to(`conversation:${conversationId}`).emit('message-deleted', {
                messageId,
                conversationId
            });
        }

        res.status(200).json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

module.exports = {
    getConversations,
    getConversationById,
    sendMessage,
    markAsRead,
    deleteMessage
};
