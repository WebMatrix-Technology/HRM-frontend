'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { recruitmentService, Job } from '@/services/recruitment.service';
import {
    Users,
    MapPin,
    Briefcase,
    Clock,
    DollarSign,
    ArrowRight,
    Search,
    X,
    Loader2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import PublicHeader from '@/components/layout/PublicHeader';

export default function CareersPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Application Modal State
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isApplying, setIsApplying] = useState(false);
    const [applicationSuccess, setApplicationSuccess] = useState('');
    const [applicationError, setApplicationError] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        resumeUrl: '',
        coverLetter: ''
    });

    useEffect(() => {
        loadJobs();
    }, []);

    const loadJobs = async () => {
        try {
            setLoading(true);
            // Fetch only OPEN jobs
            const fetchedJobs = await recruitmentService.getJobs({ status: 'OPEN' });
            setJobs(fetchedJobs);
        } catch (error) {
            console.error('Failed to load jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmitApplication = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedJob) return;

        try {
            setIsApplying(true);
            setApplicationError('');

            await recruitmentService.applyForJob(selectedJob._id, formData);
            setApplicationSuccess('Your application has been submitted successfully! We will be in touch soon.');

            // Clear form but keep success message visible for a bit
            setTimeout(() => {
                setApplicationSuccess('');
                setSelectedJob(null);
                setFormData({
                    firstName: '', lastName: '', email: '', phone: '', resumeUrl: '', coverLetter: ''
                });
            }, 3000);

        } catch (error: any) {
            setApplicationError(error.response?.data?.error || error.message || 'Failed to submit application');
        } finally {
            setIsApplying(false);
        }
    };

    const getJobTypeLabel = (type: string) => {
        return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-50 transition-colors duration-300 font-sans">

            {/* Background Decorators */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 dark:bg-blue-600/20 blur-[120px]" />
                <div className="absolute bottom-[20%] left-[-10%] w-[30%] h-[30%] rounded-full bg-purple-500/10 dark:bg-purple-600/20 blur-[120px]" />
            </div>

            {/* Navigation */}
            <PublicHeader />

            {/* Header Section */}
            <section className="relative pt-20 pb-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6"
                    >
                        Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">WebMatrix</span> Team
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-slate-600 dark:text-slate-400 mb-10"
                    >
                        Help us build the next generation of web experiences. Explore our open roles and find your next big opportunity.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="relative max-w-2xl mx-auto"
                    >
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by role, department, or location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-900 dark:text-white shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        />
                    </motion.div>
                </div>
            </section>

            {/* Jobs Listing Grid */}
            <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700"
                    >
                        <Briefcase className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No open positions found</h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            {searchQuery ? "Try adjusting your search terms." : "We're not currently hiring, but check back soon!"}
                        </p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredJobs.map((job, index) => (
                            <motion.div
                                key={job._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4">
                                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full border border-green-200 dark:border-green-800/50">
                                        We're Hiring
                                    </span>
                                </div>

                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white pr-24 mb-2">{job.title}</h3>

                                <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400 mb-6 font-medium">
                                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg">
                                        <Briefcase className="w-4 h-4 text-blue-500" />
                                        {job.department}
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg">
                                        <MapPin className="w-4 h-4 text-emerald-500" />
                                        {job.location}
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg">
                                        <Clock className="w-4 h-4 text-amber-500" />
                                        {getJobTypeLabel(job.type)}
                                    </div>
                                    {job.salaryRange && (
                                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg">
                                            <DollarSign className="w-4 h-4 text-purple-500" />
                                            {job.salaryRange.min.toLocaleString()} - {job.salaryRange.max.toLocaleString()} {job.salaryRange.currency}
                                        </div>
                                    )}
                                </div>

                                <p className="text-slate-600 dark:text-slate-300 line-clamp-3 mb-8">
                                    {job.description}
                                </p>

                                <div className="flex justify-end mt-auto">
                                    <button
                                        onClick={() => setSelectedJob(job)}
                                        className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5"
                                    >
                                        Apply Now
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>

            {/* Application Modal */}
            <AnimatePresence>
                {selectedJob && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Apply for {selectedJob.title}</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1">{selectedJob.department} • {selectedJob.location}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedJob(null)}
                                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6 text-slate-500" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto">
                                {applicationSuccess ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mb-4">
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Application Received!</h3>
                                        <p className="text-slate-600 dark:text-slate-400">{applicationSuccess}</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmitApplication} className="space-y-5">

                                        {applicationError && (
                                            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                                                <p className="text-sm text-red-800 dark:text-red-200">{applicationError}</p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">First Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.firstName}
                                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Last Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.lastName}
                                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email Address *</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Phone Number *</label>
                                                <input
                                                    type="tel"
                                                    required
                                                    value={formData.phone}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Resume URL *</label>
                                            <input
                                                type="url"
                                                required
                                                placeholder="Link to LinkedIn, Google Drive, Portfolio, etc."
                                                value={formData.resumeUrl}
                                                onChange={e => setFormData({ ...formData, resumeUrl: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Cover Letter (Optional)</label>
                                            <textarea
                                                rows={4}
                                                value={formData.coverLetter}
                                                onChange={e => setFormData({ ...formData, coverLetter: e.target.value })}
                                                placeholder="Tell us why you're a great fit..."
                                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                            />
                                        </div>

                                        <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedJob(null)}
                                                className="px-6 py-3 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isApplying}
                                                className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                                            >
                                                {isApplying ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : 'Submit Application'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
