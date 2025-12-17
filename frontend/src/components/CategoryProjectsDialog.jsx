import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    HiOutlineX,
    HiOutlineBriefcase,
    HiOutlineCurrencyDollar,
    HiOutlineUser,
    HiOutlineCalendar,
    HiOutlineInbox
} from 'react-icons/hi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const CategoryProjectsDialog = ({ isOpen, onClose, category }) => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && category) {
            fetchProjects();
        }
    }, [isOpen, category]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(
                `${API_BASE_URL}/api/projects`,
                {
                    params: {
                        category,
                        status: 'open',
                        limit: 50
                    }
                }
            );

            if (response.data.success) {
                setProjects(response.data.projects || []);
            }
        } catch (err) {
            console.error('Error fetching projects:', err);
            setError('Failed to load projects. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatBudget = (budget) => {
        if (!budget) return 'N/A';
        const min = budget.min?.toLocaleString('en-IN') || '0';
        const max = budget.max?.toLocaleString('en-IN') || '0';
        return `₹${min} - ₹${max}`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleProjectClick = (projectId, event) => {
        // Prevent event propagation if called from button
        if (event) {
            event.stopPropagation();
        }
        navigate(`/projects/${projectId}`);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Dialog - More Compact */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-5xl max-h-[85vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
                    >
                        {/* Header - Compact */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-green-50 to-white dark:from-gray-800 dark:to-gray-900">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-600/10 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
                                    <HiOutlineBriefcase className="w-5 h-5 text-green-600 dark:text-green-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {category}
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {loading ? 'Loading...' : `${projects.length} project${projects.length !== 1 ? 's' : ''} available`}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                                aria-label="Close dialog"
                            >
                                <HiOutlineX className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
                            </button>
                        </div>

                        {/* Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-5 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-2 border-green-600 dark:border-green-500 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading projects...</p>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-center">
                                        <p className="text-red-600 dark:text-red-400 mb-3 text-sm">{error}</p>
                                        <button
                                            onClick={fetchProjects}
                                            className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                </div>
                            ) : projects.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64">
                                    <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                                        <HiOutlineInbox className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">No projects found</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
                                        No open projects in {category} right now. Check back later!
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {projects.map((project) => (
                                        <motion.div
                                            key={project._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:border-green-400 dark:hover:border-green-500 hover:shadow-md transition-all duration-200 cursor-pointer"
                                            onClick={() => handleProjectClick(project._id)}
                                        >
                                            {/* Thumbnail */}
                                            {project.thumbnail ? (
                                                <div className="w-full h-36 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                                    <img
                                                        src={project.thumbnail}
                                                        alt={project.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-full h-36 bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                                                    <HiOutlineBriefcase className="w-12 h-12 text-green-600/30 dark:text-green-500/30" />
                                                </div>
                                            )}

                                            {/* Content */}
                                            <div className="p-4">
                                                {/* Title */}
                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-green-600 dark:group-hover:text-green-500 transition-colors">
                                                    {project.title}
                                                </h3>

                                                {/* Description */}
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                                    {project.description}
                                                </p>

                                                {/* Client */}
                                                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                                                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {project.clientId?.avatar ? (
                                                            <img
                                                                src={project.clientId.avatar}
                                                                alt={project.clientId.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <HiOutlineUser className="w-3 h-3 text-green-600 dark:text-green-400" />
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                        {project.clientId?.name || 'Anonymous'}
                                                    </span>
                                                </div>

                                                {/* Budget & Date */}
                                                <div className="space-y-2 mb-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                            <HiOutlineCurrencyDollar className="w-4 h-4" />
                                                            <span className="text-xs font-semibold">{formatBudget(project.budget)}</span>
                                                        </div>
                                                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full">
                                                            {project.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                                        <div className="flex items-center gap-1">
                                                            <HiOutlineCalendar className="w-3.5 h-3.5" />
                                                            <span>{formatDate(project.createdAt)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <HiOutlineBriefcase className="w-3.5 h-3.5" />
                                                            <span>{project.duration}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* View Button */}
                                                <button
                                                    onClick={(e) => handleProjectClick(project._id, e)}
                                                    className="w-full px-3 py-2 text-xs font-medium text-black dark:text-gray-200 bg-white dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800
                                                    transition-colors border-1 border-black">
                                                    View Details →
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CategoryProjectsDialog;
