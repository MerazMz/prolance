import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import socketService from '../services/socketService';
import { useAuth } from '../context/AuthContext';
import {
    HiOutlineArrowLeft,
    HiOutlineBriefcase,
    HiOutlinePlus,
    HiOutlineDocumentText,
    HiOutlineDownload,
    HiOutlineChevronRight,
    HiOutlineCheck,
    HiOutlineReply,
    HiOutlineTrash
} from 'react-icons/hi';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import { Checkbox } from '../components/ui/Checkbox';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const WORK_PHASES = [
    { key: 'planning', label: 'Planning' },
    { key: 'designing', label: 'Designing' },
    { key: 'development', label: 'Development' },
    { key: 'testing', label: 'Testing' },
    { key: 'review', label: 'Review' },
    { key: 'completed', label: 'Completed' }
];

export default function ProjectWorkspace() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [project, setProject] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Modals
    const [showDeliverableModal, setShowDeliverableModal] = useState(false);
    const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);
    const [pendingRollbackPhase, setPendingRollbackPhase] = useState(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [acceptingProject, setAcceptingProject] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewComments, setReviewComments] = useState('');
    const [requestingReview, setRequestingReview] = useState(false);
    const [showMilestoneModal, setShowMilestoneModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);

    // Payment
    const [paymentDetails, setPaymentDetails] = useState(null);

    // Form states
    const [deliverableForm, setDeliverableForm] = useState({ title: '', description: '', fileUrl: '' });

    useEffect(() => {
        fetchWorkspace();
        fetchPaymentDetails();

        // Join project room for real-time updates
        if (socketService.isSocketConnected()) {
            socketService.getSocket().emit('join-project', id);
        }

        // Listen for workspace updates
        const handleWorkStatusUpdate = ({ workStatus, phaseHistory }) => {
            setProject(prev => ({ ...prev, workStatus, phaseHistory: phaseHistory || prev.phaseHistory }));
        };

        const handleDeliverableAdded = ({ deliverable }) => {
            setProject(prev => {
                // Check if deliverable already exists to prevent duplicates
                const exists = prev.deliverables?.some(d => d._id === deliverable._id);
                if (exists) return prev;

                return {
                    ...prev,
                    deliverables: [...(prev.deliverables || []), deliverable]
                };
            });
        };

        socketService.on('work-status-updated', handleWorkStatusUpdate);
        socketService.on('deliverable-added', handleDeliverableAdded);

        return () => {
            if (socketService.isSocketConnected()) {
                socketService.getSocket().emit('leave-project', id);
            }
            socketService.off('work-status-updated', handleWorkStatusUpdate);
            socketService.off('deliverable-added', handleDeliverableAdded);
        };
    }, [id]);

    const fetchWorkspace = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                `${API_BASE_URL}/api/projects/${id}/workspace`,
                { headers: { Authorization: token } }
            );

            setProject(response.data.project);
            setUserRole(response.data.userRole);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load workspace');
            setLoading(false);
        }
    };

    // Celebration confetti effect when payment is successful
    useEffect(() => {
        if (project?.status === 'closed' && paymentDetails) {
            // Wait a bit for the UI to render
            const timer = setTimeout(() => {
                // Party popper effect from multiple angles
                const duration = 3000;
                const animationEnd = Date.now() + duration;
                const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

                const randomInRange = (min, max) => Math.random() * (max - min) + min;

                const interval = setInterval(() => {
                    const timeLeft = animationEnd - Date.now();

                    if (timeLeft <= 0) {
                        return clearInterval(interval);
                    }

                    const particleCount = 50 * (timeLeft / duration);

                    // Launch confetti from left and right
                    confetti({
                        ...defaults,
                        particleCount,
                        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                    });
                    confetti({
                        ...defaults,
                        particleCount,
                        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                    });
                }, 250);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [project?.status, paymentDetails]);

    const updateWorkStatus = async (newStatus, isRollback = false) => {
        if (isRollback) {
            // For rollback, update the phase history to only include phases up to the selected one
            const newPhaseIndex = WORK_PHASES.findIndex(p => p.key === newStatus);
            const updatedHistory = (project.phaseHistory || []).filter((entry, index) => {
                const entryPhaseIndex = WORK_PHASES.findIndex(p => p.key === entry.phase);
                return entryPhaseIndex <= newPhaseIndex;
            });

            setProject(prev => ({
                ...prev,
                workStatus: newStatus,
                phaseHistory: updatedHistory
            }));
        } else {
            // Forward progress - add new phase entry
            const newPhaseEntry = {
                phase: newStatus,
                completedAt: new Date().toISOString()
            };
            setProject(prev => ({
                ...prev,
                workStatus: newStatus,
                phaseHistory: [...(prev.phaseHistory || []), newPhaseEntry]
            }));
        }

        try {
            const token = localStorage.getItem('authToken');
            await axios.patch(
                `${API_BASE_URL}/api/projects/${id}/work-status`,
                { workStatus: newStatus, isRollback },
                { headers: { Authorization: token } }
            );
        } catch (err) {
            console.error('Error updating status:', err);
            // Revert on error
            fetchWorkspace();
        }
    };

    const handlePhaseClick = (phase, index) => {
        const isRollback = index < currentPhaseIndex;

        if (isRollback) {
            // Show confirmation dialog for rolling back
            setPendingRollbackPhase({ phase, index });
            setShowRollbackConfirm(true);
        } else {
            // Allow forward progression
            updateWorkStatus(phase.key, false);
        }
    };

    const confirmRollback = () => {
        if (pendingRollbackPhase) {
            updateWorkStatus(pendingRollbackPhase.phase.key, true);
        }
        setShowRollbackConfirm(false);
        setPendingRollbackPhase(null);
    };

    const handlePhaseClickWithValidation = (phase, index) => {
        // Check if trying to mark as completed without deliverables
        if (phase.key === 'completed' && (!project.deliverables || project.deliverables.length === 0)) {
            setError('Please add at least one deliverable before marking the project as completed');
            setTimeout(() => setError(''), 5000);
            return;
        }
        handlePhaseClick(phase, index);
    };

    const handleSubmitWork = async () => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('authToken');
            await axios.post(
                `${API_BASE_URL}/api/projects/${id}/submit-work`,
                {},
                { headers: { Authorization: token } }
            );
            setShowSubmitModal(false);
            fetchWorkspace(); // Refresh to show updated status
        } catch (err) {
            console.error('Error submitting work:', err);
            setError(err.response?.data?.message || 'Failed to submit work');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteDeliverable = async (deliverableId) => {
        if (!window.confirm('Are you sure you want to delete this deliverable?')) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            await axios.delete(
                `${API_BASE_URL}/api/projects/${id}/deliverables/${deliverableId}`,
                { headers: { Authorization: token } }
            );

            // Update local state immediately by filtering out the deleted deliverable
            setProject(prev => ({
                ...prev,
                deliverables: prev.deliverables.filter(d => d._id !== deliverableId)
            }));
        } catch (error) {
            console.error('Error deleting deliverable:', error);
            setError(error.response?.data?.message || 'Failed to delete deliverable');
        }
    };

    const handleAcceptProject = async () => {
        try {
            const token = localStorage.getItem('authToken');

            // First try to accept - if payment is required, backend will tell us
            const response = await axios.post(
                `${API_BASE_URL}/api/projects/${id}/accept-project`,
                {},
                { headers: { Authorization: token } }
            );

            // If successful, refresh workspace
            setShowAcceptModal(false);
            fetchWorkspace();
        } catch (err) {
            // Check if payment is required
            if (err.response?.data?.requiresPayment) {
                // Navigate to payment page
                // Get the contract to find the final amount
                try {
                    const contractResponse = await axios.get(
                        `${API_BASE_URL}/api/contracts/my`,
                        { headers: { Authorization: localStorage.getItem('authToken') } }
                    );

                    // Find the contract for this project
                    const projectContract = contractResponse.data.contracts?.find(
                        c => c.projectId._id === id || c.projectId === id
                    );

                    const amount = projectContract?.contractDetails?.finalAmount || 0;

                    setShowAcceptModal(false);
                    navigate(`/payment/${id}`, {
                        state: { amount }
                    });
                } catch (contractErr) {
                    console.error('Error fetching contract:', contractErr);
                    setError('Failed to load payment information');
                    setShowAcceptModal(false);
                }
            } else {
                console.error('Error accepting project:', err);
                setError(err.response?.data?.message || 'Failed to accept project');
                setShowAcceptModal(false);
            }
        }
    };

    const handleRequestReview = async () => {
        try {
            setRequestingReview(true);
            const token = localStorage.getItem('authToken');
            await axios.post(
                `${API_BASE_URL}/api/projects/${id}/request-review`,
                { comments: reviewComments },
                { headers: { Authorization: token } }
            );
            setShowReviewModal(false);
            setReviewComments('');
            fetchWorkspace();
        } catch (error) {
            console.error('Error requesting review:', error);
            setError(error.response?.data?.message || 'Failed to request review');
        } finally {
            setRequestingReview(false);
        }
    };

    const handleAddDeliverable = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(
                `${API_BASE_URL}/api/projects/${id}/deliverables`,
                { ...deliverableForm, fileName: 'document.pdf', fileSize: 0 },
                { headers: { Authorization: token } }
            );

            // Update local state immediately with the new deliverable
            if (response.data.deliverable) {
                setProject(prev => {
                    // Check if deliverable already exists to prevent duplicates
                    const exists = prev.deliverables?.some(d => d._id === response.data.deliverable._id);
                    if (exists) return prev;

                    return {
                        ...prev,
                        deliverables: [...(prev.deliverables || []), response.data.deliverable]
                    };
                });
            }

            setShowDeliverableModal(false);
            setDeliverableForm({ title: '', description: '', fileUrl: '' });
            // Clear error if it was about missing deliverables
            if (error.includes('deliverable')) {
                setError('');
            }
        } catch (err) {
            console.error('Error adding deliverable:', err);
            setError(err.response?.data?.message || 'Failed to add deliverable');
        }
    };

    const fetchPaymentDetails = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                `${API_BASE_URL}/api/payments/project/${id}`,
                { headers: { Authorization: token } }
            );
            if (response.data.success) {
                setPaymentDetails(response.data.payment);
            }
        } catch (err) {
            // Payment not found is ok - means project not yet paid
            if (err.response?.status !== 404) {
                console.error('Error fetching payment details:', err);
            }
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatDateTime = (date) => {
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 font-light">Loading workspace...</p>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
                <div className="text-center">
                    <HiOutlineBriefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-light mb-4">{error || 'Workspace not found'}</p>
                    <button
                        onClick={() => navigate('/my-projects')}
                        className="px-4 py-2 text-sm text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition font-light"
                    >
                        Back to Projects
                    </button>
                </div>
            </div>
        );
    }

    const isFreelancer = userRole === 'freelancer';
    const isClient = userRole === 'client';
    const currentPhaseIndex = WORK_PHASES.findIndex(p => p.key === project.workStatus);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6 font-light">
                    <Link to="/my-projects" className="hover:text-green-600 transition">
                        My Projects
                    </Link>
                    <HiOutlineChevronRight size={14} />
                    <span className="text-gray-700 dark:text-gray-300">{project.title}</span>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-light text-gray-800 dark:text-gray-200 mb-2">{project.title}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                            {isFreelancer ? `Client: ${project.clientId?.name}` : `Freelancer: ${project.assignedFreelancerId?.name}`}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-lg transition font-light"
                    >
                        <HiOutlineArrowLeft size={16} />
                        Back
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-light"
                    >
                        {error}
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* MUI Timeline - Progress Tracker */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 dark:border-gray-800 p-6"
                    >
                        <h2 className="text-lg font-light text-gray-800 dark:text-gray-200 mb-4">Project Progress</h2>

                        <Timeline position="right" sx={{ padding: 0, margin: 0 }}>
                            {WORK_PHASES.map((phase, index) => {
                                const phaseEntry = project.phaseHistory?.find(h => h.phase === phase.key);
                                const isCompleted = phaseEntry !== undefined;
                                const isCurrent = phase.key === project.workStatus;
                                const isLast = index === WORK_PHASES.length - 1;

                                return (
                                    <TimelineItem key={phase.key}>
                                        <TimelineOppositeContent
                                            sx={{
                                                flex: 0.3,
                                                paddingLeft: 0,
                                                paddingRight: '12px',
                                                fontSize: '0.75rem',
                                                color: isCompleted ? '#10B981' : '#9CA3AF'
                                            }}
                                        >
                                            {/* {phaseEntry ? formatDateTime(phaseEntry.completedAt) : ''} */}
                                        </TimelineOppositeContent>
                                        <TimelineSeparator>
                                            <TimelineDot
                                                sx={{
                                                    bgcolor: isCompleted ? '#10B981' : '#E5E7EB',
                                                    borderColor: isCompleted ? '#10B981' : '#D1D5DB',
                                                    width: isCurrent ? 14 : 12,
                                                    height: isCurrent ? 14 : 12
                                                }}
                                            />
                                            {!isLast && (
                                                <TimelineConnector
                                                    sx={{
                                                        bgcolor: isCompleted ? '#10B981' : '#E5E7EB',
                                                        width: '2px'
                                                    }}
                                                />
                                            )}
                                        </TimelineSeparator>
                                        <TimelineContent
                                            sx={{
                                                paddingLeft: '12px',
                                                paddingRight: 0,
                                                fontSize: '0.875rem',
                                                fontWeight: isCurrent ? 600 : 400,
                                                color: isCurrent ? '#10B981' : isCompleted ? '#374151' : '#9CA3AF'
                                            }}
                                        >
                                            {phase.label}
                                            {isCurrent && <span style={{ fontSize: '0.75rem', color: '#10B981', marginLeft: '8px' }}>● Current</span>}
                                        </TimelineContent>
                                    </TimelineItem>
                                );
                            })}
                        </Timeline>
                    </motion.div>

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Payment Receipt - Show when project is closed and payment exists */}
                        {project.status === 'closed' && paymentDetails && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 rounded-lg border-2 border-green-200 dark:border-green-800 p-6 shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-green-600 dark:bg-green-700 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-green-800 dark:text-green-300">
                                                {isClient ? 'Payment Done Successfully' : 'Payment Received Successfully'}
                                            </h2>
                                            <p className="text-sm text-green-700 dark:text-green-400 font-light">
                                                {isClient ? 'Payment completed • Project closed' : 'Transaction completed • Project closed'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-green-800 dark:text-green-300">₹{paymentDetails.amount?.toLocaleString('en-IN')}</p>
                                        <p className="text-xs text-green-600 dark:text-green-400 font-light">
                                            {isClient ? 'Amount paid' : 'Amount received'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-green-200 dark:border-green-800">
                                    <div>
                                        <p className="text-xs text-green-700 dark:text-green-400 font-light mb-1">Transaction ID</p>
                                        <p className="text-sm font-mono text-green-900 dark:text-green-300">{paymentDetails.razorpayPaymentId || 'Processing...'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-green-700 dark:text-green-400 font-light mb-1">Payment Date</p>
                                        <p className="text-sm text-green-900 dark:text-green-300">{formatDate(paymentDetails.capturedAt || paymentDetails.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-green-700 dark:text-green-400 font-light mb-1">Payment Method</p>
                                        <p className="text-sm text-green-900 dark:text-green-300 capitalize">{paymentDetails.paymentMethod || 'Online Payment'}</p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800 flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-light">This project has been successfully completed and payment has been processed.</span>
                                </div>
                            </motion.div>
                        )}

                        {/* Deliverables */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 dark:border-gray-800 p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-light text-gray-800 dark:text-gray-200">Deliverables</h2>
                                {isFreelancer && (
                                    <button
                                        onClick={() => setShowDeliverableModal(true)}
                                        disabled={project.status === 'closed'}
                                        className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition font-light ${project.status === 'closed'
                                            ? 'text-gray-400 bg-gray-100 dark:bg-gray-800 dark:text-gray-600 border border-gray-200 dark:border-gray-700 cursor-not-allowed'
                                            : 'text-green-600 dark:text-green-400 border border-green-600 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-600 cursor-pointer '
                                            }`}
                                        title={project.status === 'closed' ? 'Project is closed' : 'Upload a new deliverable'}
                                    >
                                        <HiOutlinePlus size={16} />
                                        Upload Deliverable
                                    </button>
                                )}
                            </div>

                            {project.deliverables && project.deliverables.length > 0 ? (
                                <div className="space-y-3">
                                    {project.deliverables.map((deliverable) => (
                                        <div
                                            key={deliverable._id}
                                            className="p-4 border border-gray-100 dark:border-gray-800 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:bg-gray-800 transition"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <HiOutlineDocumentText className="text-gray-400 flex-shrink-0 mt-1" size={20} />
                                                    <div className="flex-1">
                                                        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">{deliverable.title}</h3>
                                                        {deliverable.description && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 font-light mt-1">{deliverable.description}</p>
                                                        )}
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-light mt-2">
                                                            Uploaded: {formatDate(deliverable.uploadedAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {deliverable.fileUrl && (
                                                        <a
                                                            href={deliverable.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition"
                                                            title="Download"
                                                        >
                                                            <HiOutlineDownload size={18} />
                                                        </a>
                                                    )}
                                                    {isFreelancer && (
                                                        <button
                                                            onClick={() => handleDeleteDeliverable(deliverable._id)}
                                                            disabled={project.status === 'closed'}
                                                            className={`p-2 rounded transition ${project.status === 'closed'
                                                                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                                                : 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'
                                                                }`}
                                                            title={project.status === 'closed' ? 'Project is closed' : 'Delete deliverable'}
                                                        >
                                                            <HiOutlineTrash size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-light text-center py-8">
                                    No deliverables yet. {isFreelancer && 'Upload files for client review.'}
                                </p>
                            )}

                            {/* Payment Required Notice for Clients */}
                            {!isFreelancer && project.deliverables?.length > 0 && !paymentDetails && project.status !== 'closed' && (
                                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Payment Required</h4>
                                            <p className="text-sm text-blue-700 dark:text-blue-400 font-light">
                                                Accept the project to proceed with payment.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Client: Request Review & Accept Buttons */}
                            {!isFreelancer && project.status === 'completed' && project.deliverables?.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Request Review Button */}
                                        <button
                                            onClick={() => setShowReviewModal(true)}
                                            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-light py-3 px-4 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm flex items-center justify-center gap-2"
                                        >
                                            <HiOutlineArrowLeft size={20} />
                                            Request Review
                                        </button>
                                        {/* Accept & Close Button */}
                                        <button
                                            onClick={() => setShowAcceptModal(true)}
                                            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-light py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm flex items-center justify-center gap-2"
                                        >
                                            <HiOutlineCheck size={20} />
                                            Accept & Pay
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light mt-3 text-center">
                                        Request changes or accept the deliverables to finalize the project
                                    </p>
                                </div>
                            )}
                        </motion.div>

                        {/* Status Selector - Vertical Checkboxes (Freelancer Only) */}
                        {isFreelancer && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 dark:border-gray-800 p-6 shadow-sm"
                            >
                                <div className="mb-5">
                                    <h2 className="text-lg font-light text-gray-800 dark:text-gray-200">Update Project Status</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light mt-1">Track your progress through each phase</p>
                                </div>

                                <div className="space-y-2">
                                    {WORK_PHASES.map((phase, index) => {
                                        const isCompleted = index <= currentPhaseIndex;
                                        const isCurrent = index === currentPhaseIndex;
                                        const canRollback = index < currentPhaseIndex;
                                        const isProjectClosed = project.status === 'closed';

                                        return (
                                            <button
                                                key={phase.key}
                                                onClick={() => handlePhaseClickWithValidation(phase, index)}
                                                disabled={isProjectClosed}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 ${isProjectClosed
                                                    ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-60'
                                                    : isCurrent
                                                        ? 'bg-gradient-to-r from-green-50 to-green-50/50 dark:from-green-900/30 dark:to-green-900/10 border-green-200 dark:border-green-700 shadow-sm'
                                                        : isCompleted
                                                            ? 'bg-green-50/40 dark:bg-green-900/20 border-green-100 dark:border-green-800 hover:bg-green-50/60 dark:hover:bg-green-900/30'
                                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                                                    } ${isProjectClosed ? '' : 'cursor-pointer'} group`}
                                                title={isProjectClosed ? 'Project is closed' : ''}
                                            >
                                                {/* Radix UI Checkbox */}
                                                <Checkbox
                                                    checked={isCompleted}
                                                    className="pointer-events-none"
                                                />

                                                {/* Label */}
                                                <div className="flex-1 text-left">
                                                    <p className={`text-sm font-medium ${isCurrent ? 'text-green-800' : isCompleted ? 'text-green-700' : 'text-gray-700 dark:text-gray-300'
                                                        }`}>
                                                        {phase.label}
                                                    </p>
                                                    {isCurrent && (
                                                        <p className="text-xs text-green-600 font-light">Current phase</p>
                                                    )}
                                                </div>

                                                {/* Undo Icon for Rollback */}
                                                {canRollback && (
                                                    <HiOutlineReply
                                                        size={20}
                                                        className="text-red-500 flex-shrink-0"
                                                        title="Step back"
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light flex items-start gap-2">
                                        <span className="text-gray-400">💡</span>
                                        <span>Click on any previous phase to roll back the project status</span>
                                    </p>
                                </div>

                                {/* Submit Work Button - Only show when completed with deliverables */}
                                {project.workStatus === 'completed' && project.deliverables?.length > 0 && project.status !== 'completed' && project.status !== 'closed' && (
                                    <div className="mt-5">
                                        <button
                                            onClick={() => setShowSubmitModal(true)}
                                            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-light py-3 px-4 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-sm flex items-center justify-center gap-2"
                                        >
                                            <HiOutlineCheck size={20} />
                                            Submit Work to Client
                                        </button>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-light mt-2 text-center">
                                            Finalize and submit your work for client review
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Project Info */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 dark:border-gray-800 p-6"
                        >
                            <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-4">Project Details</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400 font-light">Budget:</span>
                                    <p className="text-gray-800 dark:text-gray-200 font-light">₹{project.budget?.min?.toLocaleString()} - ₹{project.budget?.max?.toLocaleString()}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400 font-light">Duration:</span>
                                    <p className="text-gray-800 dark:text-gray-200 font-light">{project.duration}</p>
                                </div>
                                {project.deadline && (
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-400 font-light">Deadline:</span>
                                        <p className="text-gray-800 dark:text-gray-200 font-light">{formatDate(project.deadline)}</p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400 font-light">Status:</span>
                                    <p className="text-gray-800 dark:text-gray-200 font-light capitalize">{project.status}</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Deliverable Modal */}
            {showDeliverableModal && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6"
                    >
                        <h3 className="text-lg font-light text-gray-800 dark:text-gray-200 mb-4">Upload Deliverable</h3>
                        <form onSubmit={handleAddDeliverable} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-700 dark:text-gray-300 font-light mb-1">Title</label>
                                <input
                                    type="text"
                                    value={deliverableForm.title}
                                    onChange={(e) => setDeliverableForm({ ...deliverableForm, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-light"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 dark:text-gray-300 font-light mb-1">Description</label>
                                <textarea
                                    value={deliverableForm.description}
                                    onChange={(e) => setDeliverableForm({ ...deliverableForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-light"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 dark:text-gray-300 font-light mb-1">File URL</label>
                                <input
                                    type="url"
                                    value={deliverableForm.fileUrl}
                                    onChange={(e) => setDeliverableForm({ ...deliverableForm, fileUrl: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-light"
                                    placeholder="https://example.com/file.pdf"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowDeliverableModal(false)}
                                    className="flex-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800 transition font-light"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition font-light"
                                >
                                    Upload
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Rollback Confirmation Modal */}
            {showRollbackConfirm && pendingRollbackPhase && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-lg max-w-md w-full p-6 dark:bg-gray-800"
                    >
                        <h3 className="text-lg font-light text-gray-800 dark:text-gray-200 mb-3">Confirm Status Rollback</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-light mb-6">
                            Are you sure you want to step back to <strong>{pendingRollbackPhase.phase.label}</strong>?
                            This will remove all progress after this phase.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRollbackConfirm(false);
                                    setPendingRollbackPhase(null);
                                }}
                                className="flex-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-200 border border-gray-200 dark:border-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800 transition font-light"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRollback}
                                className="flex-1 px-4 py-2 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition font-light"
                            >
                                Yes, Roll Back
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Submit Work Confirmation Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6"
                    >
                        <h3 className="text-lg font-light text-gray-800 dark:text-gray-200 mb-3">Submit Work to Client</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-light mb-6">
                            Are you sure you want to submit this work to the client?
                            This will mark the project as completed and notify the client for final review.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSubmitModal(false)}
                                disabled={submitting}
                                className="flex-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-200 border border-gray-200 dark:border-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800 transition font-light disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitWork}
                                disabled={submitting}
                                className="flex-1 px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition font-light disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <HiOutlineCheck size={18} />
                                        Yes, Submit
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Client: Accept Project Confirmation Modal */}
            {showAcceptModal && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6"
                    >
                        <h3 className="text-lg font-light text-gray-800 dark:text-gray-200 mb-3">Accept & Pay for Project</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-light mb-6">
                            You'll be redirected to make a secure payment. After successful payment, the project will be closed and marked as completed.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAcceptModal(false)}
                                disabled={acceptingProject}
                                className="flex-1  px-4 py-2 text-sm text-gray-600 dark:text-gray-200 border border-gray-200 dark:border-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800 transition font-light disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAcceptProject}
                                disabled={acceptingProject}
                                className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition font-light disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {acceptingProject ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Accepting...
                                    </>
                                ) : (
                                    <>
                                        <HiOutlineCheck size={18} />
                                        Yes, Accept & Close
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Client: Request Review Modal */}
            {showReviewModal && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6"
                    >
                        <h3 className="text-lg font-light text-gray-800 dark:text-gray-200 mb-3">Request Review</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-light mb-4">
                            Send the project back to the review phase to request changes or improvements.
                        </p>
                        <div className="mb-6">
                            <label className="block text-sm text-gray-700 dark:text-gray-300 font-light mb-2">
                                Comments / Feedback (Optional)
                            </label>
                            <textarea
                                value={reviewComments}
                                onChange={(e) => setReviewComments(e.target.value)}
                                placeholder="Describe what needs to be changed or improved..."
                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-orange-500 resize-none font-light"
                                rows={4}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowReviewModal(false);
                                    setReviewComments('');
                                }}
                                disabled={requestingReview}
                                className="flex-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-200 border border-gray-200 dark:border-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800 transition font-light disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRequestReview}
                                disabled={requestingReview}
                                className="flex-1 px-4 py-2 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition font-light disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {requestingReview ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Requesting...
                                    </>
                                ) : (
                                    <>
                                        <HiOutlineArrowLeft size={18} />
                                        Request Review
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
