'use client';

import { useDemoStore } from '@/store/demoStore';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@/types';
import { useState } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

export default function DemoRoleSwitcher() {
    const { isDemoMode, demoRole, setDemoRole } = useDemoStore();
    const { user, setUser } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);

    if (!isDemoMode) return null;

    const handleRoleChange = (role: Role) => {
        setDemoRole(role);
        // Instant UI update
        if (user) {
            setUser({ ...user, role });
        }
        setIsOpen(false);
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
            <div className="bg-yellow-500/10 backdrop-blur-md border border-yellow-500/50 text-yellow-500 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 shadow-lg">
                <AlertCircle className="w-3 h-3" />
                Demo Mode Enabled
            </div>

            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl shadow-2xl hover:bg-slate-800 transition-colors pointer-events-auto"
                >
                    <div className="flex flex-col items-start text-xs">
                        <span className="text-slate-400">Viewing as</span>
                        <span className="font-bold text-base text-primary-400">{demoRole}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                        {Object.values(Role).map((role) => (
                            <button
                                key={role}
                                onClick={() => handleRoleChange(role)}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-800 transition-colors ${role === demoRole ? 'text-primary-400 bg-primary-500/10' : 'text-slate-300'}`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
