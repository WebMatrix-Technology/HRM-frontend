'use client';

import { useEffect, useState, useRef } from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, MoreVertical, Check, CheckCheck, Clock, MessageCircle, Paperclip } from 'lucide-react';
import { ChatMessage } from '@/services/chat.service';
import { chatService } from '@/services/chat.service';
import { socketService } from '@/services/socket.service';
import { useAuthStore } from '@/store/authStore';

interface ChatWindowProps {
  receiverId: string;
  receiverName: string;
}

export default function ChatWindow({ receiverId, receiverName }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const employee = useAuthStore((state) => state.employee);

  useEffect(() => {
    if (!employee) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    socketService.connect(token);
    loadMessages();

    // Define callback functions that can be cleaned up
    const handleReceiveMessage = (message: ChatMessage) => {
      if (message.senderId === receiverId || message.receiverId === receiverId) {
        setMessages((prev) => {
          // Remove any temporary messages
          const filtered = prev.filter(m => !m.id.startsWith('temp-'));
          // Avoid duplicates
          if (filtered.some((m) => m.id === message.id)) return filtered;
          // Insert message in correct position based on createdAt
          const newMessages = [...filtered, message].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return newMessages;
        });
        // Mark message as read if it's from the receiver
        if (message.senderId === receiverId && !message.isRead) {
          socketService.markMessageAsRead(message.id);
        }
        scrollToBottom();
      }
    };

    const handleMessageSent = (message: ChatMessage) => {
      if (message.receiverId === receiverId || message.senderId === employee?.id) {
        setMessages((prev) => {
          // Remove any temporary messages with the same content from the same sender
          const filtered = prev.filter(m => !(m.id.startsWith('temp-') && m.message === message.message && m.senderId === message.senderId));
          // Avoid duplicates
          if (filtered.some((m) => m.id === message.id)) return filtered;
          // Insert message in correct position based on createdAt
          const newMessages = [...filtered, message].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return newMessages;
        });
        scrollToBottom();
      }
    };

    const handleTyping = (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === receiverId) {
        setIsTyping(data.isTyping);
      }
    };

    const handleError = (error: { message: string }) => {
      console.error('Socket error:', error);
      alert(`Chat error: ${error.message || 'Failed to send message'}`);
    };

    const handleConnect = () => {
      console.log('Socket connected successfully');
    };

    const handleDisconnect = () => {
      console.warn('Socket disconnected');
    };

    // Register event listeners
    socketService.onReceiveMessage(handleReceiveMessage);
    socketService.onMessageSent(handleMessageSent);
    socketService.onTyping(handleTyping);
    socketService.onError(handleError);
    socketService.onConnect(handleConnect);
    socketService.onDisconnect(handleDisconnect);

    return () => {
      // Clean up event listeners when component unmounts or receiverId changes
      socketService.offReceiveMessage(handleReceiveMessage);
      socketService.offMessageSent(handleMessageSent);
      socketService.offTyping(handleTyping);
      socketService.offError(handleError);
      socketService.offConnect(handleConnect);
      socketService.offDisconnect(handleDisconnect);
    };
  }, [receiverId, employee]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await chatService.getMessages(receiverId);
      // Sort messages by createdAt to ensure correct order
      const sortedMessages = [...data].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(sortedMessages || []);

      // Mark unread messages as read
      const unreadMessages = sortedMessages.filter(
        (msg) => msg.senderId === receiverId && !msg.isRead
      );
      unreadMessages.forEach((msg) => {
        socketService.markMessageAsRead(msg.id);
      });
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      // If conversation doesn't exist yet (404), just set empty messages
      if (error.response?.status === 404) {
        setMessages([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !employee) return;

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;

    // Optimistic update - show message immediately
    const optimisticMessage: ChatMessage = {
      id: tempId,
      senderId: employee.id,
      receiverId: receiverId,
      message: messageText,
      type: 'TEXT',
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        avatar: employee.avatar,
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');
    socketService.emitTyping(receiverId, false);

    // Check if socket is disabled (e.g., on Vercel)
    if (socketService.isSocketDisabled()) {
      // Socket is disabled, remove optimistic message and show user-friendly message
      setMessages((prev) => prev.filter(m => m.id !== tempId));
      setNewMessage(messageText); // Restore message text
      // Don't show alert - socket is intentionally disabled, user already saw the info message
      console.info('Message sending is disabled: Socket.IO is not available on this platform.');
      return;
    }

    // Check if socket is connected, if not, try to reconnect
    if (!socketService.isConnected()) {
      console.warn('Socket not connected. Attempting to reconnect...');
      const token = localStorage.getItem('accessToken');
      if (token) {
        socketService.connect(token);
        // Wait a bit for connection to establish
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter(m => m.id !== tempId));
        setNewMessage(messageText); // Restore message text
        alert('Not authenticated. Please log in again.');
        return;
      }
    }

    // Verify socket is still connected before sending
    if (!socketService.isConnected()) {
      console.error('Socket still not connected after reconnect attempt');
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(m => m.id !== tempId));
      setNewMessage(messageText); // Restore message text
      alert('Unable to connect to chat server. Please refresh the page and try again.');
      return;
    }

    try {
      console.log('Sending message to:', receiverId, 'Message:', messageText);
      socketService.sendMessage(receiverId, messageText);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(m => m.id !== tempId));
      setNewMessage(messageText); // Restore message text
      alert('Failed to send message. Please try again.');
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim()) {
      socketService.emitTyping(receiverId, true);
      typingTimeoutRef.current = setTimeout(() => {
        socketService.emitTyping(receiverId, false);
      }, 1000);
    } else {
      socketService.emitTyping(receiverId, false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employee) return;
    
    if (fileInputRef.current) fileInputRef.current.value = '';
    const type = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';
    
    try {
      setUploading(true);
      const data = await chatService.uploadAttachment(file);
      
      if (socketService.isConnected()) {
        socketService.sendMessage(receiverId, file.name, type, data.fileUrl);
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

  const getMessageStatus = (message: ChatMessage) => {
    if (message.isRead) {
      return <CheckCheck className="w-3 h-3 text-cyan-400" />;
    }
    return <Check className="w-3 h-3 text-cyan-400/50" />;
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
      <div className="p-4 border-b border-dark-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
            {receiverName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{receiverName}</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-xs text-cyan-400/70">Online</p>
            </div>
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
                className="absolute right-0 top-full mt-2 w-48 bg-dark-surface border border-dark-border rounded-xl shadow-xl z-20 overflow-hidden"
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      // TODO: Implement viewing profile
                      alert('View Profile clicked');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-cyan-50 hover:bg-dark-bg/50 transition-colors"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (confirm('Are you sure you want to clear this chat? This cannot be undone.')) {
                        setMessages([]);
                        // TODO: Implement actual clear chat API
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-dark-bg/50 transition-colors"
                  >
                    Clear Chat
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-bg/30"
      >
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 rounded-full bg-gradient-primary/20 flex items-center justify-center mb-4"
            >
              <MessageCircle className="w-8 h-8 text-cyan-400" />
            </motion.div>
            <p className="text-cyan-400/70 text-center max-w-md">
              No messages yet. Start the conversation by sending a message below!
            </p>
          </div>
        )}
        <AnimatePresence>
          {messages.map((message, index) => {
            const isOwnMessage = message.senderId === employee?.id;
            const previousMessage = index > 0 ? messages[index - 1] : undefined;
            const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
            const isConsecutive = previousMessage &&
              previousMessage.senderId === message.senderId &&
              new Date(message.createdAt).getTime() - new Date(previousMessage.createdAt).getTime() < 300000; // 5 minutes

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
                        {message.sender?.firstName?.[0] || ''}{message.sender?.lastName?.[0] || ''}
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
                      {!isOwnMessage && !isConsecutive && message.sender && (
                        <p className="text-xs font-semibold mb-1 opacity-80">
                          {message.sender.firstName} {message.sender.lastName}
                        </p>
                      )}
                      {renderMessageContent(message)}
                      <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs opacity-70">
                          {formatTime(message.createdAt)}
                        </span>
                        {isOwnMessage && (
                          <span className="ml-1">
                            {getMessageStatus(message)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex justify-start"
          >
            <div className="bg-dark-surface rounded-2xl rounded-bl-sm px-4 py-3 border border-dark-border">
              <div className="flex gap-1">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 bg-cyan-400 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 bg-cyan-400 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 bg-cyan-400 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}
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
              onChange={(e) => handleTyping(e.target.value)}
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
    </div>
  );
}
