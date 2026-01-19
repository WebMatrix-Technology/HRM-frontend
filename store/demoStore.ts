import { create } from 'zustand';
import { Role } from '@/types';

interface DemoState {
    isDemoMode: boolean;
    demoRole: Role;
    enableDemoMode: () => void;
    disableDemoMode: () => void;
    setDemoRole: (role: Role) => void;
}

export const useDemoStore = create<DemoState>((set) => ({
    isDemoMode: false,
    demoRole: Role.ADMIN, // Default to Admin for full visibility

    enableDemoMode: () => {
        localStorage.setItem('isDemoMode', 'true');
        set({ isDemoMode: true });
    },

    disableDemoMode: () => {
        localStorage.removeItem('isDemoMode');
        set({ isDemoMode: false });
    },

    setDemoRole: (role: Role) => {
        set({ demoRole: role });
    },
}));
