import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { HiOutlineChat, HiOutlineSearch, HiOutlineX } from 'react-icons/hi';
import axios from 'axios';
import socketService from '../services/socketService';
import ConversationsList from '../components/chat/ConversationsList';
import ChatWindow from '../components/chat/ChatWindow';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function Chat() {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showMobileChat, setShowMobileChat] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(320); // Default 320px (md:w-80)
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        // Connect socket
        const token = localStorage.getItem('authToken');
        if (token) {
            socketService.connect(token);
        }

        fetchConversations();

        // Listen for conversation updates
        socketService.onConversationUpdated(handleConversationUpdate);

        return () => {
            socketService.offConversationUpdated(handleConversationUpdate);
        };
    }, []);

    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            const timer = setTimeout(() => {
                searchFreelancers();
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(`${API_BASE_URL}/api/chat/conversations`, {
                headers: { Authorization: token }
            });

            const fetchedConversations = response.data.conversations || [];
            setConversations(fetchedConversations);

            // Restore last selected conversation from localStorage
            const savedConversationId = localStorage.getItem('lastSelectedConversation');
            if (savedConversationId && fetchedConversations.length > 0) {
                const savedConv = fetchedConversations.find(conv => conv._id === savedConversationId);
                if (savedConv) {
                    setSelectedConversation(savedConv);
                }
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
        } finally {
            setLoading(false);
        }
    };

    const searchFreelancers = async () => {
        setSearching(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                `${API_BASE_URL}/api/users/search?search=${encodeURIComponent(searchQuery)}`,
                { headers: { Authorization: token } }
            );
            setSearchResults(response.data.freelancers || []);
        } catch (err) {
            console.error('Error searching freelancers:', err);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleStartChat = async (user) => {
        try {
            const token = localStorage.getItem('authToken');

            // Check if conversation already exists
            const existingConv = conversations.find(conv =>
                conv.participants.some(p => p._id === user._id)
            );

            if (existingConv) {
                setSelectedConversation(existingConv);
                setShowMobileChat(true);
                setShowSearch(false);
                setSearchQuery('');

                // Save to localStorage
                localStorage.setItem('lastSelectedConversation', existingConv._id);

                // Clear unread count for this conversation
                setConversations(prev => prev.map(conv =>
                    conv._id === existingConv._id
                        ? { ...conv, unreadCount: 0 }
                        : conv
                ));
                return;
            }

            // Create new conversation
            const response = await axios.post(
                `${API_BASE_URL}/api/chat/conversations`,
                { participantId: user._id },
                { headers: { Authorization: token } }
            );

            const newConversation = response.data.conversation;
            setConversations(prev => [newConversation, ...prev]);
            setSelectedConversation(newConversation);
            setShowMobileChat(true);
            setShowSearch(false);
            setSearchQuery('');

            // Save to localStorage
            localStorage.setItem('lastSelectedConversation', newConversation._id);
        } catch (err) {
            console.error('Error starting chat:', err);
        }
    };

    const handleConversationUpdate = ({ conversationId, lastMessage }) => {
        setConversations(prev => {
            const updated = prev.map(conv =>
                conv._id === conversationId
                    ? { ...conv, lastMessage, lastMessageAt: lastMessage.createdAt }
                    : conv
            );
            // Sort by last message time
            return updated.sort((a, b) =>
                new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
            );
        });
    };

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        setShowMobileChat(true);

        // Save selected conversation to localStorage
        localStorage.setItem('lastSelectedConversation', conversation._id);

        // Immediately clear unread count for this conversation in the list
        setConversations(prev => prev.map(conv =>
            conv._id === conversation._id
                ? { ...conv, unreadCount: 0 }
                : conv
        ));
    };

    const handleBackToList = () => {
        setShowMobileChat(false);
        setSelectedConversation(null);
    };

    // Sidebar resize handlers
    const handleMouseDown = (e) => {
        setIsResizing(true);
        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!isResizing || !containerRef.current) return;

        // Get the container's left position to calculate relative mouse position
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = e.clientX - containerRect.left;

        // Constrain width between 240px and 600px
        if (newWidth >= 240 && newWidth <= 600) {
            setSidebarWidth(newWidth);
        }
    };

    const handleMouseUp = () => {
        setIsResizing(false);
    };

    // Add global mouse listeners for resize
    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };
    }, [isResizing]);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-gray-50 dark:bg-black overflow-hidden" style={{ height: 'calc(100vh - 90px)' }}>
            {/* Fixed height container - aligned with navbar */}
            <div ref={containerRef} className="flex-1 flex overflow-hidden w-full max-w-7xl mx-auto outline-1 dark:outline-gray-900 outline-gray-200  rounded-2xl">
                {/* Conversations List Sidebar */}
                <div
                    className={`${showMobileChat ? 'hidden md:flex' : 'flex'} border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-black flex-col relative overflow-hidden`}
                    style={{ width: `${sidebarWidth}px` }}
                >
                    {/* Sidebar Header */}
                    <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Messages</h2>

                        {/* Search */}
                        <div className="relative">
                            <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setShowSearch(true)}
                                className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-green-500 dark:focus:border-green-500 transition bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setShowSearch(false);
                                    }}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <HiOutlineX className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {showSearch && searchQuery && (
                            <div className="absolute left-4 right-4 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                                {searching ? (
                                    <div className="p-4 text-center">
                                        <div className="inline-block w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div>
                                        {searchResults.map((user) => (
                                            <button
                                                key={user._id}
                                                onClick={() => handleStartChat(user)}
                                                className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-3 text-left"
                                            >
                                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                                    {user.avatar ? (
                                                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        <span className="text-green-700 dark:text-green-400 font-medium text-sm">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{user.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user.username}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No users found</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto overscroll-contain">
                        <ConversationsList
                            conversations={conversations}
                            selectedConversation={selectedConversation}
                            onSelectConversation={handleSelectConversation}
                        />
                    </div>

                    {/* Resize Handle */}
                    <div
                        onMouseDown={handleMouseDown}
                        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-green-500 dark:hover:bg-green-600 transition-colors group"
                        title="Drag to resize"
                    >
                        <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-1 h-12 bg-gray-300 dark:bg-gray-600 group-hover:bg-green-500 dark:group-hover:bg-green-600 rounded-l transition-colors"></div>
                    </div>
                </div>

                {/* Chat Window */}
                <div className={`flex-1 ${showMobileChat ? 'block' : 'hidden md:block'} bg-white dark:bg-gray-800`}>
                    {selectedConversation ? (
                        <ChatWindow
                            conversation={selectedConversation}
                            onBack={handleBackToList}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-black">
                            <div className="text-center">
                                <HiOutlineChat className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Select a conversation to start messaging
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
