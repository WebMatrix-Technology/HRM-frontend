'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Plus,
    Trash2,
    Clock
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@/types';
import { holidayService, Holiday } from '@/services/holiday.service';
import DatePicker from '@/components/ui/DatePicker';

export default function CalendarPage() {
    const { user } = useAuthStore();
    const isAdminOrHR = user?.role === Role.ADMIN || user?.role === Role.HR_MANAGER;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form State
    const [newHoliday, setNewHoliday] = useState({
        title: '',
        date: '',
        type: 'HOLIDAY',
        description: '',
        isRecurring: false,
    });

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    useEffect(() => {
        fetchHolidays();
    }, [currentDate]);

    const fetchHolidays = async () => {
        try {
            setLoading(true);
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1; // Service expects 1-indexed
            const data = await holidayService.getHolidays(year, month);
            setHolidays(data);
        } catch (error) {
            console.error('Failed to fetch holidays:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleAddHoliday = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await holidayService.createHoliday({
                ...newHoliday,
                type: newHoliday.type as 'HOLIDAY' | 'EVENT',
            });
            setShowAddModal(false);
            setNewHoliday({ title: '', date: '', type: 'HOLIDAY', description: '', isRecurring: false });
            fetchHolidays();
        } catch (error) {
            console.error('Failed to create holiday:', error);
            alert('Failed to create holiday');
        }
    };

    const handleDeleteHoliday = async (id: string) => {
        if (!confirm('Are you sure you want to delete this holiday?')) return;
        try {
            await holidayService.deleteHoliday(id);
            fetchHolidays();
        } catch (error) {
            console.error('Failed to delete', error);
        }
    };

    // Calendar Logic
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        return days;
    };

    const getFirstDayOfMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = new Date(year, month, 1).getDay();
        return day; // 0 = Sunday
    };

    const renderCalendarDays = () => {
        const totalDays = getDaysInMonth(currentDate);
        const startDay = getFirstDayOfMonth(currentDate);
        const daysArray = [];

        // Empty cells for previous month
        for (let i = 0; i < startDay; i++) {
            daysArray.push(<div key={`empty-${i}`} className="h-24 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800" />);
        }

        // Days of current month
        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            // Find holidays for this day
            // Note: Date storage in DB is ISO, we might need to compare date parts carefully.
            // Assuming DB returns ISO stings like "2023-05-20T00:00:00.000Z"
            // We will compare YYYY-MM-DD
            const dayHolidays = holidays.filter(h => {
                const hDate = new Date(h.date);
                return hDate.getDate() === day && hDate.getMonth() === currentDate.getMonth() && hDate.getFullYear() === currentDate.getFullYear();
            });

            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

            daysArray.push(
                <div
                    key={day}
                    className={`h-24 p-2 border border-slate-100 dark:border-slate-700 relative hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-white dark:bg-slate-800'}`}
                >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {day}
                    </div>
                    <div className="space-y-1 overflow-y-auto max-h-[calc(100%-24px)] custom-scrollbar">
                        {dayHolidays.map((h) => (
                            <div
                                key={h._id}
                                className={`text-xs px-1.5 py-0.5 rounded truncate cursor-help ${h.type === 'HOLIDAY'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    }`}
                                title={h.title + (h.description ? `: ${h.description}` : '')}
                            >
                                {h.title}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return daysArray;
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                <CalendarIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            Calendar
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Company holidays and upcoming events
                        </p>
                    </div>
                    {isAdminOrHR && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Event
                        </button>
                    )}
                </div>

                {/* Calendar Controls */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrevMonth}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date())}
                                className="px-3 py-1 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-600"
                            >
                                Today
                            </button>
                            <button
                                onClick={handleNextMonth}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* Days Header */}
                    <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 bg-white dark:bg-slate-800">
                        {renderCalendarDays()}
                    </div>
                </div>

                {/* Upcomming List (Mobile/Summary) */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Events this Month</h3>
                    {holidays.length === 0 ? (
                        <p className="text-slate-500 text-center py-4">No holidays or events scheduled for this month.</p>
                    ) : (
                        <div className="space-y-3">
                            {holidays.map(h => (
                                <div key={h._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg mt-0.5 ${h.type === 'HOLIDAY' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {h.type === 'HOLIDAY' ? <CalendarIcon className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-slate-900 dark:text-white">{h.title}</h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {new Date(h.date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
                                                {h.description && ` • ${h.description}`}
                                            </p>
                                        </div>
                                    </div>
                                    {isAdminOrHR && (
                                        <button
                                            onClick={() => handleDeleteHoliday(h._id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl"
                    >
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Add Event</h3>
                        <form onSubmit={handleAddHoliday} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newHoliday.title}
                                    onChange={e => setNewHoliday({ ...newHoliday, title: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    placeholder="e.g. Annual Company Retreat"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                                    <DatePicker
                                        value={newHoliday.date}
                                        onChange={val => setNewHoliday({ ...newHoliday, date: val })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                                    <select
                                        value={newHoliday.type}
                                        onChange={e => setNewHoliday({ ...newHoliday, type: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    >
                                        <option value="HOLIDAY">Holiday</option>
                                        <option value="EVENT">Event</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                <textarea
                                    value={newHoliday.description}
                                    onChange={e => setNewHoliday({ ...newHoliday, description: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    rows={3}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="recurring"
                                    checked={newHoliday.isRecurring}
                                    onChange={e => setNewHoliday({ ...newHoliday, isRecurring: e.target.checked })}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="recurring" className="text-sm text-slate-700 dark:text-slate-300">Recurring annually</label>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </DashboardLayout>
    );
}
