import api from './api';

export interface Notification {
    _id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    isRead: boolean;
    link?: string;
    createdAt: string;
}

export interface NotificationResponse {
    notifications: Notification[];
    unreadCount: number;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const notificationService = {
    getNotifications: async (page = 1, limit = 10) => {
        const response = await api.get<NotificationResponse>(`/notifications?page=${page}&limit=${limit}`);
        return response.data;
    },

    markAsRead: async (id: string) => {
        const response = await api.put<Notification>(`/notifications/${id}/read`);
        return response.data;
    },

    deleteNotification: async (id: string) => {
        const response = await api.delete(`/notifications/${id}`);
        return response.data;
    },
};
