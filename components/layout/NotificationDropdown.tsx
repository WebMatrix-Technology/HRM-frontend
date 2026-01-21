import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, Info, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import { Notification } from '@/services/notification.service';
import Link from 'next/link';

interface NotificationDropdownProps {
    notifications: Notification[];
    unreadCount: number;
    onMarkAsRead: (id: string) => void;
    onDelete: (id: string) => void;
    isOpen: boolean;
    onClose: () => void;
    viewAllLink?: string;
}

export default function NotificationDropdown({
    notifications,
    unreadCount,
    onMarkAsRead,
    onDelete,
    isOpen,
    onClose,
    viewAllLink = '/notifications',
}: NotificationDropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getTimeAgo = (dateValues: string) => {
        const date = new Date(dateValues);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + ' years ago';
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + ' months ago';
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + ' days ago';
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + ' hours ago';
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + ' minutes ago';
        return Math.floor(seconds) + ' seconds ago';
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            onMarkAsRead(notification._id);
        }
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-12 w-80 md:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 origin-top-right"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => onMarkAsRead('all')}
                                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                                <Check className="w-3 h-3" /> Mark all as read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-[30rem] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-3">
                                    <Bell className="w-6 h-6 text-slate-400" />
                                </div>
                                <p className="text-slate-900 dark:text-white font-medium mb-1">No notifications</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">You're all caught up!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={`relative p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
                                            <div className="flex-1 min-w-0" onClick={() => handleNotificationClick(notification)}>
                                                {notification.link ? (
                                                    <Link href={notification.link} className="block group">
                                                        <p className="text-sm font-medium text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                    </Link>
                                                ) : (
                                                    <div className="cursor-pointer">
                                                        <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                    </div>
                                                )}
                                                <p className="text-xs text-slate-400 mt-2">{getTimeAgo(notification.createdAt)}</p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(notification._id);
                                                }}
                                                className="flex-shrink-0 p-1 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {!notification.isRead && (
                                            <span className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
