import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    HiOutlineBriefcase,
    HiOutlineEye,
    HiOutlineEyeOff,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineClock,
    HiOutlineChat,
    HiOutlinePlus,
    HiOutlineX,
    HiOutlineCheck,
    HiOutlineBan,
    HiChevronDown,
    HiChevronUp
} from 'react-icons/hi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function MyProjects() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load saved filter from localStorage or default to 'all'
    const [filter, setFilter] = useState(() => {
        return localStorage.getItem('myProjectsFilter') || 'all';
    });

    // Load saved roleFilter from localStorage or default based on user role
    const [roleFilter, setRoleFilter] = useState(() => {
        const saved = localStorage.getItem('myProjectsRoleFilter');
        return saved || (user?.role === 'freelancer' ? 'freelancer' : 'client');
    });

    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loadingApplications, setLoadingApplications] = useState(false);
    const [expandedApplication, setExpandedApplication] = useState(null);

    // Save filter to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('myProjectsFilter', filter);
    }, [filter]);

    // Save roleFilter to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('myProjectsRoleFilter', roleFilter);
    }, [roleFilter]);

    useEffect(() => {
        fetchProjects();
    }, [filter, roleFilter]);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            let url = `${API_BASE_URL}/api/projects/my/projects`;

            const params = new URLSearchParams();
            if (filter !== 'all') {
                // For completed tab, fetch both completed and closed projects
                if (filter === 'completed') {
                    // Fetch all projects and filter on frontend
                    // Or we can make multiple requests, but simpler to filter client-side
                } else {
                    params.append('status', filter);
                }
            }
            if (roleFilter !== 'all') {
                params.append('role', roleFilter);
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await axios.get(url, {
                headers: { Authorization: token }
            });

            let fetchedProjects = response.data.projects || [];

            // Filter for completed tab - include both completed and closed
            if (filter === 'completed') {
                fetchedProjects = fetchedProjects.filter(p =>
                    p.status === 'completed' || p.status === 'closed'
                );
            }

            // Sort projects: latest proposals first, closed at bottom
            fetchedProjects.sort((a, b) => {
                // First, separate by status - closed/completed/cancelled go to bottom
                const aIsClosed = ['completed', 'cancelled', 'closed'].includes(a.status);
                const bIsClosed = ['completed', 'cancelled', 'closed'].includes(b.status);

                if (aIsClosed !== bIsClosed) {
                    return aIsClosed ? 1 : -1;
                }

                // For non-closed projects, sort by latest proposal/activity
                // If project has proposals, sort by most recent update
                if (a.proposalCount > 0 || b.proposalCount > 0) {
                    const aTime = new Date(a.updatedAt || a.createdAt).getTime();
                    const bTime = new Date(b.updatedAt || b.createdAt).getTime();
                    return bTime - aTime; // Most recent first
                }

                // Otherwise sort by creation date (newest first)
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

            setProjects(fetchedProjects);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchApplications = async (projectId) => {
        setLoadingApplications(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                `${API_BASE_URL}/api/applications/project/${projectId}`,
                { headers: { Authorization: token } }
            );
            setApplications(response.data.applications || []);
        } catch (error) {
            console.error('Error fetching applications:', error);
            setApplications([]);
        } finally {
            setLoadingApplications(false);
        }
    };

    const handleViewApplications = (project) => {
        setSelectedProject(project);
        fetchApplications(project._id);
    };

    const handleApplicationAction = async (applicationId, status) => {
        try {
            const token = localStorage.getItem('authToken');
            await axios.patch(
                `${API_BASE_URL}/api/applications/${applicationId}/status`,
                { status },
                { headers: { Authorization: token } }
            );

            // Refresh applications
            fetchApplications(selectedProject._id);

            // Refresh projects to update status
            fetchProjects();
        } catch (error) {
            console.error('Error updating application:', error);
        }
    };

    const handleDelete = async (projectId) => {
        try {
            const token = localStorage.getItem('authToken');
            await axios.delete(`${API_BASE_URL}/api/projects/${projectId}`, {
                headers: { Authorization: token }
            });

            setProjects(projects.filter(p => p._id !== projectId));
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return 'text-green-700 bg-green-50 border-green-200';
            case 'in-progress': return 'text-blue-700 bg-blue-50 border-blue-200';
            case 'completed': return 'text-gray-700 bg-gray-50 border-gray-200';
            case 'cancelled': return 'text-red-700 bg-red-50 border-red-200';
            default: return 'text-gray-700 bg-gray-50 border-gray-200';
        }
    };

    const stats = {
        total: projects.length,
        open: projects.filter(p => p.status === 'open').length,
        inProgress: projects.filter(p => p.status === 'in-progress').length,
        completed: projects.filter(p => p.status === 'completed').length,
        totalProposals: projects.reduce((acc, p) => acc + p.proposalCount, 0),
        totalViews: projects.reduce((acc, p) => acc + p.viewCount, 0)
    };

    // Helper to check if project has recent proposals (within 24 hours)
    const hasRecentProposal = (project) => {
        // Only show notification for projects owned by the current user
        if (project.clientId?._id !== user?.userId) return false;

        // Don't show notification for closed/completed/cancelled projects
        if (['completed', 'cancelled', 'closed'].includes(project.status)) return false;

        if (!project.updatedAt) return false;
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return new Date(project.updatedAt) > twentyFourHoursAgo && project.proposalCount > 0;
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-6xl mx-auto px-8 py-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-light text-gray-700 mb-2">My Projects</h1>
                            <p className="text-sm text-gray-500 font-light">
                                {user?.role === 'freelancer'
                                    ? 'View and manage your assigned projects'
                                    : 'Manage and track your projects'}
                            </p>
                        </div>
                        {/* Only show New Project button for clients and both roles */}
                        {(user?.role === 'client' || user?.role === 'both') && (
                            <Link
                                to="/post-project"
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition font-light"
                            >
                                <HiOutlinePlus size={16} />
                                New Project
                            </Link>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="border border-gray-100 rounded-lg p-4">
                            <p className="text-2xl font-light text-gray-700">{stats.total}</p>
                            <p className="text-xs text-gray-500 font-light">Total Projects</p>
                        </div>
                        <div className="border border-gray-100 rounded-lg p-4">
                            <p className="text-2xl font-light text-green-600">{stats.open}</p>
                            <p className="text-xs text-gray-500 font-light">Open</p>
                        </div>
                        <div className="border border-gray-100 rounded-lg p-4">
                            <p className="text-2xl font-light text-gray-700">{stats.totalProposals}</p>
                            <p className="text-xs text-gray-500 font-light">Total Proposals</p>
                        </div>
                        <div className="border border-gray-100 rounded-lg p-4">
                            <p className="text-2xl font-light text-gray-700">{stats.totalViews}</p>
                            <p className="text-xs text-gray-500 font-light">Total Views</p>
                        </div>
                    </div>

                    {/* Tabs Row - Role Filter on Left, Status Filter on Right */}
                    <div className="flex items-center justify-between gap-4 mb-4">
                        {/* Role Filter Tabs - Clean Preview/Code Style */}
                        <div className="inline-flex gap-1 p-1 bg-gray-100 rounded-lg">
                            {[
                                { key: 'client', label: 'My Posted Projects', roles: ['client', 'both'] },
                                { key: 'freelancer', label: 'Assigned to Me', roles: ['freelancer', 'both'] }
                            ]
                                .filter(tab => tab.roles.includes(user?.role))
                                .map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setRoleFilter(tab.key)}
                                        className={`px-6 py-2 text-sm rounded-md transition whitespace-nowrap font-light ${roleFilter === tab.key
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))
                            }
                        </div>

                        {/* Status Filter Tabs - Smaller, on Right */}
                        <div className="inline-flex gap-1 px-2 py-1 bg-gray-100 rounded-full">
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'open', label: 'Open' },
                                { key: 'in-progress', label: 'In Progress' },
                                { key: 'completed', label: 'Completed' },
                                { key: 'cancelled', label: 'Cancelled' }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setFilter(tab.key)}
                                    className={`px-3 py-1 text-xs rounded-full transition whitespace-nowrap font-light ${filter === tab.key
                                        ? 'bg-white text-black shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Projects List */}
                {loading ? (
                    <div className="text-center py-16">
                        <div className="inline-block w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-500 mt-3 font-light">Loading projects...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16 border border-gray-100 rounded-lg"
                    >
                        <HiOutlineBriefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 font-light mb-1">No projects found</p>
                        <p className="text-xs text-gray-400 font-light mb-4">
                            {filter === 'all' ? 'Get started by creating your first project' : `No ${filter} projects`}
                        </p>
                        {filter === 'all' && (
                            <Link
                                to="/post-project"
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition font-light"
                            >
                                <HiOutlinePlus size={16} />
                                Create Project
                            </Link>
                        )}
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {projects.map((project, index) => (
                            <motion.div
                                key={project._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="relative border-0 rounded-xl p-6 bg-gray-50 shadow-sm hover:shadow-md transition-all group"
                            >
                                {/* Main Content - Thumbnail + Details */}
                                <div className="flex gap-4">
                                    {/* Thumbnail */}
                                    {project.thumbnail ? (
                                        <img
                                            src={project.thumbnail}
                                            alt={project.title}
                                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                                            <HiOutlineBriefcase className="w-8 h-8 text-gray-300" />
                                        </div>
                                    )}

                                    {/* Content Section */}
                                    <Link>

                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        {/* Header Section */}
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="flex-1 min-w-0">
                                                <Link
                                                    to={`/projects/${project._id}`}
                                                    className="text-xl font-normal text-gray-800 hover:text-green-600 transition block mb-2 line-clamp-1 text-left"
                                                >
                                                    {project.title}
                                                </Link>

                                                {/* Badges Row */}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="px-2.5 py-0.5 bg-white text-black text-xs rounded-full font-light">
                                                        {project.category}
                                                    </span>
                                                    {/* Skills - show first 3 */}
                                                    {project.skillsRequired?.slice(0, 3).map((skill, idx) => (
                                                        <span key={idx} className="px-2.5 py-0.5 bg-white text-black text-xs rounded-full font-light">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                    {project.skillsRequired?.length > 3 && (
                                                        <span className="px-2.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-light">
                                                            +{project.skillsRequired.length - 3}
                                                        </span>
                                                    )}
                                                    {project.visibility === 'private' && (
                                                        <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-500 text-xs rounded-full font-light">
                                                            <HiOutlineEyeOff size={12} />
                                                            Private
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions - Always Visible */}
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                {/* Status Badge */}
                                                <span className={`px-2.5 py-1 text-xs rounded-full font-light ${getStatusColor(project.status)}`}>
                                                    {project.status}
                                                </span>

                                                {/* Show applications button only for client's own projects that are NOT closed */}
                                                {project.clientId?._id === user?.userId &&
                                                    project.proposalCount > 0 &&
                                                    !['completed', 'cancelled', 'closed'].includes(project.status) && (
                                                        <button
                                                            onClick={() => handleViewApplications(project)}
                                                            className="px-3 py-1.5 text-xs text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition font-light cursor-pointer"
                                                            title="View Applications"
                                                        >
                                                            {project.proposalCount} {project.proposalCount === 1 ? 'Application' : 'Applications'}
                                                        </button>
                                                    )}
                                                <Link
                                                    to={project.assignedFreelancerId?._id === user?.userId
                                                        ? `/project-workspace/${project._id}`
                                                        : `/projects/${project._id}`}
                                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition cursor-pointer"
                                                    title={project.assignedFreelancerId?._id === user?.userId ? 'Open Workspace' : 'View Project'}
                                                >
                                                    {project.assignedFreelancerId?._id === user?.userId ? (
                                                        <HiOutlineBriefcase size={18} />
                                                    ) : (
                                                        <HiOutlineEye size={18} />
                                                    )}
                                                </Link>
                                                {/* Show edit button only for client's own projects */}
                                                {project.clientId?._id === user?.userId && (
                                                    <Link
                                                        to={`/post-project/${project._id}`}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                                        title="Edit Project"
                                                    >
                                                        <HiOutlinePencil size={18} />
                                                    </Link>
                                                )}
                                                {/* Show delete button only for client's own projects */}
                                                {project.clientId?._id === user?.userId && (
                                                    <button
                                                        onClick={() => setDeleteConfirm(project._id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                                        title="Delete"
                                                    >
                                                        <HiOutlineTrash size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Description - Only visible on hover */}
                                        <div className="overflow-hidden transition-all duration-300 ease-in-out max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100">
                                            <p className="text-sm text-gray-600 text-ellipsis font-light text-left line-clamp-2 mb-4">
                                                {project.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer - Metrics and Budget */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-5 text-xs text-gray-500 font-light">
                                        <div className="flex items-center gap-1.5">
                                            <HiOutlineChat size={14} className="text-gray-400" />
                                            <span>{project.proposalCount}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <HiOutlineEye size={14} className="text-gray-400" />
                                            <span>{project.viewCount}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <HiOutlineClock size={14} className="text-gray-400" />
                                            <span>{new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                        {project.assignedFreelancerId?._id === user?.userId && project.clientId && (
                                            <span className="text-xs text-gray-400">
                                                Client: {project.clientId.name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm font-normal text-gray-800">
                                        ₹{project.budget.min.toLocaleString()} - ₹{project.budget.max.toLocaleString()}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 border border-gray-100"
                        >
                            <h3 className="text-lg font-light text-gray-700 mb-2">Delete Project?</h3>
                            <p className="text-sm text-gray-600 font-light mb-6">
                                This action cannot be undone. All proposals and data will be permanently deleted.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-light"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition font-light"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Applications Modal */}
                {selectedProject && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-lg max-w-3xl w-full max-h-[85vh] overflow-hidden"
                        >
                            {/* Header */}
                            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-light text-gray-800">Applications</h3>
                                    <p className="text-sm text-gray-500 font-light mt-0.5">{selectedProject.title}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedProject(null)}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                                >
                                    <HiOutlineX size={20} className="text-gray-400" />
                                </button>
                            </div>

                            {/* Applications List */}
                            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
                                {loadingApplications ? (
                                    <div className="text-center py-12">
                                        <div className="inline-block w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-sm text-gray-500 mt-3 font-light">Loading applications...</p>
                                    </div>
                                ) : applications.length === 0 ? (
                                    <div className="text-center py-12">
                                        <HiOutlineChat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-sm text-gray-500 font-light">No applications yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {applications.map((app) => (
                                            <div
                                                key={app._id}
                                                className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition"
                                            >
                                                <div className="flex items-start gap-4">
                                                    {/* Freelancer Avatar */}
                                                    {app.freelancerId?.avatar ? (
                                                        <img
                                                            src={app.freelancerId.avatar}
                                                            alt={app.freelancerId.name}
                                                            className="w-12 h-12 rounded-full object-cover border border-gray-200"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-light border border-gray-200">
                                                            {app.freelancerId?.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}

                                                    <div className="flex-1 min-w-0">
                                                        {/* Freelancer Info */}
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div>
                                                                <h4 className="text-base font-normal text-gray-800">
                                                                    {app.freelancerId?.name}
                                                                </h4>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    {app.freelancerId?.rating > 0 && (
                                                                        <span className="text-xs text-gray-500 font-light">
                                                                            ⭐ {app.freelancerId.rating.toFixed(1)}
                                                                        </span>
                                                                    )}
                                                                    {app.freelancerId?.experienceLevel && (
                                                                        <span className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded border border-gray-100 font-light">
                                                                            {app.freelancerId.experienceLevel}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className={`px-2 py-0.5 text-xs rounded border font-light ${app.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                                app.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                    'bg-red-50 text-red-700 border-red-200'
                                                                }`}>
                                                                {app.status}
                                                            </span>
                                                        </div>

                                                        {/* Cover Letter with Expand/Collapse */}
                                                        <div className="mb-3">
                                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                                <p className="text-xs font-medium text-gray-700">Cover Letter</p>
                                                                <button
                                                                    onClick={() => setExpandedApplication(expandedApplication === app._id ? null : app._id)}
                                                                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition cursor-pointer font-light"
                                                                    title={expandedApplication === app._id ? "Show less" : "View complete application"}
                                                                >
                                                                    {expandedApplication === app._id ? (
                                                                        <>
                                                                            <HiChevronUp size={14} />
                                                                            <span>Show less</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <HiChevronDown size={14} />
                                                                            <span>Read more</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                            <p className={`text-sm text-gray-600 font-light whitespace-pre-wrap ${expandedApplication === app._id ? '' : 'line-clamp-3'}`}>
                                                                {app.coverLetter}
                                                            </p>
                                                        </div>

                                                        {/* Proposed Budget & Duration */}
                                                        <div className="flex items-center gap-4 text-xs text-gray-500 font-light mb-3">
                                                            <span>
                                                                Budget: ₹{app.proposedBudget.min.toLocaleString()} - ₹{app.proposedBudget.max.toLocaleString()}
                                                            </span>
                                                            <span>•</span>
                                                            <span>Duration: {app.proposedDuration}</span>
                                                            <span>•</span>
                                                            <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                                                        </div>

                                                        {/* Actions */}
                                                        {app.status === 'pending' && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleApplicationAction(app._id, 'accepted')}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition font-light cursor-pointer"
                                                                >
                                                                    <HiOutlineCheck size={14} />
                                                                    Accept
                                                                </button>
                                                                <button
                                                                    onClick={() => handleApplicationAction(app._id, 'rejected')}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition font-light cursor-pointer"
                                                                >
                                                                    <HiOutlineBan size={14} />
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                        {app.status === 'accepted' && (
                                                            <div className="text-xs text-green-600 font-light">
                                                                ✓ Accepted - You can now chat in the Messages section
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}
