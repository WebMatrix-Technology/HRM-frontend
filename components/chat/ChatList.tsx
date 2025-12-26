'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MessageCircle, Users, Plus, CheckCircle2 } from 'lucide-react';
import { Conversation, ChatMessage } from '@/services/chat.service';
import { chatService } from '@/services/chat.service';
import { socketService } from '@/services/socket.service';

interface ChatListProps {
  onSelectConversation: (employeeId: string, employeeName: string) => void;
  selectedEmployeeId?: string;
}

export default function ChatList({ onSelectConversation, selectedEmployeeId }: ChatListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadConversations();

    // Listen for new messages to refresh conversations
    const handleNewMessage = (message: ChatMessage) => {
      // Refresh conversations when a new message is received
      loadConversations();
    };

    socketService.onReceiveMessage(handleNewMessage);
    socketService.onMessageSent(handleNewMessage);

    return () => {
      // Cleanup: Remove listeners if component unmounts
      // Note: socketService doesn't have removeListener, so we'll keep it simple
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = conversations.filter(
        (conv) =>
          `${conv.employee.firstName} ${conv.employee.lastName}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          conv.lastMessage?.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatService.getConversations();
      setConversations(data);
      setFilteredConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
          className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full glass">
      {/* Header */}
      <div className="p-4 border-b border-dark-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold gradient-text flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Messages
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg bg-dark-surface hover:bg-dark-surface/80 transition-colors"
            title="New conversation"
          >
            <Plus className="w-5 h-5 text-cyan-400" />
          </motion.button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-cyan-400/50" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="block w-full pl-10 pr-3 py-2.5 border border-dark-border rounded-xl bg-dark-surface text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-dark-surface flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-cyan-400/50" />
            </div>
            <p className="text-cyan-400/70 mb-2">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <p className="text-sm text-cyan-400/50">
                Start a new conversation to begin chatting
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-dark-border">
            {filteredConversations.map((conversation, index) => {
              const isSelected = selectedEmployeeId === conversation.employee.id;
              const employeeName = `${conversation.employee.firstName} ${conversation.employee.lastName}`;

              return (
                <motion.div
                  key={conversation.employee.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onSelectConversation(conversation.employee.id, employeeName)}
                  className={`
                    p-4 cursor-pointer transition-all duration-200 relative
                    ${isSelected 
                      ? 'bg-gradient-primary/20 border-l-4 border-cyan-500' 
                      : 'hover:bg-dark-surface/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm
                        ${isSelected 
                          ? 'bg-gradient-primary text-white' 
                          : 'bg-dark-surface text-cyan-400 border border-cyan-500/30'
                        }
                      `}>
                        {conversation.employee.avatar ? (
                          <img
                            src={conversation.employee.avatar}
                            alt={employeeName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(conversation.employee.firstName, conversation.employee.lastName)
                        )}
                      </div>
                      {/* Online indicator - you can add this based on your backend */}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-bg"></div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`
                          font-semibold truncate
                          ${isSelected ? 'text-white' : 'text-cyan-300'}
                        `}>
                          {employeeName}
                        </h3>
                        {conversation.lastMessage && (
                          <span className="text-xs text-cyan-400/60 flex-shrink-0 ml-2">
                            {formatTime(conversation.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {conversation.lastMessage ? (
                          <>
                            <p className={`
                              text-sm truncate flex-1
                              ${isSelected ? 'text-cyan-300/80' : 'text-cyan-400/70'}
                            `}>
                              {conversation.lastMessage.message}
                            </p>
                            {conversation.lastMessage.type !== 'TEXT' && (
                              <span className="text-xs text-cyan-400/50">
                                📎
                              </span>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-cyan-400/50 italic">
                            No messages yet
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Unread Badge */}
                    {conversation.unreadCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex-shrink-0"
                      >
                        <span className="flex items-center justify-center w-6 h-6 bg-gradient-primary text-white text-xs font-bold rounded-full">
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
