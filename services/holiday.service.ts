import api from './api';

export interface Holiday {
    _id: string;
    title: string;
    date: string;
    type: 'HOLIDAY' | 'EVENT';
    description?: string;
    isRecurring: boolean;
    createdBy: string;
    createdAt: string;
}

export const holidayService = {
    getHolidays: async (year?: number, month?: number) => {
        const params: any = {};
        if (year) params.year = year;
        if (month) params.month = month;

        const response = await api.get('/holidays', { params });
        return response.data.data;
    },

    createHoliday: async (data: Omit<Holiday, '_id' | 'createdAt' | 'createdBy' | 'createdAt'>) => {
        const response = await api.post('/holidays', data);
        return response.data.data;
    },

    deleteHoliday: async (id: string) => {
        const response = await api.delete(`/holidays/${id}`);
        return response.data;
    }
};
