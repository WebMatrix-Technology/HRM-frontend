import { io, Socket } from 'socket.io-client';
import { ChatMessage } from './chat.service';

// For production (Vercel), use env variable if set, otherwise use relative URL; for local dev, use env variable or localhost
const getSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    // Disconnect existing socket if any
    if (this.socket) {
      this.socket.disconnect();
    }

    // Detect if we're on Vercel or production at runtime
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');

    // Use polling for Vercel/production as it doesn't support persistent WebSocket connections
    // For local development, try polling first (more reliable), then websocket as fallback
    const transports = (isProduction || isVercel) ? ['polling'] : ['polling', 'websocket'];

    console.log('Connecting to socket:', SOCKET_URL, 'with transports:', transports);

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: transports,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      forceNew: false,
      upgrade: !isVercel && !isProduction, // Don't try to upgrade to websocket on Vercel
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected the socket, need to reconnect manually
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached. Chat features may not work properly.');
        console.warn('Note: Vercel serverless functions do not support WebSocket connections. Consider using polling transport or hosting the backend on a platform that supports WebSockets (Railway, Render, etc.).');
      }
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
    }
  }

  // One-to-one chat events
  sendMessage(receiverId: string, message: string, type = 'TEXT', fileUrl?: string): void {
    this.socket?.emit('send_message', { receiverId, message, type, fileUrl });
  }

  onReceiveMessage(callback: (message: ChatMessage) => void): void {
    this.socket?.on('receive_message', callback);
  }

  onMessageSent(callback: (message: ChatMessage) => void): void {
    this.socket?.on('message_sent', callback);
  }

  onTyping(callback: (data: { userId: string; isTyping: boolean }) => void): void {
    this.socket?.on('user_typing', callback);
  }

  emitTyping(receiverId: string, isTyping: boolean): void {
    this.socket?.emit('typing', { receiverId, isTyping });
  }

  // Group chat events
  joinGroup(groupId: string): void {
    this.socket?.emit('join_group', groupId);
  }

  leaveGroup(groupId: string): void {
    this.socket?.emit('leave_group', groupId);
  }

  sendGroupMessage(groupId: string, message: string, type = 'TEXT', fileUrl?: string): void {
    this.socket?.emit('send_group_message', { groupId, message, type, fileUrl });
  }

  onReceiveGroupMessage(callback: (message: ChatMessage) => void): void {
    this.socket?.on('receive_group_message', callback);
  }

  onUserJoined(callback: (data: { employeeId: string; groupId: string }) => void): void {
    this.socket?.on('user_joined', callback);
  }

  onUserLeft(callback: (data: { employeeId: string; groupId: string }) => void): void {
    this.socket?.on('user_left', callback);
  }

  markMessageAsRead(messageId: string): void {
    this.socket?.emit('mark_read', { messageId });
  }

  onError(callback: (error: { message: string }) => void): void {
    this.socket?.on('error', callback);
  }

  onConnect(callback: () => void): void {
    this.socket?.on('connect', callback);
  }

  onDisconnect(callback: () => void): void {
    this.socket?.on('disconnect', callback);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();

