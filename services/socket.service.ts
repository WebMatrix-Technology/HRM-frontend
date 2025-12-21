import { io, Socket } from 'socket.io-client';
import { ChatMessage } from './chat.service';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
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

