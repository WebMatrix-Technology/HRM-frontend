'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { performanceService, Performance } from '@/services/performance.service';
import {
  TrendingUp,
  Plus,
  Star,
  Target,
  Award,
  Calendar,
  User,
} from 'lucide-react';

export default function PerformancePage() {
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadPerformances();
  }, []);

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
        className={`w-5 h-5 ${
          i < Math.round(rating)
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
      </div>
    </DashboardLayout>
  );
}


