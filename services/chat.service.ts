import api from './api';

export interface Conversation {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    position?: string;
  };
  lastMessage?: {
    id: string;
    message: string;
    type: string;
    createdAt: string;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  message: string;
  type: string;
  fileUrl?: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  type: string;
  createdBy: string;
  createdAt: string;
  members: Array<{
    employee: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    role: string;
  }>;
  messages?: ChatMessage[];
  myRole: string;
}

export const chatService = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get('/chat/conversations');
    return response.data.data;
  },

  getMessages: async (otherEmployeeId: string, limit = 50, cursor?: string): Promise<ChatMessage[]> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append('cursor', cursor);
    const response = await api.get(`/chat/messages/${otherEmployeeId}?${params}`);
    return response.data.data;
  },

  getGroups: async (): Promise<Group[]> => {
    const response = await api.get('/chat/groups');
    return response.data.data;
  },

  getGroupMessages: async (groupId: string, limit = 50, cursor?: string): Promise<ChatMessage[]> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append('cursor', cursor);
    const response = await api.get(`/chat/groups/${groupId}/messages?${params}`);
    return response.data.data;
  },

  createGroup: async (data: { name: string; description?: string; type: string; memberIds?: string[] }) => {
    const response = await api.post('/chat/groups', data);
    return response.data.data;
  },

  addGroupMembers: async (groupId: string, memberIds: string[]) => {
    const response = await api.post(`/chat/groups/${groupId}/members`, { memberIds });
    return response.data;
  },

  removeGroupMember: async (groupId: string, memberId: string) => {
    const response = await api.delete(`/chat/groups/${groupId}/members/${memberId}`);
    return response.data;
  },

  leaveGroup: async (groupId: string) => {
    const response = await api.post(`/chat/groups/${groupId}/leave`);
    return response.data;
  },
};

