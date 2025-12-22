import { motion, AnimatePresence } from 'motion/react';
import { HiOutlineExclamation, HiOutlineCheckCircle } from 'react-icons/hi';

export default function ToneIndicator({ tone, confidence, isProblematic, suggestion }) {
    if (!tone) return null;

    // Tone color mapping
    const toneConfig = {
        professional: { color: 'green', icon: '💼', label: 'Professional' },
        friendly: { color: 'green', icon: '😊', label: 'Friendly' },
        casual: { color: 'yellow', icon: '👋', label: 'Casual' },
        neutral: { color: 'gray', icon: '⚪', label: 'Neutral' },
        urgent: { color: 'blue', icon: '⚡', label: 'Urgent' },
        aggressive: { color: 'red', icon: '⚠️', label: 'Aggressive' },
        disappointed: { color: 'orange', icon: '😔', label: 'Disappointed' },
        enthusiastic: { color: 'purple', icon: '🎉', label: 'Enthusiastic' }
    };

    const config = toneConfig[tone] || toneConfig.neutral;
    const bgColor = isProblematic
        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
        : `bg-${config.color}-50 dark:bg-${config.color}-900/10 border-${config.color}-200 dark:border-${config.color}-800`;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="px-6 pb-2"
            >
                <div className={`flex items-start gap-2 p-2 border rounded-lg ${isProblematic ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'}`}>
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                        {isProblematic ? (
                            <HiOutlineExclamation className="w-4 h-4 text-red-600 dark:text-red-400" />
                        ) : (
                            <HiOutlineCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                {config.icon} {config.label}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({confidence}% confident)
                            </span>
                        </div>

                        {isProblematic && suggestion && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                {suggestion}
                            </p>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
