import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HiOutlineSparkles, HiOutlineRefresh, HiOutlineX } from 'react-icons/hi';

export default function SmartReplyBar({ replies, loading, onSelectReply, onRefresh, onDismiss }) {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const handleDismiss = () => {
        setDismissed(true);
        if (onDismiss) onDismiss();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 right-0 mb-2 px-6"
            >
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200 dark:border-green-800 rounded-lg p-3 shadow-lg bg-opacity-95 dark:bg-opacity-95 backdrop-blur-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <HiOutlineSparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-xs font-medium text-green-700 dark:text-green-400">
                                Smart Replies
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            {onRefresh && (
                                <button
                                    onClick={onRefresh}
                                    disabled={loading}
                                    className="p-1 hover:bg-green-100 dark:hover:bg-green-800/30 rounded transition disabled:opacity-50"
                                    title="Regenerate suggestions"
                                >
                                    <HiOutlineRefresh className={`w-3.5 h-3.5 text-green-600 dark:text-green-400 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                            )}
                            <button
                                onClick={handleDismiss}
                                className="p-1 hover:bg-green-100 dark:hover:bg-green-800/30 rounded transition"
                                title="Dismiss"
                            >
                                <HiOutlineX className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                            </button>
                        </div>
                    </div>

                    {/* Replies */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {loading ? (
                            // Loading skeleton
                            <>
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="flex-shrink-0 px-3 py-2 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-lg animate-pulse"
                                    >
                                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    </div>
                                ))}
                            </>
                        ) : replies && replies.length > 0 ? (
                            // Actual replies
                            replies.map((reply, index) => (
                                <motion.button
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => onSelectReply(reply)}
                                    className="flex-shrink-0 px-3 py-2 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-400 dark:hover:border-green-500 rounded-lg transition text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
                                >
                                    {reply}
                                </motion.button>
                            ))
                        ) : (
                            // Error state
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                Unable to generate suggestions. Try again.
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
