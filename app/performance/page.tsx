'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { performanceService, Performance } from '@/services/performance.service';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@/types';
import {
  TrendingUp,
  Plus,
  Star,
  Target,
  Award,
  Calendar,
  User,
  BarChart2,
} from 'lucide-react';
import { PerformanceChart } from '@/components/analytics/PerformanceChart';
import { PerformanceAnalytics } from '@/services/performance.service';

export default function PerformancePage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const canAccess = currentUser?.role === Role.ADMIN || currentUser?.role === Role.HR_MANAGER;

  // Analytics State
  const [activeTab, setActiveTab] = useState<'reviews' | 'analytics'>('reviews');
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const loadPerformances = async () => {
    try {
      setLoading(true);
      const data = await performanceService.getPerformances();
      setPerformances(data);
    } catch (error) {
      console.error('Failed to load performances:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    if (!canAccess) {
      router.replace('/dashboard');
      return;
    }

    loadPerformances();
  }, [isAuthenticated, canAccess, router]);

  if (!canAccess) {
    return null;
  }

  const loadAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const data = await performanceService.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics' && !analytics) {
      loadAnalytics();
    }
  }, [activeTab]);

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < Math.round(rating)
          ? 'fill-yellow-400 text-yellow-400'
          : 'text-slate-300 dark:text-slate-600'
          }`}
      />
    ));
  };

  const averageRating =
    performances.length > 0
      ? performances.reduce((sum, p) => sum + p.rating, 0) / performances.length
      : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              Performance Reviews
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Track and manage employee performance reviews
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            New Review
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'reviews'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300'
              }`}
          >
            <Star className="w-4 h-4" />
            Reviews
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'analytics'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300'
              }`}
          >
            <BarChart2 className="w-4 h-4" />
            Analytics
          </button>
        </div>

        {activeTab === 'reviews' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Average Rating</p>
                    <p className={`text-3xl font-bold mt-1 ${getRatingColor(averageRating)}`}>
                      {averageRating.toFixed(1)}
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Reviews</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {performances.length}
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-indigo-600" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Top Performers</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                      {performances.filter((p) => p.rating >= 4.5).length}
                    </p>
                  </div>
                  <Award className="w-8 h-8 text-green-600" />
                </div>
              </motion.div>
            </div>

            {/* Performance Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Performance Reviews</h2>
              </div>
              <div className="p-6 space-y-4">
                {performances.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <p>No performance reviews found</p>
                  </div>
                ) : (
                  performances.map((performance) => (
                    <div
                      key={performance.id}
                      className="p-6 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {performance.employee && (
                              <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-slate-400" />
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {performance.employee.firstName} {performance.employee.lastName}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
                            <Calendar className="w-4 h-4" />
                            <span>{performance.reviewPeriod}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex">{getRatingStars(performance.rating)}</div>
                            <span className={`text-lg font-bold ${getRatingColor(performance.rating)}`}>
                              {performance.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {performance.goals && performance.goals.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Goals
                          </h4>
                          <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
                            {performance.goals.map((goal, idx) => (
                              <li key={idx}>{goal}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {performance.achievements && performance.achievements.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            Achievements
                          </h4>
                          <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
                            {performance.achievements.map((achievement, idx) => (
                              <li key={idx}>{achievement}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {performance.feedback && (
                        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <p className="text-sm text-slate-700 dark:text-slate-300">{performance.feedback}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {loadingAnalytics ? (
              <div className="flex justify-center p-12">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : analytics ? (
              <>
                <PerformanceChart trendData={analytics.trend} departmentData={analytics.departmentAverages} />

                {/* Consistent Performers */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-green-500" />
                      Top Consistent Performers
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Employees with an average rating of 4.0 or higher</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                          <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Employee</th>
                          <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Average Rating</th>
                          <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Reviews Count</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {analytics.topPerformers.map(p => (
                          <tr key={p.employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-slate-900 dark:text-white">{p.employee.firstName} {p.employee.lastName}</div>
                              <div className="text-sm text-slate-500">{p.employee.employeeId} - {p.employee.department || 'Unassigned'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold text-sm">
                                {p.averageRating.toFixed(1)} <Star className="w-3 h-3 ml-1 fill-current" />
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                              {p.reviewCount}
                            </td>
                          </tr>
                        ))}
                        {analytics.topPerformers.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-6 py-8 text-center text-slate-500">No top performers found yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center p-12 text-slate-500">Failed to load analytics data.</div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


