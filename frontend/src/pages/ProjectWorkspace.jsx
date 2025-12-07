import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import axios from 'axios';
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
    HiOutlineReply
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

    // Form states
    const [deliverableForm, setDeliverableForm] = useState({ title: '', description: '', fileUrl: '' });

    useEffect(() => {
        fetchWorkspace();

        // Join project room for real-time updates
        if (socketService.isSocketConnected()) {
            socketService.getSocket().emit('join-project', id);
        }

        // Listen for workspace updates
        const handleWorkStatusUpdate = ({ workStatus, phaseHistory }) => {
            setProject(prev => ({ ...prev, workStatus, phaseHistory: phaseHistory || prev.phaseHistory }));
        };

        const handleDeliverableAdded = ({ deliverable }) => {
            setProject(prev => ({
                ...prev,
                deliverables: [...prev.deliverables, deliverable]
            }));
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

    const handleAcceptProject = async () => {
        setAcceptingProject(true);
        try {
            const token = localStorage.getItem('authToken');
            await axios.post(
                `${API_BASE_URL}/api/projects/${id}/accept-project`,
                {},
                { headers: { Authorization: token } }
            );
            setShowAcceptModal(false);
            fetchWorkspace(); // Refresh to show updated status
        } catch (err) {
            console.error('Error accepting project:', err);
            setError(err.response?.data?.message || 'Failed to accept project');
        } finally {
            setAcceptingProject(false);
        }
    };

    const handleAddDeliverable = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('authToken');
            await axios.post(
                `${API_BASE_URL}/api/projects/${id}/deliverables`,
                { ...deliverableForm, fileName: 'document.pdf', fileSize: 0 },
                { headers: { Authorization: token } }
            );
            setShowDeliverableModal(false);
            setDeliverableForm({ title: '', description: '', fileUrl: '' });
            // Clear error if it was about missing deliverables
            if (error.includes('deliverable')) {
                setError('');
            }
        } catch (err) {
            console.error('Error adding deliverable:', err);
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
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500 mt-3 font-light">Loading workspace...</p>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <HiOutlineBriefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 font-light mb-4">{error || 'Workspace not found'}</p>
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
    const currentPhaseIndex = WORK_PHASES.findIndex(p => p.key === project.workStatus);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 font-light">
                    <Link to="/my-projects" className="hover:text-green-600 transition">
                        My Projects
                    </Link>
                    <HiOutlineChevronRight size={14} />
                    <span className="text-gray-700">{project.title}</span>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-light text-gray-800 mb-2">{project.title}</h1>
                        <p className="text-sm text-gray-500 font-light">
                            {isFreelancer ? `Client: ${project.clientId?.name}` : `Freelancer: ${project.assignedFreelancerId?.name}`}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-light"
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
                        className="bg-white rounded-lg border border-gray-200 p-6"
                    >
                        <h2 className="text-lg font-light text-gray-800 mb-4">Project Progress</h2>

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
                        {/* Deliverables */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-lg border border-gray-200 p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-light text-gray-800">Deliverables</h2>
                                {isFreelancer && (
                                    <button
                                        onClick={() => setShowDeliverableModal(true)}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition font-light"
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
                                            className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <HiOutlineDocumentText className="text-gray-400 flex-shrink-0 mt-1" size={20} />
                                                    <div className="flex-1">
                                                        <h3 className="text-sm font-medium text-gray-800">{deliverable.title}</h3>
                                                        {deliverable.description && (
                                                            <p className="text-sm text-gray-600 font-light mt-1">{deliverable.description}</p>
                                                        )}
                                                        <p className="text-xs text-gray-500 font-light mt-2">
                                                            Uploaded: {formatDate(deliverable.uploadedAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                                {deliverable.fileUrl && (
                                                    <a
                                                        href={deliverable.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded transition"
                                                        title="Download"
                                                    >
                                                        <HiOutlineDownload size={18} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 font-light text-center py-8">
                                    No deliverables yet. {isFreelancer && 'Upload files for client review.'}
                                </p>
                            )}

                            {/* Client: Accept & Close Project Button */}
                            {!isFreelancer && project.status === 'completed' && project.deliverables?.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <button
                                        onClick={() => setShowAcceptModal(true)}
                                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-light py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm flex items-center justify-center gap-2"
                                    >
                                        <HiOutlineCheck size={20} />
                                        Accept Deliverables & Close Project
                                    </button>
                                    <p className="text-xs text-gray-500 font-light mt-2 text-center">
                                        This will finalize the project and mark it as successfully completed
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
                                className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm"
                            >
                                <div className="mb-5">
                                    <h2 className="text-lg font-light text-gray-800">Update Project Status</h2>
                                    <p className="text-xs text-gray-500 font-light mt-1">Track your progress through each phase</p>
                                </div>

                                <div className="space-y-2">
                                    {WORK_PHASES.map((phase, index) => {
                                        const isCompleted = index <= currentPhaseIndex;
                                        const isCurrent = index === currentPhaseIndex;
                                        const canRollback = index < currentPhaseIndex;

                                        return (
                                            <button
                                                key={phase.key}
                                                onClick={() => handlePhaseClickWithValidation(phase, index)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 ${isCurrent
                                                    ? 'bg-gradient-to-r from-green-50 to-green-50/50 border-green-200 shadow-sm'
                                                    : isCompleted
                                                        ? 'bg-green-50/40 border-green-100 hover:bg-green-50/60'
                                                        : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                                                    } cursor-pointer group`}
                                            >
                                                {/* Radix UI Checkbox */}
                                                <Checkbox
                                                    checked={isCompleted}
                                                    className="pointer-events-none"
                                                />

                                                {/* Label */}
                                                <div className="flex-1 text-left">
                                                    <p className={`text-sm font-medium ${isCurrent ? 'text-green-800' : isCompleted ? 'text-green-700' : 'text-gray-700'
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

                                <div className="mt-5 pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 font-light flex items-start gap-2">
                                        <span className="text-gray-400">💡</span>
                                        <span>Click on any previous phase to roll back the project status</span>
                                    </p>
                                </div>

                                {/* Submit Work Button - Only show when completed with deliverables */}
                                {project.workStatus === 'completed' && project.deliverables?.length > 0 && project.status !== 'completed' && (
                                    <div className="mt-5">
                                        <button
                                            onClick={() => setShowSubmitModal(true)}
                                            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-light py-3 px-4 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-sm flex items-center justify-center gap-2"
                                        >
                                            <HiOutlineCheck size={20} />
                                            Submit Work to Client
                                        </button>
                                        <p className="text-xs text-gray-500 font-light mt-2 text-center">
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
                            className="bg-white rounded-lg border border-gray-200 p-6"
                        >
                            <h3 className="text-sm font-medium text-gray-800 mb-4">Project Details</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-gray-500 font-light">Budget:</span>
                                    <p className="text-gray-800 font-light">₹{project.budget?.min?.toLocaleString()} - ₹{project.budget?.max?.toLocaleString()}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500 font-light">Duration:</span>
                                    <p className="text-gray-800 font-light">{project.duration}</p>
                                </div>
                                {project.deadline && (
                                    <div>
                                        <span className="text-gray-500 font-light">Deadline:</span>
                                        <p className="text-gray-800 font-light">{formatDate(project.deadline)}</p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-gray-500 font-light">Status:</span>
                                    <p className="text-gray-800 font-light capitalize">{project.status}</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Deliverable Modal */}
            {showDeliverableModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-lg max-w-md w-full p-6"
                    >
                        <h3 className="text-lg font-light text-gray-800 mb-4">Upload Deliverable</h3>
                        <form onSubmit={handleAddDeliverable} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-700 font-light mb-1">Title</label>
                                <input
                                    type="text"
                                    value={deliverableForm.title}
                                    onChange={(e) => setDeliverableForm({ ...deliverableForm, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-light"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 font-light mb-1">Description</label>
                                <textarea
                                    value={deliverableForm.description}
                                    onChange={(e) => setDeliverableForm({ ...deliverableForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-light"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 font-light mb-1">File URL</label>
                                <input
                                    type="url"
                                    value={deliverableForm.fileUrl}
                                    onChange={(e) => setDeliverableForm({ ...deliverableForm, fileUrl: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-light"
                                    placeholder="https://example.com/file.pdf"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowDeliverableModal(false)}
                                    className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-light"
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-lg max-w-md w-full p-6"
                    >
                        <h3 className="text-lg font-light text-gray-800 mb-3">Confirm Status Rollback</h3>
                        <p className="text-sm text-gray-600 font-light mb-6">
                            Are you sure you want to step back to <strong>{pendingRollbackPhase.phase.label}</strong>?
                            This will remove all progress after this phase.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRollbackConfirm(false);
                                    setPendingRollbackPhase(null);
                                }}
                                className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-light"
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-lg max-w-md w-full p-6"
                    >
                        <h3 className="text-lg font-light text-gray-800 mb-3">Submit Work to Client</h3>
                        <p className="text-sm text-gray-600 font-light mb-6">
                            Are you sure you want to submit this work to the client?
                            This will mark the project as completed and notify the client for final review.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSubmitModal(false)}
                                disabled={submitting}
                                className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-light disabled:opacity-50"
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-lg max-w-md w-full p-6"
                    >
                        <h3 className="text-lg font-light text-gray-800 mb-3">Accept & Close Project</h3>
                        <p className="text-sm text-gray-600 font-light mb-6">
                            Are you sure you want to accept the deliverables and close this project?
                            This action will finalize the project and mark it as successfully completed.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAcceptModal(false)}
                                disabled={acceptingProject}
                                className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-light disabled:opacity-50"
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
        </div>
    );
}
