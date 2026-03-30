'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { performanceService } from '@/services/performance.service';
import { useAuthStore } from '@/store/authStore';
import Datepicker from 'react-tailwindcss-datepicker';
import {
    TrendingUp,
    Star,
    Target,
    Award,
    Plus,
    X,
    User,
    Check,
} from 'lucide-react';

export default function AddPerformancePage() {
    const router = useRouter();
    const { user: currentUser, employee, isAuthenticated } = useAuthStore();

    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form State
    const [reviewPeriod, setReviewPeriod] = useState('');
    const [dateValue, setDateValue] = useState({
        startDate: null,
        endDate: null
    });
    const [goals, setGoals] = useState<string[]>(['']);
    const [achievements, setAchievements] = useState<string[]>(['']);
    const [error, setError] = useState<string | null>(null);

    const handleAddGoal = () => setGoals([...goals, '']);
    const handleRemoveGoal = (index: number) => setGoals(goals.filter((_, i) => i !== index));
    const handleGoalChange = (index: number, value: string) => {
        const updated = [...goals];
        updated[index] = value;
        setGoals(updated);
    };

    const handleAddAchievement = () => setAchievements([...achievements, '']);
    const handleRemoveAchievement = (index: number) => setAchievements(achievements.filter((_, i) => i !== index));
    const handleAchievementChange = (index: number, value: string) => {
        const updated = [...achievements];
        updated[index] = value;
        setAchievements(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employee?.id) {
            setError('Employee profile not found. Please contact your administrator.');
            return;
        }
        if (!reviewPeriod.trim()) {
            setError('Please enter a review period.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            await performanceService.createPerformance({
                employeeId: employee.id,
                reviewPeriod: reviewPeriod.trim(),
                rating: 0, // Default rating, will be updated by manager
                goals: goals.filter((g) => g.trim()),
                achievements: achievements.filter((a) => a.trim()),
            });
            setSuccess(true);
            // Reset form
            setReviewPeriod('');
            setDateValue({ startDate: null, endDate: null });
            setGoals(['']);
            setAchievements(['']);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error: any) {
            setError(error.response?.data?.message || error.response?.data?.error || 'Failed to submit performance review.');
        } finally {
            setSubmitting(false);
        }
    };


    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-3xl mx-auto">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        My Performance Review
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Submit your own performance self-assessment
                    </p>
                </div>

                {/* Success Banner */}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-xl text-green-800 dark:text-green-300 flex items-center gap-2"
                    >
                        <Check className="w-5 h-5" />
                        Performance review submitted successfully!
                    </motion.div>
                )}

                {/* Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {error && (
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-800 dark:text-red-300 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submitting As (read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Submitting As
                            </label>
                            <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg">
                                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {employee ? `${employee.firstName[0]}${employee.lastName[0]}` : <User className="w-5 h-5" />}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {employee ? `${employee.firstName} ${employee.lastName}` : 'Loading...'}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {employee?.position || employee?.employeeId || ''}{employee?.department ? ` • ${employee.department}` : ''}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Review Period */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Review Period <span className="text-red-500">*</span>
                            </label>
                            <div className="relative z-50">
                                <Datepicker
                                    primaryColor="indigo"
                                    value={dateValue as any}
                                    onChange={(newValue: any) => {
                                        setDateValue(newValue);
                                        if (newValue?.startDate && newValue?.endDate) {
                                            const start = new Date(newValue.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                            const end = new Date(newValue.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                            setReviewPeriod(`${start} - ${end}`);
                                        } else {
                                            setReviewPeriod('');
                                        }
                                    }}
                                    displayFormat="DD MMM YYYY"
                                    placeholder="Select review period range"
                                    inputClassName="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    useRange={true}
                                />
                            </div>
                        </div>


                        {/* Goals */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <Target className="w-4 h-4" /> Goals
                            </label>
                            <div className="space-y-2">
                                {goals.map((goal, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={goal}
                                            onChange={(e) => handleGoalChange(index, e.target.value)}
                                            placeholder={`Goal ${index + 1}`}
                                            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {goals.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveGoal(index)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddGoal} className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                                    <Plus className="w-4 h-4" /> Add Goal
                                </button>
                            </div>
                        </div>

                        {/* Achievements */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <Award className="w-4 h-4" /> Achievements
                            </label>
                            <div className="space-y-2">
                                {achievements.map((achievement, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={achievement}
                                            onChange={(e) => handleAchievementChange(index, e.target.value)}
                                            placeholder={`Achievement ${index + 1}`}
                                            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {achievements.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveAchievement(index)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddAchievement} className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                                    <Plus className="w-4 h-4" /> Add Achievement
                                </button>
                            </div>
                        </div>


                        {/* Submit */}
                        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                            <button
                                type="submit"
                                disabled={submitting || !employee?.id}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2 font-medium"
                            >
                                {submitting ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                        />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Submit Review
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}
