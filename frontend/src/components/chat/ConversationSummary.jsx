import { HiOutlineX, HiOutlineClipboard, HiOutlineCheck, HiOutlineDownload } from 'react-icons/hi';
import { useState } from 'react';
import { motion } from 'motion/react';

export default function ConversationSummary({ summary, loading, onClose }) {
    const [copied, setCopied] = useState(false);

    const getSummaryText = () => {
        if (!summary) return '';

        return `
Conversation Summary
===================

Discussion Points:
${summary.discussionPoints?.map((point, i) => `${i + 1}. ${point}`).join('\n') || 'None'}

Key Decisions:
${summary.decisions?.map((dec, i) => `${i + 1}. ${dec}`).join('\n') || 'None'}

Action Items:
${summary.actionItems?.map((item, i) => `${i + 1}. ${item}`).join('\n') || 'None'}

Deadlines:
${summary.deadlines?.map((dl, i) => `${i + 1}. ${dl}`).join('\n') || 'None'}
        `.trim();
    };

    const handleCopy = () => {
        const summaryText = getSummaryText();
        if (!summaryText) return;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const summaryText = getSummaryText();
        if (!summaryText) return;

        // Create a blob with the summary text
        const blob = new Blob([summaryText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `conversation-summary-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Conversation Summary
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                        <HiOutlineX className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                                Generating summary...
                            </p>
                        </div>
                    ) : summary ? (
                        <div className="space-y-6">
                            {/* Discussion Points */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                                    Discussion Points
                                </h3>
                                {summary.discussionPoints && summary.discussionPoints.length > 0 ? (
                                    <ul className="space-y-2">
                                        {summary.discussionPoints.map((point, index) => (
                                            <li key={index} className="text-sm text-gray-600 dark:text-gray-400 pl-4">
                                                • {point}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-400 dark:text-gray-500 italic pl-4">None</p>
                                )}
                            </div>

                            {/* Key Decisions */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                    Key Decisions
                                </h3>
                                {summary.decisions && summary.decisions.length > 0 ? (
                                    <ul className="space-y-2">
                                        {summary.decisions.map((decision, index) => (
                                            <li key={index} className="text-sm text-gray-600 dark:text-gray-400 pl-4">
                                                • {decision}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-400 dark:text-gray-500 italic pl-4">None</p>
                                )}
                            </div>

                            {/* Action Items */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
                                    Action Items
                                </h3>
                                {summary.actionItems && summary.actionItems.length > 0 ? (
                                    <ul className="space-y-2">
                                        {summary.actionItems.map((item, index) => (
                                            <li key={index} className="text-sm text-gray-600 dark:text-gray-400 pl-4">
                                                • {item}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-400 dark:text-gray-500 italic pl-4">None</p>
                                )}
                            </div>

                            {/* Deadlines */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                                    Deadlines
                                </h3>
                                {summary.deadlines && summary.deadlines.length > 0 ? (
                                    <ul className="space-y-2">
                                        {summary.deadlines.map((deadline, index) => (
                                            <li key={index} className="text-sm text-gray-600 dark:text-gray-400 pl-4">
                                                • {deadline}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-400 dark:text-gray-500 italic pl-4">None</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Failed to generate summary. Please try again.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {summary && !loading && (
                    <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            <HiOutlineDownload className="w-4 h-4" />
                            Download
                        </button>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                            {copied ? (
                                <>
                                    <HiOutlineCheck className="w-4 h-4" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <HiOutlineClipboard className="w-4 h-4" />
                                    Copy Summary
                                </>
                            )}
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
