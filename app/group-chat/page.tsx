'use client';

import { useEffect, useState, useRef } from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
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
  CheckCheck,
  X,
  User
} from 'lucide-react';
import { Group, ChatMessage } from '@/services/chat.service';
import { chatService } from '@/services/chat.service';
import { socketService } from '@/services/socket.service';
import { useAuthStore } from '@/store/authStore';
import { employeeService, Employee } from '@/services/employee.service';
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
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);
  const [addMembersError, setAddMembersError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploading, setUploading] = useState(false);
  const employee = useAuthStore((state) => state.employee);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedGroupRef = useRef<Group | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    selectedGroupRef.current = selectedGroup;
  }, [selectedGroup]);

  useEffect(() => {
    loadGroups();
    const token = localStorage.getItem('accessToken');
    if (token) {
      socketService.connect(token);
    }

    const handleReceiveGroupMessage = (message: ChatMessage) => {
      const currentGroup = selectedGroupRef.current;
      if (currentGroup && message.groupId === currentGroup.id) {
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

  useEffect(() => {
    if (showAddMembers && selectedGroup) {
      loadAvailableEmployees();
    }
  }, [showAddMembers, selectedGroup]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedGroup) return;
    
    if (fileInputRef.current) fileInputRef.current.value = '';
    const type = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';
    
    try {
      setUploading(true);
      const data = await chatService.uploadAttachment(file);
      
      if (socketService.isConnected()) {
        socketService.sendGroupMessage(selectedGroup.id, file.name, type, data.fileUrl);
      } else {
        alert('Chat not connected. Please refresh.');
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload attachment.');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateGroupSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    try {
      setSavingSettings(true);
      setError(null);
      const updatedGroup = await chatService.updateGroup(selectedGroup.id, {
        name: editGroupName,
        description: editGroupDescription
      });

      // Update local state and reflect changes immediately
      setSelectedGroup((prev) => prev ? { ...prev, ...updatedGroup } : null);
      setGroups(groups.map((g) => g.id === selectedGroup.id ? { ...g, ...updatedGroup } : g));
      setFilteredGroups(groups.map((g) => g.id === selectedGroup.id ? { ...g, ...updatedGroup } : g));
      setShowGroupSettings(false);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update group settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setCreatingGroup(true);
    setError(null);
    const groupNameToCreate = newGroupName.trim();

    try {
      await chatService.createGroup({
        name: groupNameToCreate,
        description: newGroupDescription.trim() || undefined,
        type: 'GENERAL', // Changed from 'PUBLIC' to 'GENERAL' (valid enum value)
      });

      // Reload groups to get the properly formatted group with members populated
      const updatedGroups = await chatService.getGroups();
      setGroups(updatedGroups);
      setFilteredGroups(updatedGroups);

      setShowCreateGroup(false);
      setNewGroupName('');
      setNewGroupDescription('');

      // Find and select the newly created group
      const newGroup = updatedGroups.find(g =>
        g.name === groupNameToCreate &&
        g.createdBy === employee?.id
      );
      if (newGroup) {
        setSelectedGroup(newGroup);
      }
    } catch (error: any) {
      console.error('Failed to create group:', error);
      const errorMessage = error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create group. Please try again.';
      setError(errorMessage);
      alert(errorMessage); // Show error to user
    } finally {
      setCreatingGroup(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAvailableEmployees = async () => {
    if (!selectedGroup) return;

    try {
      setLoadingEmployees(true);
      const result = await employeeService.getEmployees(1, 1000, { isActive: true });

      // Filter out current employee and employees already in the group
      const existingMemberIds = new Set(selectedGroup.members?.map(m => m.employee.id) || []);
      const filtered = (result.employees || []).filter(
        (emp: Employee) => emp.id !== employee?.id && !existingMemberIds.has(emp.id)
      );
      setAvailableEmployees(filtered);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleAddMembers = async () => {
    if (!selectedGroup || selectedEmployeeIds.length === 0) return;

    // Check if user has permission (admin or moderator)
    const userMembership = selectedGroup.members?.find(m => m.employee.id === employee?.id);
    if (!userMembership || (userMembership.role !== 'ADMIN' && userMembership.role !== 'MODERATOR')) {
      setAddMembersError('Only admins and moderators can add members to the group.');
      return;
    }

    setAddingMembers(true);
    setAddMembersError(null);

    try {
      await chatService.addGroupMembers(selectedGroup.id, selectedEmployeeIds);

      // Reload groups to get updated member list
      await loadGroups();

      // Update selected group
      const updatedGroups = await chatService.getGroups();
      const updatedGroup = updatedGroups.find(g => g.id === selectedGroup.id);
      if (updatedGroup) {
        setSelectedGroup(updatedGroup);
      }

      setShowAddMembers(false);
      setSelectedEmployeeIds([]);
      setEmployeeSearchQuery('');
    } catch (error: any) {
      console.error('Failed to add members:', error);
      const errorMessage = error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to add members. Please try again.';
      setAddMembersError(errorMessage);
    } finally {
      setAddingMembers(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedGroup) return;

    // Check if user has permission (admin or moderator)
    const userMembership = selectedGroup.members?.find(m => m.employee.id === employee?.id);
    if (!userMembership || (userMembership.role !== 'ADMIN' && userMembership.role !== 'MODERATOR')) {
      alert('Only admins and moderators can remove members.');
      return;
    }

    try {
      await chatService.removeGroupMember(selectedGroup.id, memberId);

      // Update local state without making an extra network request for speed
      const updatedMembers = selectedGroup.members.filter(m => m.employee.id !== memberId);
      const updatedGroup = { ...selectedGroup, members: updatedMembers };

      setSelectedGroup(updatedGroup);
      setGroups(groups.map((g) => g.id === selectedGroup.id ? updatedGroup : g));
      setFilteredGroups(groups.map((g) => g.id === selectedGroup.id ? updatedGroup : g));

    } catch (error: any) {
      console.error('Failed to remove member:', error);
      alert(error.response?.data?.error || 'Failed to remove member.');
    }
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const filteredEmployees = availableEmployees.filter(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const search = employeeSearchQuery.toLowerCase();
    return fullName.includes(search) || emp.employeeId.toLowerCase().includes(search);
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
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

  const renderMessageContent = (message: ChatMessage) => {
    if (message.type === 'IMAGE' && message.fileUrl) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
      return (
        <a href={`${baseUrl}${message.fileUrl}`} target="_blank" rel="noopener noreferrer">
          <img src={`${baseUrl}${message.fileUrl}`} alt="attachment" className="max-w-full max-h-64 rounded-lg mb-1 object-cover hover:opacity-90 transition-opacity" />
        </a>
      );
    }
    if (message.type === 'FILE' && message.fileUrl) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
      return (
        <a href={`${baseUrl}${message.fileUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-dark-bg/50 rounded-lg mb-1 hover:bg-dark-bg transition-colors border border-dark-border/50">
          <Paperclip className="w-4 h-4 text-cyan-400" />
          <span className="text-sm underline decoration-cyan-400/30 underline-offset-2 break-all">{message.message}</span>
        </a>
      );
    }
    return (
      <p className="text-sm whitespace-pre-wrap break-words">
        {message.message}
      </p>
    );
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
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                      {error}
                    </div>
                  )}
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => {
                      setNewGroupName(e.target.value);
                      setError(null); // Clear error when user types
                    }}
                    placeholder="Group name"
                    required
                    disabled={creatingGroup}
                    className="w-full px-3 py-2 border border-dark-border rounded-lg bg-dark-surface text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <textarea
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="Description (optional)"
                    rows={2}
                    disabled={creatingGroup}
                    className="w-full px-3 py-2 border border-dark-border rounded-lg bg-dark-surface text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex gap-2">
                    <motion.button
                      type="submit"
                      disabled={creatingGroup || !newGroupName.trim()}
                      whileHover={creatingGroup || !newGroupName.trim() ? {} : { scale: 1.02 }}
                      whileTap={creatingGroup || !newGroupName.trim() ? {} : { scale: 0.98 }}
                      className="flex-1 px-4 py-2 bg-gradient-primary text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {creatingGroup ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                          Creating...
                        </>
                      ) : (
                        'Create'
                      )}
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => {
                        setShowCreateGroup(false);
                        setNewGroupName('');
                        setNewGroupDescription('');
                        setError(null);
                      }}
                      disabled={creatingGroup}
                      whileHover={creatingGroup ? {} : { scale: 1.02 }}
                      whileTap={creatingGroup ? {} : { scale: 0.98 }}
                      className="px-4 py-2 bg-dark-surface text-cyan-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                      key={`group-${group.id || 'unknown'}-${index}`}
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
                <div className="relative">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 rounded-lg hover:bg-dark-surface transition-colors cursor-pointer"
                  >
                    <MoreVertical className="w-5 h-5 text-cyan-400" />
                  </motion.div>
                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-dark-surface border border-dark-border rounded-xl shadow-xl z-20 overflow-hidden"
                      >
                        <div className="py-1">
                          {(selectedGroup.myRole === 'ADMIN' || selectedGroup.myRole === 'MODERATOR') && (
                            <>
                              <button
                                onClick={() => {
                                  setShowMenu(false);
                                  setEditGroupName(selectedGroup.name);
                                  setEditGroupDescription(selectedGroup.description || '');
                                  setShowGroupSettings(true);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-cyan-50 hover:bg-dark-bg/50 transition-colors flex items-center gap-2"
                              >
                                <Settings className="w-4 h-4" /> Group Settings
                              </button>
                              <button
                                onClick={() => {
                                  setShowMenu(false);
                                  setShowAddMembers(true);
                                  loadAvailableEmployees();
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-cyan-50 hover:bg-dark-bg/50 transition-colors flex items-center gap-2"
                              >
                                <UserPlus className="w-4 h-4" /> Add Members
                              </button>
                              <button
                                onClick={() => {
                                  setShowMenu(false);
                                  setShowManageMembers(true);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-cyan-50 hover:bg-dark-bg/50 transition-colors flex items-center gap-2"
                              >
                                <Users className="w-4 h-4" /> Manage Members
                              </button>
                            </>
                          )}
                          <div className="h-px bg-dark-border my-1"></div>
                          <button
                            onClick={() => {
                              setShowMenu(false);
                              if (confirm(`Are you sure you want to leave ${selectedGroup.name}?`)) {
                                // TODO: actual leave API logic
                                alert(`Left ${selectedGroup.name}`);
                              }
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-dark-bg/50 transition-colors flex items-center gap-2"
                          >
                            <LogOut className="w-4 h-4" /> Leave Group
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
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
                              {renderMessageContent(message)}
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
              <div className="relative">
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute bottom-full right-4 mb-2 z-50 shadow-2xl"
                    >
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          setNewMessage((prev) => prev + emojiData.emoji);
                        }}
                        theme={Theme.DARK}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                <form onSubmit={handleSendMessage} className="p-4 border-t border-dark-border glass">
                  <div className="flex items-end gap-2">
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-dark-surface'}`}
                    title="Attach file"
                  >
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Paperclip className="w-5 h-5 text-cyan-400" />
                    )}
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
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
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
              </div>
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

      {/* Add Members Modal */}
      <AnimatePresence>
        {showAddMembers && selectedGroup && (
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
                  <UserPlus className="w-5 h-5 text-cyan-400" />
                  Add Members to {selectedGroup.name}
                </h3>
                <button
                  onClick={() => {
                    setShowAddMembers(false);
                    setSelectedEmployeeIds([]);
                    setEmployeeSearchQuery('');
                    setAddMembersError(null);
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

              {/* Error Message */}
              {addMembersError && (
                <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {addMembersError}
                </div>
              )}

              {/* Selected Count */}
              {selectedEmployeeIds.length > 0 && (
                <div className="px-4 pt-4 text-sm text-cyan-400">
                  {selectedEmployeeIds.length} employee{selectedEmployeeIds.length !== 1 ? 's' : ''} selected
                </div>
              )}

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
                      {employeeSearchQuery ? 'No employees found' : 'No employees available to add'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredEmployees.map((emp) => {
                      const employeeName = `${emp.firstName} ${emp.lastName}`;
                      const isSelected = selectedEmployeeIds.includes(emp.id);
                      return (
                        <motion.div
                          key={emp.id}
                          whileHover={{ x: 4 }}
                          onClick={() => toggleEmployeeSelection(emp.id)}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                            ${isSelected
                              ? 'bg-cyan-500/20 border border-cyan-500/50'
                              : 'hover:bg-slate-700'
                            }
                          `}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {emp.avatar ? (
                              <img
                                src={emp.avatar}
                                alt={employeeName}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              getInitials(emp.firstName, emp.lastName)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white truncate">{employeeName}</h4>
                            <p className="text-sm text-slate-400 truncate">
                              {emp.position || emp.employeeId}
                              {emp.department && ` • ${emp.department}`}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-700 flex gap-2">
                <motion.button
                  onClick={handleAddMembers}
                  disabled={selectedEmployeeIds.length === 0 || addingMembers}
                  whileHover={selectedEmployeeIds.length === 0 || addingMembers ? {} : { scale: 1.02 }}
                  whileTap={selectedEmployeeIds.length === 0 || addingMembers ? {} : { scale: 0.98 }}
                  className={`
                    flex-1 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2
                    ${selectedEmployeeIds.length === 0 || addingMembers
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-primary text-white'
                    }
                  `}
                >
                  {addingMembers ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Add {selectedEmployeeIds.length > 0 ? `(${selectedEmployeeIds.length})` : ''}
                    </>
                  )}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => {
                    setShowAddMembers(false);
                    setSelectedEmployeeIds([]);
                    setEmployeeSearchQuery('');
                    setAddMembersError(null);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Group Settings Modal */}
      <AnimatePresence>
        {showGroupSettings && selectedGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !savingSettings && setShowGroupSettings(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  Group Settings
                </h3>
                <button
                  onClick={() => !savingSettings && setShowGroupSettings(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateGroupSettings} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Group Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Enter group name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editGroupDescription}
                    onChange={(e) => setEditGroupDescription(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none h-24"
                    placeholder="Enter group description (optional)"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => !savingSettings && setShowGroupSettings(false)}
                    disabled={savingSettings}
                    className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingSettings || !editGroupName.trim()}
                    className="flex-1 px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingSettings ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Members Modal */}
      <AnimatePresence>
        {showManageMembers && selectedGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowManageMembers(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg max-h-[80vh] flex flex-col bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 shrink-0">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  Manage Members
                </h3>
                <button
                  onClick={() => setShowManageMembers(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {(!selectedGroup.members || selectedGroup.members.length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                    No members found.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {selectedGroup.members.map((member) => {
                      const isCurrentUser = member.employee.id === employee?.id;
                      const isAdmin = member.role === 'ADMIN' || member.role === 'MODERATOR';

                      return (
                        <div
                          key={member.employee.id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {member.employee.avatar ? (
                                <img
                                  src={member.employee.avatar}
                                  alt={`${member.employee.firstName} ${member.employee.lastName}`}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                getInitials(member.employee.firstName, member.employee.lastName)
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-white">
                                  {member.employee.firstName} {member.employee.lastName}
                                  {isCurrentUser && <span className="text-slate-400 text-xs ml-1">(You)</span>}
                                </h4>
                                {isAdmin && (
                                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold tracking-wider">
                                    {member.role === 'ADMIN' ? 'ADMIN' : 'MOD'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {!isCurrentUser && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to remove ${member.employee.firstName} ${member.employee.lastName}?`)) {
                                  handleRemoveMember(member.employee.id);
                                }
                              }}
                              className="px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
