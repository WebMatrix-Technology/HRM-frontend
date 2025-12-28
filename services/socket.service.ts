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

// Check if socket.io is supported (Vercel serverless doesn't support WebSockets)
const isSocketSupported = (socketUrl: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  
  // Disable socket if backend URL is on Vercel
  if (socketUrl && socketUrl.includes('vercel.app')) {
    return false;
  }
  
  // Disable socket if frontend is on Vercel (since backend is likely also on Vercel)
  if (hostname.includes('vercel.app')) {
    // Allow only if an explicit socket URL is provided and it's not Vercel
    const explicitSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (explicitSocketUrl && !explicitSocketUrl.includes('vercel.app')) {
      return true;
    }
    return false;
  }
  
  return true;
};

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): Socket {
    if (typeof window === 'undefined') {
      return {} as Socket;
    }
    
    // Get socket URL at runtime (use SOCKET_URL which is already computed, or recompute if needed)
    let socketUrl = SOCKET_URL;
    if (!socketUrl || socketUrl === 'http://localhost:5000') {
      // Recompute if SOCKET_URL wasn't set correctly
      socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
        (process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:5000');
    }
    
    // Check if socket is supported at runtime
    const socketSupported = isSocketSupported(socketUrl);
    
    // If socket is not supported (e.g., on Vercel), don't attempt connection
    if (!socketSupported) {
      // Disconnect any existing real socket connection
      if (this.socket && (this.socket as any).__isMock !== true) {
        this.socket.disconnect();
        this.socket = null;
      }
      
      // Return existing mock socket if any, otherwise create a minimal no-op socket object
      if (!this.socket) {
        // Create a minimal mock socket that has the expected methods but does nothing
        this.socket = {
          __isMock: true,
          connected: false,
          disconnected: true,
          emit: () => this.socket as any,
          on: () => this.socket as any,
          off: () => this.socket as any,
          disconnect: () => this.socket as any,
          connect: () => this.socket as any,
        } as any;
        console.info('Socket.io is disabled: Vercel serverless functions do not support WebSocket connections. Real-time chat features will use polling via REST API instead.');
      }
      return this.socket;
    }

    if (this.socket?.connected && (this.socket as any).__isMock !== true) {
      return this.socket;
    }

    // Disconnect existing socket if any (including mock sockets)
    if (this.socket) {
      if ((this.socket as any).__isMock !== true) {
        this.socket.disconnect();
      }
      this.socket = null;
    }

    // Detect if we're on Vercel or production at runtime
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');

    // Use polling for Vercel/production as it doesn't support persistent WebSocket connections
    // For local development, try polling first (more reliable), then websocket as fallback
    const transports = (isProduction || isVercel) ? ['polling'] : ['polling', 'websocket'];

    console.log('Connecting to socket:', socketUrl, 'with transports:', transports);

    this.socket = io(socketUrl, {
      auth: { token },
      transports: transports,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      forceNew: false,
      upgrade: !isVercel && !isProduction, // Don't try to upgrade to websocket on Vercel
      // Suppress error logging for cleaner console
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      // Only log if not a normal disconnect
      if (reason !== 'io client disconnect') {
        console.log('Socket disconnected:', reason);
      }
      if (reason === 'io server disconnect') {
        // Server disconnected the socket, need to reconnect manually
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      // Only log after max attempts to reduce console noise
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.warn('Socket.io connection failed after multiple attempts. Real-time features may not work.');
        // Disable further reconnection attempts
        this.socket?.disconnect();
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
    if (!this.socket?.connected) return;
    this.socket.emit('send_message', { receiverId, message, type, fileUrl });
  }

  onReceiveMessage(callback: (message: ChatMessage) => void): void {
    if (!this.socket) return;
    this.socket.on('receive_message', callback);
  }

  onMessageSent(callback: (message: ChatMessage) => void): void {
    if (!this.socket) return;
    this.socket.on('message_sent', callback);
  }

  onTyping(callback: (data: { userId: string; isTyping: boolean }) => void): void {
    if (!this.socket) return;
    this.socket.on('user_typing', callback);
  }

  emitTyping(receiverId: string, isTyping: boolean): void {
    if (!this.socket?.connected) return;
    this.socket.emit('typing', { receiverId, isTyping });
  }

  // Group chat events
  joinGroup(groupId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('join_group', groupId);
  }

  leaveGroup(groupId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('leave_group', groupId);
  }

  sendGroupMessage(groupId: string, message: string, type = 'TEXT', fileUrl?: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('send_group_message', { groupId, message, type, fileUrl });
  }

  onReceiveGroupMessage(callback: (message: ChatMessage) => void): void {
    if (!this.socket) return;
    this.socket.on('receive_group_message', callback);
  }

  onUserJoined(callback: (data: { employeeId: string; groupId: string }) => void): void {
    if (!this.socket) return;
    this.socket.on('user_joined', callback);
  }

  onUserLeft(callback: (data: { employeeId: string; groupId: string }) => void): void {
    if (!this.socket) return;
    this.socket.on('user_left', callback);
  }

  markMessageAsRead(messageId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('mark_read', { messageId });
  }

  onError(callback: (error: { message: string }) => void): void {
    if (!this.socket) return;
    this.socket.on('error', callback);
  }

  onConnect(callback: () => void): void {
    if (!this.socket) return;
    this.socket.on('connect', callback);
  }

  onDisconnect(callback: () => void): void {
    if (!this.socket) return;
    this.socket.on('disconnect', callback);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();

