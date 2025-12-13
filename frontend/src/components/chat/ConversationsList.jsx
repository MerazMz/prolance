import { HiOutlineChat } from 'react-icons/hi';

export default function ConversationsList({ conversations, selectedConversation, onSelectConversation }) {
    const formatTime = (date) => {
        if (!date) return '';

        const messageDate = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (messageDate.toDateString() === today.toDateString()) {
            return messageDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } else if (messageDate.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return messageDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
    };

    if (conversations.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                    <HiOutlineChat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No conversations yet</p>
                    <p className="text-xs text-gray-400 mt-1">Search for freelancers to start chatting</p>
                </div>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-100">
            {conversations.map((conversation) => {
                const otherParticipant = conversation.participants.find(p => p._id !== conversation.participants[0]._id) || conversation.participants[0];
                const isSelected = selectedConversation?._id === conversation._id;
                const hasUnread = conversation.unreadCount > 0;

                return (
                    <button
                        key={conversation._id}
                        onClick={() => onSelectConversation(conversation)}
                        className={`w-full px-4 py-3 hover:bg-gray-50 transition text-left ${isSelected ? 'bg-green-50 border-l-2 border-green-600' : ''
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            {/* Avatar */}
                            {otherParticipant?.avatar ? (
                                <img
                                    src={otherParticipant.avatar}
                                    alt={otherParticipant.name}
                                    referrerPolicy="no-referrer"
                                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                                />
                            ) : (
                                <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-gray-600 font-medium text-sm">
                                        {otherParticipant?.name?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2 mb-1">
                                    <h3 className={`text-sm truncate ${hasUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                        {otherParticipant?.name}
                                    </h3>
                                    <span className="text-xs text-gray-400 flex-shrink-0">
                                        {formatTime(conversation.lastMessageAt)}
                                    </span>
                                </div>

                                {/* Project Title */}
                                {conversation.projectId?.title && (
                                    <p className="text-xs text-gray-500 truncate mb-1">
                                        {conversation.projectId.title}
                                    </p>
                                )}

                                {/* Last Message */}
                                <div className="flex items-center justify-between gap-2">
                                    <p className={`text-xs truncate ${hasUnread ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                                        {conversation.lastMessage?.content || 'Start chatting...'}
                                    </p>
                                    {hasUnread && (
                                        <span className="flex-shrink-0 w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center">
                                            {conversation.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
