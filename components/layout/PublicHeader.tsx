import Link from 'next/link';
import { Users } from 'lucide-react';

export default function PublicHeader() {
    return (
        <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-800/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                            WebMatrix HRM
                        </h1>
                    </Link>
                    <div className="flex items-center space-x-6">
                        <Link
                            href="/careers"
                            className="hidden md:block text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
                        >
                            Careers
                        </Link>
                        <Link
                            href="/auth/login"
                            className="hidden sm:block text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/auth/login"
                            className="relative inline-flex h-10 items-center justify-center overflow-hidden rounded-lg bg-blue-600 dark:bg-blue-500 px-6 font-medium text-white shadow-lg transition-all hover:bg-blue-700 hover:scale-105 active:scale-95"
                        >
                            <span>Get Started</span>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
