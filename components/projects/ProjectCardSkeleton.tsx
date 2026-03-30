import { motion } from 'framer-motion';

export default function ProjectCardSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 space-y-2">
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4 animate-pulse" />
                    <div className="h-4 bg-slate-100 dark:bg-slate-700/50 rounded-md w-full animate-pulse" />
                    <div className="h-4 bg-slate-100 dark:bg-slate-700/50 rounded-md w-5/6 animate-pulse" />
                    <div className="flex items-center gap-2 mt-3">
                        <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded-full w-20 animate-pulse" />
                        <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded-full w-16 animate-pulse" />
                    </div>
                </div>
                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
            </div>

            <div className="mb-4 space-y-2">
                <div className="flex justify-between">
                    <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-16 animate-pulse" />
                    <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-10 animate-pulse" />
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 animate-pulse" />
            </div>

            <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-32 animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-40 animate-pulse" />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                    <div className="space-y-1">
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20 animate-pulse" />
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-12 animate-pulse" />
                    </div>
                </div>
                <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="w-8 h-8 bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 rounded-full animate-pulse" />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="h-9 bg-slate-100 dark:bg-slate-700/50 rounded-lg animate-pulse" />
                <div className="h-9 bg-slate-100 dark:bg-slate-700/50 rounded-lg animate-pulse" />
                <div className="h-9 bg-slate-100 dark:bg-slate-700/50 rounded-lg animate-pulse" />
            </div>
        </div>
    );
}
