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
        let allHolidays = response.data.data || [];

        // Fetch public Indian holidays and merge
        if (year) {
            try {
                const publicHolidaysRes = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN`);
                if (publicHolidaysRes.ok) {
                    const textData = await publicHolidaysRes.text();
                    const publicData = textData ? JSON.parse(textData) : [];

                    if (Array.isArray(publicData)) {
                        const mappedPublicHolidays: Holiday[] = publicData.map((h: any) => ({
                            _id: `IN-${h.date}-${h.name}`,
                            title: h.name,
                            date: h.date,
                            type: 'HOLIDAY',
                            description: 'Public Holiday (India)',
                            isRecurring: true,
                            createdBy: 'system',
                            createdAt: new Date().toISOString()
                        }));

                        // Filter by month if month is provided
                        const filteredPublicHolidays = month
                            ? mappedPublicHolidays.filter(h => new Date(h.date).getMonth() + 1 === month)
                            : mappedPublicHolidays;

                        allHolidays = [...allHolidays, ...filteredPublicHolidays];

                        // Sort holidays by date
                        allHolidays.sort((a: Holiday, b: Holiday) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    }
                }
            } catch (error) {
                console.error("Failed to fetch public Indian holidays:", error);
            }
        }

        return allHolidays;
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
