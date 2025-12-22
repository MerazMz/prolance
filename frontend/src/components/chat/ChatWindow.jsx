import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineChevronLeft, HiOutlineDocumentText, HiOutlinePaperClip, HiOutlineSparkles } from 'react-icons/hi';
import { CiCircleInfo } from "react-icons/ci";
import axios from 'axios';
import socketService from '../../services/socketService';
import MessageInput from './MessageInput';
import ContractProposalModal from './ContractProposalModal';
import ContractCard from './ContractCard';
import SmartReplyBar from './SmartReplyBar';
import ConversationSummary from './ConversationSummary';
import ProfilePreviewModal from './ProfilePreviewModal';
import { useAuth } from '../../context/AuthContext';
import { generateSmartReplies, summarizeConversation } from '../../services/aiChatService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function ChatWindow({ conversation, onBack }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [showContractsModal, setShowContractsModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);
    // AI Features State
    const [showAIMenu, setShowAIMenu] = useState(false);
    const [smartRepliesEnabled, setSmartRepliesEnabled] = useState(false);
    const [smartReplies, setSmartReplies] = useState([]);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [conversationSummary, setConversationSummary] = useState(null);
    const [showProfilePreview, setShowProfilePreview] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const aiMenuRef = useRef(null);

    const otherUser = conversation.participants.find(p => p._id !== user?.userId);
    const isFreelancer = conversation.applicationId && user?.userId === conversation.participants.find(p => p._id !== conversation.projectId?.clientId)?._id;

    useEffect(() => {
        fetchMessages();
        fetchContracts();
        socketService.joinConversation(conversation._id);
        socketService.markAsRead(conversation._id);

        // Listen for new messages
        socketService.onNewMessage(handleNewMessage);
        socketService.onUserTyping(handleUserTyping);

        // Listen for contract events (real-time updates)
        const handleContractProposed = ({ contract, conversationId }) => {
            if (conversationId === conversation._id) {
                // Check if contract already exists to prevent duplicates
                setContracts(prev => {
                    const exists = prev.some(c => c._id === contract._id);
                    if (exists) return prev;
                    return [contract, ...prev];
                });
                // Auto-show contracts modal when a new one is proposed
                setShowContractsModal(true);
            }
        };

        const handleContractUpdated = ({ contract, conversationId }) => {
            if (conversationId === conversation._id) {
                setContracts(prev => prev.map(c => c._id === contract._id ? contract : c));
            }
        };

        socketService.onContractProposed(handleContractProposed);
        socketService.onContractUpdated(handleContractUpdated);

        return () => {
            socketService.leaveConversation(conversation._id);
            socketService.offNewMessage(handleNewMessage);
            socketService.offUserTyping(handleUserTyping);

            socketService.offContractProposed(handleContractProposed);
            socketService.offContractUpdated(handleContractUpdated);
        };
    }, [conversation._id]);

    useEffect(() => {
        // Scroll to bottom when messages change
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

        // Generate smart replies when enabled and new message arrives
        if (smartRepliesEnabled && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            // Only generate if the last message is not from current user
            if (lastMessage.senderId?._id !== user?.userId) {
                handleGenerateSmartReplies();
            }
        }
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                `${API_BASE_URL}/api/chat/conversations/${conversation._id}`,
                { headers: { Authorization: token } }
            );

            setMessages(response.data.messages || []);
        } catch (err) {
            console.error('Error fetching messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchContracts = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                `${API_BASE_URL}/api/contracts/conversation/${conversation._id}`,
                { headers: { Authorization: token } }
            );
            setContracts(response.data.contracts || []);
        } catch (err) {
            console.error('Error fetching contracts:', err);
        }
    };

    const handleNewMessage = ({ message, conversationId }) => {
        if (conversationId === conversation._id) {
            setMessages(prev => [...prev, message]);
            socketService.markAsRead(conversation._id);
        }
    };

    const handleUserTyping = ({ userId, isTyping }) => {
        if (userId !== user?.userId) {
            setOtherUserTyping(isTyping);

            // Clear typing indicator after 3 seconds
            if (isTyping) {
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
                typingTimeoutRef.current = setTimeout(() => {
                    setOtherUserTyping(false);
                }, 3000);
            }
        }
    };

    const formatMessageTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatMessageDate = (date) => {
        const messageDate = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (messageDate.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (messageDate.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return messageDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    const groupMessagesByDate = () => {
        const groups = [];
        let currentDate = null;

        messages.forEach(message => {
            const messageDate = new Date(message.createdAt).toDateString();

            if (messageDate !== currentDate) {
                currentDate = messageDate;
                groups.push({
                    type: 'date',
                    date: message.createdAt
                });
            }

            groups.push({
                type: 'message',
                data: message
            });
        });

        return groups;
    };

    // AI Feature Handlers
    const handleGenerateSmartReplies = async () => {
        setLoadingReplies(true);
        try {
            const formattedMessages = messages.map(msg => ({
                content: msg.content,
                isMine: msg.senderId?._id === user?.userId
            }));

            const userRole = user?.role || 'freelancer';
            const result = await generateSmartReplies(formattedMessages, userRole);

            if (result.success && result.replies) {
                setSmartReplies(result.replies);
            }
        } catch (error) {
            console.error('Failed to generate smart replies:', error);
            setSmartReplies([]);
        } finally {
            setLoadingReplies(false);
        }
    };

    const handleSelectReply = (reply) => {
        // Insert reply into message input by dispatching a custom event
        const event = new CustomEvent('insertSmartReply', { detail: reply });
        window.dispatchEvent(event);
    };

    const handleSummarizeConversation = async () => {
        setShowSummary(true);
        setLoadingSummary(true);
        try {
            const formattedMessages = messages.map(msg => ({
                content: msg.content,
                isMine: msg.senderId?._id === user?.userId
            }));

            const result = await summarizeConversation(formattedMessages);

            if (result.success && result.summary) {
                setConversationSummary(result.summary);
            }
        } catch (error) {
            console.error('Failed to summarize conversation:', error);
            setConversationSummary(null);
        } finally {
            setLoadingSummary(false);
        }
    };

    const toggleSmartReplies = () => {
        const newState = !smartRepliesEnabled;
        setSmartRepliesEnabled(newState);
        if (newState && messages.length > 0) {
            handleGenerateSmartReplies();
        } else {
            setSmartReplies([]);
        }
        setShowAIMenu(false);
    };

    // Close AI menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (aiMenuRef.current && !aiMenuRef.current.contains(event.target)) {
                setShowAIMenu(false);
            }
        };

        if (showAIMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAIMenu]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="inline-block w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header - Clean & Minimal */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center gap-3 flex-shrink-0 bg-white dark:bg-gray-800">
                <button
                    onClick={onBack}
                    className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                    <HiOutlineChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
                </button>

                {/* Clickable Avatar - Opens Profile Preview */}
                <div
                    onClick={() => setShowProfilePreview(true)}
                    className="cursor-pointer hover:opacity-80 transition"
                    title="View profile"
                >
                    {otherUser?.avatar ? (
                        <img
                            src={otherUser.avatar}
                            alt={otherUser.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 text-sm font-medium">
                            {otherUser?.name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* User Name and Project - flex-1 to push icons to right */}
                <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{otherUser?.name}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {conversation.projectId?.title}
                    </p>
                </div>

                {/* Right Side Icons */}
                {/* AI Assist Menu */}
                <div className="relative" ref={aiMenuRef}>
                    <button
                        onClick={() => setShowAIMenu(!showAIMenu)}
                        className="p-2 rounded-lg transition text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                        title="AI Assist"
                    >
                        <HiOutlineSparkles size={20} />
                    </button>

                    {/* Dropdown Menu */}
                    {showAIMenu && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-10">
                            <button
                                onClick={toggleSmartReplies}
                                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-between"
                            >
                                <span className="text-gray-700 dark:text-gray-300">Smart Replies</span>
                                <div className={`w-10 h-5 rounded-full transition ${smartRepliesEnabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                    <div className={`w-4 h-4 mt-0.5 bg-white rounded-full shadow transition-transform ${smartRepliesEnabled ? 'ml-5' : 'ml-0.5'}`}></div>
                                </div>
                            </button>
                            <button
                                onClick={() => {
                                    handleSummarizeConversation();
                                    setShowAIMenu(false);
                                }}
                                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition border-t border-gray-100 dark:border-gray-700"
                            >
                                <span className="text-gray-700 dark:text-gray-300">Summarize Conversation</span>
                            </button>
                        </div>
                    )}
                </div>

                {contracts.length > 0 && (
                    <button
                        onClick={() => setShowContractsModal(true)}
                        className="p-2 rounded-lg transition text-green-400 hover:bg-green-900/20"
                        title="View Contracts"
                    >
                        <CiCircleInfo size={20} />
                    </button>
                )}

                {/* Propose Contract Button - Freelancers only */}
                {isFreelancer && conversation.applicationId && (() => {
                    const hasAcceptedContract = contracts.some(c => c.status === 'accepted');
                    return (
                        <button
                            onClick={() => setShowContractModal(true)}
                            disabled={hasAcceptedContract}
                            className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition ${hasAcceptedContract
                                ? 'text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 cursor-not-allowed'
                                : 'text-green-700 dark:text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                                }`}
                            title={hasAcceptedContract ? "Contract already accepted" : "Propose a new contract"}
                        >
                            <HiOutlineDocumentText size={14} />
                            {hasAcceptedContract ? 'Accepted' : 'Propose Contract'}
                        </button>
                    );
                })()}
            </div>

            {/* Messages Area - Fixed height, scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50 dark:bg-black">
                {/* Messages */}
                <div className="space-y-3">
                    {groupMessagesByDate().map((item, index) => {
                        if (item.type === 'date') {
                            return (
                                <div key={`date-${index}`} className="flex justify-center my-4">
                                    <span className="px-3 py-1 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs rounded-full border border-gray-200 dark:border-gray-700">
                                        {formatMessageDate(item.date)}
                                    </span>
                                </div>
                            );
                        }

                        const message = item.data;

                        // System messages - Compact one-liner with time
                        if (message.messageType === 'system') {
                            return (
                                <div key={message._id} className="flex flex-col items-center my-3">
                                    {/* Time above banner - WhatsApp style */}
                                    <p className="text-xs text-gray-400 dark:text-gray-500 font-light mb-1">
                                        {formatMessageTime(message.createdAt)}
                                    </p>
                                    {/* Banner */}
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-3 py-1.5 rounded-md">
                                        <p className="text-xs text-gray-700 dark:text-gray-300 font-light">
                                            {message.content}
                                        </p>
                                    </div>
                                </div>
                            );
                        }

                        // Regular user messages - Clean bubbles
                        const isMine = message.senderId?._id === user?.userId;

                        return (
                            <div
                                key={message._id}
                                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                                    <div
                                        className={`px-4 py-2 rounded-2xl ${isMine
                                            ? 'bg-green-600 text-white rounded-br-sm'
                                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-sm'
                                            }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap break-words">
                                            {message.content}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 px-1">
                                        {formatMessageTime(message.createdAt)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Typing Indicator */}
                    {otherUserTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-2xl rounded-bl-sm">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Message Input Container - Relative positioned for SmartReplyBar */}
            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 relative">
                {/* Smart Reply Bar - Absolutely positioned above input */}
                {smartRepliesEnabled && (
                    <SmartReplyBar
                        replies={smartReplies}
                        loading={loadingReplies}
                        onSelectReply={handleSelectReply}
                        onRefresh={handleGenerateSmartReplies}
                        onDismiss={() => setSmartRepliesEnabled(false)}
                    />
                )}

                <MessageInput conversationId={conversation._id} />
            </div>

            {/* Contracts Modal */}
            {showContractsModal && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-60 p-4" onClick={() => setShowContractsModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Contract Details</h2>
                            <button
                                onClick={() => setShowContractsModal(false)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition cursor-pointer"
                            >
                                <HiOutlineChevronLeft size={20} className="text-gray-400 dark:text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                            {contracts.length > 0 ? (
                                <div className="space-y-4">
                                    {contracts.map(contract => (
                                        <ContractCard
                                            key={contract._id}
                                            contract={contract}
                                            onUpdate={(updatedContract) => {
                                                setContracts(prev => prev.map(c => c._id === updatedContract._id ? updatedContract : c));
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 dark:text-gray-400">No contracts available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Contract Proposal Modal */}
            {showContractModal && conversation.applicationId && (
                <ContractProposalModal
                    conversation={conversation}
                    application={{ _id: conversation.applicationId, proposedBudget: { min: 0, max: 0 }, proposedDuration: '', coverLetter: '' }}
                    onClose={() => setShowContractModal(false)}
                    onSuccess={(contract) => {
                        // Prevent duplicates by checking if contract already exists
                        setContracts(prev => {
                            const exists = prev.some(c => c._id === contract._id);
                            if (exists) return prev;
                            return [contract, ...prev];
                        });
                        setShowContractsModal(true);
                        setShowContractModal(false);
                    }}
                />
            )}

            {/* Conversation Summary Modal */}
            {showSummary && (
                <ConversationSummary
                    summary={conversationSummary}
                    loading={loadingSummary}
                    onClose={() => setShowSummary(false)}
                />
            )}

            {/* Profile Preview Modal */}
            {showProfilePreview && (
                <ProfilePreviewModal
                    user={otherUser}
                    onClose={() => setShowProfilePreview(false)}
                />
            )}
        </div>
    );
}
