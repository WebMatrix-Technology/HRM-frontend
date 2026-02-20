'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

interface IdleTimerContextType {
    idleSeconds: number;
    resetIdleTime: () => void;
    isIdle: boolean;
}

const IdleTimerContext = createContext<IdleTimerContextType>({
    idleSeconds: 0,
    resetIdleTime: () => { },
    isIdle: false,
});

export const useIdleTimer = () => useContext(IdleTimerContext);

export const IdleTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [idleSeconds, setIdleSeconds] = useState(0);
    const [isIdle, setIsIdle] = useState(false);

    // 5 minutes threshold before we consider them "idle"
    const idleThresholdMs = 5 * 60 * 1000;

    const lastActivity = useRef<number>(Date.now());
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimer = () => {
        lastActivity.current = Date.now();

        if (isIdle) {
            setIsIdle(false);
        }
    };

    useEffect(() => {
        // Events to track activity
        const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];

        const handleActivity = () => {
            resetTimer();
        };

        events.forEach((event) => {
            window.addEventListener(event, handleActivity);
        });

        // Check idle status every second
        timerRef.current = setInterval(() => {
            const now = Date.now();
            const elapsed = now - lastActivity.current;

            if (elapsed >= idleThresholdMs) {
                if (!isIdle) {
                    setIsIdle(true);
                }
                // Accumulate 1 second of idle time
                setIdleSeconds((prev) => prev + 1);
            }
        }, 1000);

        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isIdle]);

    const resetIdleTime = () => {
        setIdleSeconds(0);
        setIsIdle(false);
        lastActivity.current = Date.now();
    };

    return (
        <IdleTimerContext.Provider value={{ idleSeconds, resetIdleTime, isIdle }}>
            {children}
        </IdleTimerContext.Provider>
    );
};
