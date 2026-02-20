'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { recruitmentService, Candidate, Job } from '@/services/recruitment.service';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@/types';
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    Phone,
    Mail,
    FileText,
    MessageSquare,
    Clock,
    CheckCircle,
    XCircle,
} from 'lucide-react';

export default function CandidatesPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<string>('');

    // Status Update Modal
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [newStatus, setNewStatus] = useState('');
    const [note, setNote] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const canManageRecruitment = user?.role === Role.HR_MANAGER || user?.role === Role.ADMIN;

    useEffect(() => {
        if (!canManageRecruitment) {
            router.push('/recruitment');
            return;
        }
        loadCandidates();
    }, [canManageRecruitment]);

    const loadCandidates = async () => {
        try {
            setLoading(true);
            const data = await recruitmentService.getCandidates(selectedStatus ? { status: selectedStatus } : undefined);
            setCandidates(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load candidates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCandidate || !newStatus) return;

        try {
            setIsUpdating(true);
            await recruitmentService.updateCandidateStatus(selectedCandidate._id, newStatus, note);
            setSelectedCandidate(null);
            setNote('');
            loadCandidates();
        } catch (error) {
            console.error('Failed to update status:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPLIED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'SCREENING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'INTERVIEW': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            case 'OFFER': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
            case 'HIRED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            Candidate Management
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Track and manage job applications
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex gap-4 overflow-x-auto">
                    {['ALL', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setSelectedStatus(status === 'ALL' ? '' : status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${(selectedStatus === status || (status === 'ALL' && !selectedStatus))
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                        >
                            {status === 'ALL' ? 'All Candidates' : status.charAt(0) + status.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>

                {/* Candidates List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-12 text-slate-500">Loading candidates...</div>
                    ) : candidates.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500">No candidates found</p>
                        </div>
                    ) : (
                        candidates.map((candidate) => (
                            <motion.div
                                key={candidate._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
                            >
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                {candidate.firstName} {candidate.lastName}
                                            </h3>
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(candidate.status)}`}>
                                                {candidate.status}
                                            </span>
                                        </div>

                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                            Applied for <span className="font-medium text-slate-700 dark:text-slate-200">
                                                {(candidate.jobId as Job)?.title || 'Unknown Role'}
                                            </span>
                                        </p>

                                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300 mb-4">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-slate-400" />
                                                <a href={`mailto:${candidate.email}`} className="hover:text-blue-600">{candidate.email}</a>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-slate-400" />
                                                <a href={`tel:${candidate.phone}`} className="hover:text-blue-600">{candidate.phone}</a>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                {new Date(candidate.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <a
                                                href={candidate.resumeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                            >
                                                <FileText className="w-4 h-4" />
                                                View Resume
                                            </a>
                                            {candidate.coverLetter && (
                                                <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                                    <MessageSquare className="w-4 h-4" />
                                                    Cover Letter
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-between items-end gap-4 min-w-[200px]">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedCandidate(candidate);
                                                    setNewStatus(candidate.status);
                                                }}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors shadow-sm"
                                            >
                                                Update Status
                                            </button>
                                        </div>
                                        {candidate.notes && candidate.notes.length > 0 && (
                                            <div className="text-xs text-slate-500 text-right">
                                                Latest Note: {candidate.notes[candidate.notes.length - 1].text}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Update Status Modal */}
                {selectedCandidate && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                                Update Status for {selectedCandidate.firstName}
                            </h2>
                            <form onSubmit={handleStatusUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        New Status
                                    </label>
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    >
                                        <option value="APPLIED">Applied</option>
                                        <option value="SCREENING">Screening</option>
                                        <option value="INTERVIEW">Interview</option>
                                        <option value="OFFER">Offer</option>
                                        <option value="HIRED">Hired</option>
                                        <option value="REJECTED">Rejected</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Add Note (Optional)
                                    </label>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        rows={3}
                                        placeholder="Interview feedback, rejection reason, etc."
                                    />
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedCandidate(null);
                                            setNote('');
                                        }}
                                        className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isUpdating}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {isUpdating ? 'Updating...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
