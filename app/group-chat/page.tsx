'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical,
  Settings,
  UserPlus,
  LogOut,
  Check,
  CheckCheck
} from 'lucide-react';
import { Group, ChatMessage } from '@/services/chat.service';
import { chatService } from '@/services/chat.service';
import { socketService } from '@/services/socket.service';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function GroupChatPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const employee = useAuthStore((state) => state.employee);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGroups();
    const token = localStorage.getItem('accessToken');
    if (token) {
      socketService.connect(token);
    }

    const handleReceiveGroupMessage = (message: ChatMessage) => {
      if (selectedGroup && message.groupId === selectedGroup.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    };

    socketService.onReceiveGroupMessage(handleReceiveGroupMessage);

    return () => {
      socketService.offReceiveGroupMessage(handleReceiveGroupMessage);
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = groups.filter(
        (group) =>
          group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          group.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredGroups(filtered);
    } else {
      setFilteredGroups(groups);
    }
  }, [searchQuery, groups]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupMessages(selectedGroup.id);
      socketService.joinGroup(selectedGroup.id);
    }

    return () => {
      if (selectedGroup) {
        socketService.leaveGroup(selectedGroup.id);
      }
    };
  }, [selectedGroup]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await chatService.getGroups();
      setGroups(data);
      setFilteredGroups(data);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupMessages = async (groupId: string) => {
    try {
      const data = await chatService.getGroupMessages(groupId);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load group messages:', error);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroup) return;

    // Check if socket is disabled (e.g., on Vercel)
    if (socketService.isSocketDisabled()) {
      console.info('Message sending is disabled: Socket.IO is not available on this platform.');
      // Don't clear the message - let user know it can't be sent
      return;
    }

    socketService.sendGroupMessage(selectedGroup.id, newMessage.trim());
    setNewMessage('');
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const group = await chatService.createGroup({
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || undefined,
        type: 'PUBLIC',
      });
      setGroups([...groups, group]);
      setFilteredGroups([...filteredGroups, group]);
      setShowCreateGroup(false);
      setNewGroupName('');
      setNewGroupDescription('');
      setSelectedGroup(group);
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const shouldShowDateSeparator = (currentMessage: ChatMessage, previousMessage?: ChatMessage) => {
    if (!previousMessage) return true;
    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();
    return currentDate !== previousDate;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
            className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex gap-4">
        {/* Groups Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full md:w-96 flex-shrink-0 glass rounded-xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-dark-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold gradient-text flex items-center gap-2">
                <Users className="w-5 h-5" />
                Groups
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowCreateGroup(!showCreateGroup)}
                className="p-2 rounded-lg bg-dark-surface hover:bg-dark-surface/80 transition-colors"
                title="Create group"
              >
                <Plus className="w-5 h-5 text-cyan-400" />
              </motion.button>
            </div>

            {/* Create Group Form */}
            <AnimatePresence>
              {showCreateGroup && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCreateGroup}
                  className="space-y-3 mb-4"
                >
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Group name"
                    required
                    className="w-full px-3 py-2 border border-dark-border rounded-lg bg-dark-surface text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <textarea
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="Description (optional)"
                    rows={2}
                    className="w-full px-3 py-2 border border-dark-border rounded-lg bg-dark-surface text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-4 py-2 bg-gradient-primary text-white rounded-lg font-medium"
                    >
                      Create
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => {
                        setShowCreateGroup(false);
                        setNewGroupName('');
                        setNewGroupDescription('');
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 bg-dark-surface text-cyan-300 rounded-lg font-medium"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-cyan-400/50" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groups..."
                className="block w-full pl-10 pr-3 py-2.5 border border-dark-border rounded-xl bg-dark-surface text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
              />
            </div>
          </div>

          {/* Groups List */}
          <div className="flex-1 overflow-y-auto">
            {filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-dark-surface flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-cyan-400/50" />
                </div>
                <p className="text-cyan-400/70 mb-2">
                  {searchQuery ? 'No groups found' : 'No groups yet'}
                </p>
                {!searchQuery && (
                  <p className="text-sm text-cyan-400/50">
                    Create a new group to start chatting
                  </p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-dark-border">
                {filteredGroups.map((group, index) => {
                  const isSelected = selectedGroup?.id === group.id;
                  return (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedGroup(group)}
                      className={`
                        p-4 cursor-pointer transition-all duration-200
                        ${isSelected 
                          ? 'bg-gradient-primary/20 border-l-4 border-cyan-500' 
                          : 'hover:bg-dark-surface/50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0
                          ${isSelected 
                            ? 'bg-gradient-primary text-white' 
                            : 'bg-dark-surface text-cyan-400 border border-cyan-500/30'
                          }
                        `}>
                          <Users className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`
                            font-semibold truncate mb-1
                            ${isSelected ? 'text-white' : 'text-cyan-300'}
                          `}>
                            {group.name}
                          </h3>
                          <p className={`
                            text-sm truncate
                            ${isSelected ? 'text-cyan-300/80' : 'text-cyan-400/70'}
                          `}>
                            {group.description || `${group.members?.length || 0} members`}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Chat Window */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 min-w-0 glass rounded-xl overflow-hidden flex flex-col"
        >
          {selectedGroup ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-dark-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{selectedGroup.name}</h2>
                    <p className="text-xs text-cyan-400/70">
                      {selectedGroup.members?.length || 0} members
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg hover:bg-dark-surface transition-colors"
                    title="Group settings"
                  >
                    <Settings className="w-5 h-5 text-cyan-400" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg hover:bg-dark-surface transition-colors"
                    title="Add members"
                  >
                    <UserPlus className="w-5 h-5 text-cyan-400" />
                  </motion.button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-bg/30">
                <AnimatePresence>
                  {messages.map((message, index) => {
                    const isOwnMessage = message.senderId === employee?.id;
                    const previousMessage = index > 0 ? messages[index - 1] : undefined;
                    const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
                    const isConsecutive = previousMessage && 
                      previousMessage.senderId === message.senderId &&
                      new Date(message.createdAt).getTime() - new Date(previousMessage.createdAt).getTime() < 300000;

                    return (
                      <div key={message.id}>
                        {showDateSeparator && (
                          <div className="flex items-center justify-center my-4">
                            <span className="text-xs text-cyan-400/50 bg-dark-surface px-3 py-1 rounded-full">
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${!isConsecutive ? 'mt-4' : 'mt-1'}`}
                        >
                          <div className={`flex items-end gap-2 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                            {!isOwnMessage && !isConsecutive && (
                              <div className="w-8 h-8 rounded-full bg-dark-surface flex items-center justify-center text-xs font-bold text-cyan-400 flex-shrink-0">
                                {message.sender.firstName[0]}{message.sender.lastName[0]}
                              </div>
                            )}
                            {!isOwnMessage && isConsecutive && <div className="w-8"></div>}
                            <div
                              className={`
                                rounded-2xl px-4 py-2 relative
                                ${isOwnMessage
                                  ? 'bg-gradient-primary text-white rounded-br-sm'
                                  : 'bg-dark-surface text-cyan-300 rounded-bl-sm border border-dark-border'
                                }
                              `}
                            >
                              {!isOwnMessage && !isConsecutive && (
                                <p className="text-xs font-semibold mb-1 opacity-80">
                                  {message.sender.firstName} {message.sender.lastName}
                                </p>
                              )}
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.message}
                              </p>
                              <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-xs opacity-70">
                                  {formatTime(message.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-dark-border glass">
                <div className="flex items-end gap-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg hover:bg-dark-surface transition-colors flex-shrink-0"
                    title="Attach file"
                  >
                    <Paperclip className="w-5 h-5 text-cyan-400" />
                  </motion.button>
                  
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Type a message..."
                      rows={1}
                      className="block w-full px-4 py-3 border border-dark-border rounded-xl bg-dark-surface text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all resize-none max-h-32 overflow-y-auto"
                      style={{ minHeight: '44px' }}
                    />
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg hover:bg-dark-surface transition-colors flex-shrink-0"
                    title="Add emoji"
                  >
                    <Smile className="w-5 h-5 text-cyan-400" />
                  </motion.button>

                  <motion.button
                    type="submit"
                    disabled={!newMessage.trim()}
                    whileHover={{ scale: newMessage.trim() ? 1.05 : 1 }}
                    whileTap={{ scale: newMessage.trim() ? 0.95 : 1 }}
                    className={`
                      p-3 rounded-xl flex-shrink-0 transition-all
                      ${newMessage.trim()
                        ? 'bg-gradient-primary text-white shadow-lg shadow-primary-500/50'
                        : 'bg-dark-surface text-cyan-400/30 cursor-not-allowed'
                      }
                    `}
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 rounded-full bg-gradient-primary/20 flex items-center justify-center mb-4"
              >
                <Users className="w-10 h-10 text-cyan-400" />
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Select a group
              </h3>
              <p className="text-cyan-400/70 text-center max-w-md">
                Choose a group from the list to start chatting, or create a new group
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
