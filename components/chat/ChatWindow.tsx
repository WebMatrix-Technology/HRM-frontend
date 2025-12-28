'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Smile, MoreVertical, Check, CheckCheck, Clock, MessageCircle } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const employee = useAuthStore((state) => state.employee);

  useEffect(() => {
    if (!employee) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    socketService.connect(token);
    loadMessages();

    socketService.onReceiveMessage((message: ChatMessage) => {
      if (message.senderId === receiverId || message.receiverId === receiverId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === message.id)) return prev;
          // Insert message in correct position based on createdAt
          const newMessages = [...prev, message].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return newMessages;
        });
        // Mark message as read if it's from the receiver
        if (message.senderId === receiverId && !message.isRead) {
          socketService.markMessageAsRead(message.id);
        }
      }
    });

    socketService.onMessageSent((message: ChatMessage) => {
      if (message.receiverId === receiverId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          // Insert message in correct position based on createdAt
          const newMessages = [...prev, message].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return newMessages;
        });
      }
    });

    socketService.onTyping((data) => {
      if (data.userId === receiverId) {
        setIsTyping(data.isTyping);
      }
    });

    socketService.onError((error) => {
      console.error('Socket error:', error);
    });

    return () => {
      // Don't disconnect socket here as it might be used by other components
      // Just clean up event listeners if needed
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
    setNewMessage('');
    socketService.emitTyping(receiverId, false);
    socketService.sendMessage(receiverId, messageText);
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
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-lg hover:bg-dark-surface transition-colors"
        >
          <MoreVertical className="w-5 h-5 text-cyan-400" />
        </motion.button>
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
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.message}
                      </p>
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
  );
}
