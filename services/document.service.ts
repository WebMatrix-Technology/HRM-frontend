import api from './api';

export interface Document {
    _id: string;
    employeeId: string;
    title: string;
    type: 'PDF' | 'IMAGE' | 'DOC' | 'OTHER';
    filePath: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedBy: string;
    createdAt: string;
    updatedAt: string;
}

export const documentService = {
    uploadDocument: async (employeeId: string, title: string, file: File) => {
        const formData = new FormData();
        formData.append('employeeId', employeeId);
        formData.append('title', title);
        formData.append('file', file);
        // Auto-detect type from file mime type or extension if needed, but backend defaults to OTHER

        const response = await api.post('/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data;
    },

    getDocuments: async (employeeId: string) => {
        const response = await api.get(`/documents/employee/${employeeId}`);
        return response.data.data;
    },

    deleteDocument: async (id: string) => {
        const response = await api.delete(`/documents/${id}`);
        return response.data;
    },

    getDownloadUrl: (id: string) => {
        // Since download requires auth, we can't just put it in an href unless we handle auth token.
        // However, if the browser handles cookies or if we use a specialized download handler.
        // For JWT in headers, we typically need to make a fetch request with blob response.
        return `${api.defaults.baseURL}/documents/download/${id}`;
    }
};
