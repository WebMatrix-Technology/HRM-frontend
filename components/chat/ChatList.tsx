'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageCircle, Users, Plus, CheckCircle2, X, User } from 'lucide-react';
import { Conversation, ChatMessage } from '@/services/chat.service';
import { chatService } from '@/services/chat.service';
import { socketService } from '@/services/socket.service';
import { employeeService, Employee } from '@/services/employee.service';
import { useAuthStore } from '@/store/authStore';

interface ChatListProps {
  onSelectConversation: (employeeId: string, employeeName: string) => void;
  selectedEmployeeId?: string;
}

export default function ChatList({ onSelectConversation, selectedEmployeeId }: ChatListProps) {
  const { employee: currentEmployee } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [loadingEmployees, setLoadingEmployees] = useState(false);

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
    if (showNewConversationModal) {
      loadEmployees();
    }
  }, [showNewConversationModal]);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const result = await employeeService.getEmployees(1, 1000, { isActive: true });
      // Filter out current employee and employees already in conversations
      const existingEmployeeIds = new Set(conversations.map(c => c.employee.id));
      const filtered = (result.employees || []).filter(
        emp => emp.id !== currentEmployee?.id && !existingEmployeeIds.has(emp.id)
      );
      setEmployees(filtered);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoadingEmployees(false);
    }
  };

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

  const handleStartConversation = (employee: Employee) => {
    const employeeName = `${employee.firstName} ${employee.lastName}`;
    setShowNewConversationModal(false);
    setEmployeeSearchQuery('');
    onSelectConversation(employee.id, employeeName);
  };

  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const search = employeeSearchQuery.toLowerCase();
    return fullName.includes(search) || emp.employeeId.toLowerCase().includes(search);
  });

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
            onClick={() => setShowNewConversationModal(true)}
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

      {/* New Conversation Modal */}
      <AnimatePresence>
        {showNewConversationModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col border border-slate-700"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  Start New Conversation
                </h3>
                <button
                  onClick={() => {
                    setShowNewConversationModal(false);
                    setEmployeeSearchQuery('');
                  }}
                  className="p-1 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-slate-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={employeeSearchQuery}
                    onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                    placeholder="Search employees..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>

              {/* Employee List */}
              <div className="flex-1 overflow-y-auto p-2">
                {loadingEmployees ? (
                  <div className="flex items-center justify-center py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                      className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"
                    />
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <User className="w-12 h-12 text-slate-500 mb-2" />
                    <p className="text-slate-400">
                      {employeeSearchQuery ? 'No employees found' : 'No employees available'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredEmployees.map((employee) => {
                      const employeeName = `${employee.firstName} ${employee.lastName}`;
                      return (
                        <motion.div
                          key={employee.id}
                          whileHover={{ x: 4 }}
                          onClick={() => handleStartConversation(employee)}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700 cursor-pointer transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {employee.avatar ? (
                              <img
                                src={employee.avatar}
                                alt={employeeName}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              getInitials(employee.firstName, employee.lastName)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white truncate">{employeeName}</h4>
                            <p className="text-sm text-slate-400 truncate">
                              {employee.position || employee.employeeId}
                              {employee.department && ` • ${employee.department}`}
                            </p>
                          </div>
                          <Plus className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
