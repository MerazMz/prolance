import { useState, useEffect } from 'react';
import { HiOutlineX, HiOutlineExternalLink } from 'react-icons/hi';
import { FiMapPin, FiStar, FiBriefcase, FiDollarSign } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { submitRating, checkUserRating } from '../../services/ratingService';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function ProfilePreviewModal({ user: initialUser, onClose }) {
    const { user: currentUser } = useAuth();
    const [user, setUser] = useState(initialUser); // Local state for updated user data
    const [selectedRating, setSelectedRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [userRating, setUserRating] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    // Check if current user has already rated this freelancer
    useEffect(() => {
        const checkRating = async () => {
            if (!currentUser || currentUser.userId === user._id) return;
            try {
                const response = await checkUserRating(user._id);
                if (response.hasRated && response.rating) {
                    setUserRating(response.rating);
                    setSelectedRating(response.rating.rating);
                }
            } catch (error) {
                console.error('Error checking rating:', error);
            }
        };
        checkRating();
    }, [currentUser, user._id]);

    const handleRatingSubmit = async () => {
        if (selectedRating === 0) return;

        setSubmitting(true);
        setMessage('');

        try {
            await submitRating(user._id, selectedRating);
            setMessage('Rating submitted successfully!');
            setUserRating({ rating: selectedRating });

            // Fetch updated user data to get new rating
            try {
                const response = await axios.get(`${API_URL}/api/users/${user._id}`);
                if (response.data && response.data.user) {
                    setUser(response.data.user); // Update local user state with new rating
                }
            } catch (fetchError) {
                console.error('Error fetching updated user:', fetchError);
            }

            // Clear message after 3 seconds
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Failed to submit rating. Please try again.');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setSubmitting(false);
        }
    };

    if (!user) return null;

    // Only show rating option if current user is logged in and not viewing their own profile
    const canRate = currentUser && currentUser.userId !== user._id;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="relative bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 px-6 py-4">
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition text-white z-10"
                        >
                            <HiOutlineX size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6">
                        {/* Avatar - Centered */}
                        <div className="flex justify-center mb-4">
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    referrerPolicy="no-referrer"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 dark:border-gray-700 shadow-lg"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-3xl font-medium border-4 border-gray-100 dark:border-gray-700 shadow-lg">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Name and Username */}
                        <div className="text-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                {user.name}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                @{user.username}
                            </p>
                        </div>

                        {/* Location */}
                        {user.location && (
                            <div className="flex items-center justify-center gap-1.5 text-gray-600 dark:text-gray-400 mb-4">
                                <FiMapPin className="w-4 h-4" />
                                <span className="text-sm">{user.location}</span>
                            </div>
                        )}

                        {/* Bio */}
                        {user.bio && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6 line-clamp-3">
                                {user.bio}
                            </p>
                        )}

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {/* Rating */}
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-0.5 mb-1">
                                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {user.rating > 0 ? Math.round(user.rating) : 0}/5
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Stars</p>
                            </div>

                            {/* Projects */}
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <FiBriefcase className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {user.completedProjects || 0}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Projects</p>
                            </div>

                            {/* Hourly Rate */}
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <FiDollarSign className="w-4 h-4 text-green-500 dark:text-green-400" />
                                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        ₹{user.hourlyCharges || 0}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Per Hour</p>
                            </div>
                        </div>

                        {/* Skills */}
                        {user.skills && user.skills.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                    Skills
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {user.skills.slice(0, 6).map((skill, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full border border-gray-200 dark:border-gray-600"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                    {user.skills.length > 6 && (
                                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full border border-green-200 dark:border-green-700">
                                            +{user.skills.length - 6} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Rating Section - Only for logged-in users viewing other profiles */}
                        {canRate && (
                            <div className="mb-6 pb-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 text-center">
                                    {userRating ? 'Your Rating' : 'Rate'}
                                </h3>

                                {/* Star Rating */}
                                <div className="flex justify-center gap-2 mb-3">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setSelectedRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            disabled={submitting}
                                            className="transition-transform hover:scale-110 disabled:opacity-50"
                                        >
                                            <FiStar
                                                className={`w-8 h-8 transition-colors ${star <= (hoverRating || selectedRating)
                                                    ? 'fill-yellow-500 text-yellow-500 dark:fill-yellow-400 dark:text-yellow-400'
                                                    : 'text-gray-300 dark:text-gray-600'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>

                                {/* Submit Button */}
                                {selectedRating > 0 && (
                                    <button
                                        onClick={handleRatingSubmit}
                                        disabled={submitting}
                                        className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white rounded-lg transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? 'Submitting...' : userRating ? 'Update Rating' : 'Submit Rating'}
                                    </button>
                                )}

                                {/* Feedback Message */}
                                {message && (
                                    <p className={`text-xs text-center mt-2 ${message.includes('success') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {message}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* View Full Profile Button */}
                        <Link
                            to={`/user/${user.username}`}
                            onClick={onClose}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium text-sm"
                        >
                            View Full Profile
                            <HiOutlineExternalLink size={16} />
                        </Link>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
