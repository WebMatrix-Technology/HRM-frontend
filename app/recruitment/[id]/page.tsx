'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { recruitmentService, Job } from '@/services/recruitment.service';
import {
    Briefcase,
    MapPin,
    DollarSign,
    ArrowLeft,
    CheckCircle2,
    Calendar,
    Building,
} from 'lucide-react';

export default function JobDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [showApplyModal, setShowApplyModal] = useState(false);

    // Application Form State
    const [applicationData, setApplicationData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        resumeUrl: '',
        coverLetter: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (params.id) {
            loadJob(params.id as string);
        }
    }, [params.id]);

    const loadJob = async (id: string) => {
        try {
            setLoading(true);
            const data = await recruitmentService.getJobById(id);
            setJob(data);
        } catch (error) {
            console.error('Failed to load job details:', error);
            router.push('/recruitment');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!job) return;

        setSubmitting(true);
        setErrorMessage('');

        try {
            await recruitmentService.applyForJob(job._id, applicationData);
            setSuccessMessage('Application submitted successfully!');
            setTimeout(() => {
                setShowApplyModal(false);
                setSuccessMessage('');
                setApplicationData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    resumeUrl: '',
                    coverLetter: '',
                });
            }, 2000);
        } catch (error: any) {
            setErrorMessage(error.response?.data?.message || 'Failed to submit application');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <DashboardLayout>
            <div className="flex items-center justify-center h-screen">Loading...</div>
        </DashboardLayout>
    );

    if (!job) return null;

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Jobs
                </button>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                                <div className="flex flex-wrap gap-4 text-blue-100">
                                    <span className="flex items-center gap-1"><Building className="w-4 h-4" /> {job.department}</span>
                                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                                    <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {job.type.replace('_', ' ')}</span>
                                    <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {job.salaryRange.min.toLocaleString()} - {job.salaryRange.max.toLocaleString()}</span>
                                </div>
                            </div>
                            {job.status === 'OPEN' && (
                                <button
                                    onClick={() => setShowApplyModal(true)}
                                    className="px-6 py-3 bg-white text-blue-600 rounded-xl font-bold shadow-lg hover:bg-blue-50 transition-colors"
                                >
                                    Apply Now
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Description</h2>
                            <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 whitespace-pre-line">
                                {job.description}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Requirements</h2>
                            <ul className="space-y-3">
                                {job.requirements.map((req, index) => (
                                    <li key={index} className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span>{req}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="pt-6 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                <Calendar className="w-4 h-4" />
                                Posted on {new Date(job.createdAt).toLocaleDateString()}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Application Modal */}
                {showApplyModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                        >
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Apply for {job.title}</h2>
                            <p className="text-slate-500 mb-6">Please fill in your details below.</p>

                            {successMessage ? (
                                <div className="p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-center font-medium">
                                    {successMessage}
                                </div>
                            ) : (
                                <form onSubmit={handleApply} className="space-y-4">
                                    {errorMessage && (
                                        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                                            <input
                                                type="text"
                                                value={applicationData.firstName}
                                                onChange={e => setApplicationData({ ...applicationData, firstName: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                                            <input
                                                type="text"
                                                value={applicationData.lastName}
                                                onChange={e => setApplicationData({ ...applicationData, lastName: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={applicationData.email}
                                                onChange={e => setApplicationData({ ...applicationData, email: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                                            <input
                                                type="tel"
                                                value={applicationData.phone}
                                                onChange={e => setApplicationData({ ...applicationData, phone: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Resume / Portfolio URL</label>
                                        <input
                                            type="url"
                                            value={applicationData.resumeUrl}
                                            onChange={e => setApplicationData({ ...applicationData, resumeUrl: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            placeholder="https://linkedin.com/in/..."
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cover Letter</label>
                                        <textarea
                                            value={applicationData.coverLetter}
                                            onChange={e => setApplicationData({ ...applicationData, coverLetter: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            rows={4}
                                            placeholder="Tell us why you're a great fit..."
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setShowApplyModal(false)}
                                            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                            disabled={submitting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {submitting ? 'Submitting...' : 'Submit Application'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
