import { useState, useEffect, useRef } from 'react';
import { HiOutlineChevronLeft, HiOutlineDocumentText } from 'react-icons/hi';
import { CiCircleInfo } from "react-icons/ci";
import axios from 'axios';
import socketService from '../../services/socketService';
import MessageInput from './MessageInput';
import ContractProposalModal from './ContractProposalModal';
import ContractCard from './ContractCard';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function ChatWindow({ conversation, onBack }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [showContracts, setShowContracts] = useState(false);
    const [loading, setLoading] = useState(true);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

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
                setContracts(prev => [contract, ...prev]);
                // Auto-show contracts when a new one is proposed
                setShowContracts(true);
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

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="inline-block w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-100 px-6 py-4 flex items-center gap-3 flex-shrink-0">
                <button
                    onClick={onBack}
                    className="md:hidden p-1 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                >
                    <HiOutlineChevronLeft size={20} className="text-gray-600" />
                </button>

                {otherUser?.avatar ? (
                    <img
                        src={otherUser.avatar}
                        alt={otherUser.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-light border border-gray-200">
                        {otherUser?.name?.charAt(0).toUpperCase()}
                    </div>
                )}

                <div className="text-left flex-1 min-w-0 flex items-center gap-2">
                    <div className="flex-1">
                        <h2 className="text-base font-normal text-gray-800 truncate">{otherUser?.name}</h2>
                        <p className="text-xs text-gray-500 font-light truncate">
                            {conversation.projectId?.title}
                        </p>
                    </div>
                    {contracts.length > 0 && (
                        <button
                            onClick={() => setShowContracts(!showContracts)}
                            className={`p-2 rounded-lg transition ${showContracts
                                ? 'bg-green-50 text-green-600'
                                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                }`}
                            title={showContracts ? "Hide Bond Papers" : "View Bond Papers"}
                        >
                            <CiCircleInfo size={22} />
                        </button>
                    )}
                </div>

                {/* Propose Contract Button - Freelancers only */}
                {isFreelancer && conversation.applicationId && (() => {
                    const hasAcceptedContract = contracts.some(c => c.status === 'accepted');
                    return (
                        <button
                            onClick={() => setShowContractModal(true)}
                            disabled={hasAcceptedContract}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition font-light ${hasAcceptedContract
                                ? 'text-gray-400 bg-gray-50 border border-gray-200 cursor-not-allowed opacity-60'
                                : 'text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 cursor-pointer'
                                }`}
                            title={hasAcceptedContract ? "Contract already accepted" : "Propose a new contract"}
                        >
                            <HiOutlineDocumentText size={16} />
                            {hasAcceptedContract ? 'Contract Accepted' : 'Propose Contract'}
                        </button>
                    );
                })()}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {/* Contracts - Only show when showContracts is true */}
                {showContracts && contracts.map(contract => (
                    <ContractCard
                        key={contract._id}
                        contract={contract}
                        onUpdate={(updatedContract) => {
                            setContracts(prev => prev.map(c => c._id === updatedContract._id ? updatedContract : c));
                        }}
                    />
                ))}

                {groupMessagesByDate().map((item, index) => {
                    if (item.type === 'date') {
                        return (
                            <div key={`date-${index}`} className="flex justify-center my-4">
                                <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full font-light">
                                    {formatMessageDate(item.date)}
                                </span>
                            </div>
                        );
                    }

                    const message = item.data;
                    const isMine = message.senderId._id === user?.userId;

                    return (
                        <div
                            key={message._id}
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}
                        >
                            <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                                <div className="flex items-start gap-2">
                                    <div
                                        className={`px-4 py-2.5 rounded-2xl ${isMine
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}
                                    >
                                        <p className="text-sm font-light whitespace-pre-wrap break-words">
                                            {message.content}
                                        </p>
                                    </div>

                                </div>
                                <span className="text-xs text-gray-400 font-light mt-1 px-1">
                                    {formatMessageTime(message.createdAt)}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {/* Typing Indicator */}
                {otherUserTyping && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 px-4 py-2.5 rounded-2xl">
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

            {/* Message Input */}
            <MessageInput conversationId={conversation._id} />

            {/* Contract Proposal Modal */}
            {showContractModal && conversation.applicationId && (
                <ContractProposalModal
                    conversation={conversation}
                    application={{ _id: conversation.applicationId, proposedBudget: { min: 0, max: 0 }, proposedDuration: '', coverLetter: '' }}
                    onClose={() => setShowContractModal(false)}
                    onSuccess={(contract) => {
                        setContracts(prev => [contract, ...prev]);
                        setShowContracts(true); // Auto-show contracts when proposed
                        setShowContractModal(false); // Close modal
                    }}
                />
            )}
        </div>
    );
}
