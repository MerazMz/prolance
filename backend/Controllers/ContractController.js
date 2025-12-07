const ContractModel = require('../Models/Contract');
const ConversationModel = require('../Models/Conversation');
const ProjectModel = require('../Models/Project');
const ApplicationModel = require('../Models/Application');

// Create contract proposal (Freelancer only)
const proposeContract = async (req, res) => {
    try {
        const userId = req.user._id;
        const { conversationId, projectId, applicationId, contractDetails } = req.body;

        // Validate required fields
        if (!conversationId || !projectId || !applicationId || !contractDetails) {
            return res.status(400).json({
                message: 'All fields are required',
                success: false
            });
        }

        // Verify conversation exists and user is a participant
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
                message: 'You are not authorized to propose a contract in this conversation',
                success: false
            });
        }

        // Verify application exists and belongs to user
        const application = await ApplicationModel.findById(applicationId);
        if (!application || application.freelancerId.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'Invalid application',
                success: false
            });
        }

        // Get project and client details
        const project = await ProjectModel.findById(projectId);
        if (!project) {
            return res.status(404).json({
                message: 'Project not found',
                success: false
            });
        }

        // Create contract
        const contract = new ContractModel({
            projectId,
            applicationId,
            freelancerId: userId,
            clientId: project.clientId,
            conversationId,
            contractDetails
        });

        await contract.save();

        // Populate details
        await contract.populate('freelancerId', 'name avatar');
        await contract.populate('clientId', 'name avatar');
        await contract.populate('projectId', 'title');

        // Emit Socket.IO event
        const io = req.app.get('io');
        if (io) {
            io.to(`conversation:${conversationId}`).emit('contract-proposed', {
                contract,
                conversationId
            });
        }

        res.status(201).json({
            message: 'Contract proposed successfully',
            success: true,
            contract
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Get contracts by conversation
const getContractsByConversation = async (req, res) => {
    try {
        const userId = req.user._id;
        const { conversationId } = req.params;

        // Verify user is participant
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
                message: 'Not authorized',
                success: false
            });
        }

        const contracts = await ContractModel.find({ conversationId })
            .populate('freelancerId', 'name avatar')
            .populate('clientId', 'name avatar')
            .populate('projectId', 'title')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            contracts
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Update contract status (Client only)
const updateContractStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { status, clientNotes } = req.body;

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({
                message: 'Invalid status',
                success: false
            });
        }

        const contract = await ContractModel.findById(id)
            .populate('projectId')
            .populate('freelancerId', 'name avatar')
            .populate('clientId', 'name avatar');

        if (!contract) {
            return res.status(404).json({
                message: 'Contract not found',
                success: false
            });
        }

        // Verify user is the client
        if (contract.clientId._id.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'Only the client can accept or reject contracts',
                success: false
            });
        }

        contract.status = status;
        contract.respondedAt = new Date();
        if (clientNotes) {
            contract.clientNotes = clientNotes;
        }

        await contract.save();

        // If accepted, update project status
        if (status === 'accepted') {
            contract.projectId.status = 'in-progress';
            contract.projectId.acceptedProposalId = contract.applicationId;
            contract.projectId.assignedFreelancerId = contract.freelancerId._id;
            await contract.projectId.save();
        }

        // Emit Socket.IO event
        const io = req.app.get('io');
        if (io) {
            io.to(`conversation:${contract.conversationId}`).emit('contract-updated', {
                contract,
                conversationId: contract.conversationId
            });
        }

        res.status(200).json({
            message: `Contract ${status} successfully`,
            success: true,
            contract
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Get user's contracts (both as freelancer and client)
const getMyContracts = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, role } = req.query;

        let query = {};

        if (role === 'freelancer') {
            query.freelancerId = userId;
        } else if (role === 'client') {
            query.clientId = userId;
        } else {
            query.$or = [
                { freelancerId: userId },
                { clientId: userId }
            ];
        }

        if (status) {
            query.status = status;
        }

        const contracts = await ContractModel.find(query)
            .populate('freelancerId', 'name avatar')
            .populate('clientId', 'name avatar')
            .populate('projectId', 'title thumbnail status')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            contracts
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
    proposeContract,
    getContractsByConversation,
    updateContractStatus,
    getMyContracts
};
