import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HiOutlineX, HiOutlineBriefcase, HiOutlineClock, HiOutlineLocationMarker } from 'react-icons/hi';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function CategoryProjectsDialog({ isOpen, onClose, category }) {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && category) {
            fetchProjects();
        }
    }, [isOpen, category]);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const url = `${API_BASE_URL}/api/projects?status=open&category=${encodeURIComponent(category)}`;
            const response = await axios.get(url);
            setProjects(response.data.projects || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    const getTimeSince = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
            }
        }
        return 'Just now';
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-light text-gray-800">{category}</h2>
                                <p className="text-sm text-gray-500 font-light mt-0.5">
                                    {loading ? 'Loading...' : `${projects.length} project${projects.length !== 1 ? 's' : ''} available`}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                                title="Close"
                            >
                                <HiOutlineX size={20} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(85vh-100px)]">
                            {loading ? (
                                <div className="text-center py-16">
                                    <div className="inline-block w-10 h-10 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-sm text-gray-500 mt-3 font-light">Loading projects...</p>
                                </div>
                            ) : projects.length > 0 ? (
                                <div className="space-y-4">
                                    {projects.map((project, index) => (
                                        <motion.div
                                            key={project._id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Link
                                                to={`/projects/${project._id}`}
                                                onClick={onClose}
                                                className="flex border border-gray-100 rounded-lg overflow-hidden hover:border-gray-300 hover:shadow-md transition-all bg-white group"
                                            >
                                                {/* Thumbnail */}
                                                {project.thumbnail ? (
                                                    <img
                                                        src={project.thumbnail}
                                                        alt={project.title}
                                                        className="w-48 h-32 object-cover bg-gray-100 flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-48 h-32 bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center flex-shrink-0">
                                                        <HiOutlineBriefcase size={32} className="text-gray-300" />
                                                    </div>
                                                )}

                                                {/* Content */}
                                                <div className="flex-1 p-4 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex-1">
                                                                <h3 className="text-base font-normal text-gray-800 mb-1.5 line-clamp-1 group-hover:text-green-600 transition">
                                                                    {project.title}
                                                                </h3>
                                                                <span className="inline-block px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-md font-light">
                                                                    {project.category}
                                                                </span>
                                                            </div>
                                                            <div className="text-right ml-4">
                                                                <div className="text-base font-normal text-gray-800">
                                                                    ₹{project.budget.min.toLocaleString()}+
                                                                </div>
                                                                <div className="text-xs text-gray-400 font-light">{project.budget.type}</div>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-gray-600 line-clamp-2 font-light mb-3">
                                                            {project.description}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {project.skillsRequired.slice(0, 3).map((skill, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded border border-gray-100 font-light"
                                                                >
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                            {project.skillsRequired.length > 3 && (
                                                                <span className="px-2 py-0.5 text-gray-400 text-xs font-light">
                                                                    +{project.skillsRequired.length - 3}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-gray-400 font-light ml-4">
                                                            <div className="flex items-center gap-1">
                                                                <HiOutlineClock size={14} />
                                                                {getTimeSince(project.createdAt)}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <HiOutlineLocationMarker size={14} />
                                                                {project.proposalCount} proposals
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 border border-gray-100 rounded-lg">
                                    <HiOutlineBriefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm text-gray-600 font-light mb-1">No projects found</p>
                                    <p className="text-xs text-gray-400 font-light">Check back later for new opportunities in {category}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
