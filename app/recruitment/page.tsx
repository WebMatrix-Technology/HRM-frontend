'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { recruitmentService, JobPosting, JobApplication } from '@/services/recruitment.service';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@/types';
import {
  Briefcase,
  Plus,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
} from 'lucide-react';

export default function RecruitmentPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>('jobs');
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const canAccess = currentUser?.role === Role.ADMIN || currentUser?.role === Role.HR || currentUser?.role === Role.MANAGER;

  const loadJobPostings = async () => {
    try {
      setLoading(true);
      const data = await recruitmentService.getJobPostings('OPEN');
      setJobPostings(data);
    } catch (error) {
      console.error('Failed to load job postings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await recruitmentService.getApplications();
      setApplications(data);
    } catch (error) {
      console.error('Failed to load applications:', error);
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

    if (activeTab === 'jobs') {
      loadJobPostings();
    } else {
      loadApplications();
    }
  }, [isAuthenticated, canAccess, router, activeTab]);

  if (!canAccess) {
    return null;
  }

  const getStatusBadge = (status: JobApplication['status']) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      SHORTLISTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      HIRED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };
    const icons = {
      PENDING: Clock,
      SHORTLISTED: CheckCircle2,
      REJECTED: XCircle,
      HIRED: UserCheck,
    };
    const Icon = icons[status];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${styles[status]}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const getEmploymentTypeColor = (type: JobPosting['employmentType']) => {
    const colors = {
      FULL_TIME: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      PART_TIME: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      CONTRACT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      INTERN: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };
    return colors[type] || '';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                <Briefcase className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              Recruitment
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage job postings and applications
            </p>
          </div>
          {activeTab === 'jobs' && (
            <button className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors shadow-lg">
              <Plus className="w-5 h-5" />
              Post Job
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'jobs'
                ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-600 dark:border-pink-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Job Postings
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'applications'
                ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-600 dark:border-pink-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Applications
          </button>
        </div>

        {/* Job Postings */}
        {activeTab === 'jobs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobPostings.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                <Briefcase className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-500">No job postings found</p>
              </div>
            ) : (
              jobPostings.map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                        <Briefcase className="w-4 h-4" />
                        <span>{job.department}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getEmploymentTypeColor(
                        job.employmentType
                      )}`}
                    >
                      {job.employmentType.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
                    {job.description}
                  </p>

                  {job.salaryRange && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                      <DollarSign className="w-4 h-4" />
                      <span>{job.salaryRange}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(job.postedAt).toLocaleDateString()}</span>
                    </div>
                    <span className="text-xs font-semibold text-pink-600 dark:text-pink-400">
                      {job.applications?.length || 0} applications
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Applications */}
        {activeTab === 'applications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Job Applications</h2>
            </div>
            <div className="p-6 space-y-4">
              {applications.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p>No applications found</p>
                </div>
              ) : (
                applications.map((application) => (
                  <div
                    key={application.id}
                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {application.firstName} {application.lastName}
                          </h3>
                          {getStatusBadge(application.status)}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                          <p>{application.email}</p>
                          <p>{application.phone}</p>
                          {application.jobPosting && (
                            <p className="font-medium text-slate-700 dark:text-slate-300 mt-2">
                              Applied for: {application.jobPosting.title}
                            </p>
                          )}
                          <p className="text-xs text-slate-500 mt-2">
                            Applied on {new Date(application.appliedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}


