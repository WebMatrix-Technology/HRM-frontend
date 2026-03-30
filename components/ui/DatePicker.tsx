'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DatePickerProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    includeTime?: boolean;
    className?: string;
    required?: boolean;
    disabled?: boolean;
    id?: string;
    name?: string;
    min?: string;
    max?: string;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DatePicker({
    value,
    onChange,
    label,
    placeholder = 'Select date',
    includeTime = false,
    className = '',
    required = false,
    disabled = false,
    id,
    name,
    min,
    max,
}: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [hours, setHours] = useState('09');
    const [minutes, setMinutes] = useState('00');
    const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
    const [showYearPicker, setShowYearPicker] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Parse value to extract date and time
    useEffect(() => {
        if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                setCurrentMonth(date.getMonth());
                setCurrentYear(date.getFullYear());
                if (includeTime) {
                    let h = date.getHours();
                    const p = h >= 12 ? 'PM' : 'AM';
                    h = h % 12;
                    h = h ? h : 12; // the hour '0' should be '12'
                    setHours(String(h).padStart(2, '0'));
                    setMinutes(String(date.getMinutes()).padStart(2, '0'));
                    setPeriod(p);
                }
            }
        }
    }, [value, includeTime]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setShowYearPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Position dropdown
    useEffect(() => {
        if (isOpen && dropdownRef.current && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const dropdownHeight = dropdownRef.current.offsetHeight;
            const spaceBelow = window.innerHeight - rect.bottom;
            if (spaceBelow < dropdownHeight + 10) {
                dropdownRef.current.style.bottom = '100%';
                dropdownRef.current.style.top = 'auto';
                dropdownRef.current.style.marginBottom = '4px';
            } else {
                dropdownRef.current.style.top = '100%';
                dropdownRef.current.style.bottom = 'auto';
                dropdownRef.current.style.marginTop = '4px';
            }
        }
    }, [isOpen]);

    const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

    const get24Hours = (h12: string, p: 'AM' | 'PM') => {
        let h = parseInt(h12);
        if (p === 'PM' && h < 12) h += 12;
        if (p === 'AM' && h === 12) h = 0;
        return String(h).padStart(2, '0');
    };

    const selectDate = (day: number) => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (includeTime) {
            const h24 = get24Hours(hours, period);
            onChange(`${dateStr}T${h24}:${minutes}`);
        } else {
            onChange(dateStr);
        }
        if (!includeTime) {
            setIsOpen(false);
        }
    };

    const updateTime = (h: string, m: string, p: 'AM' | 'PM') => {
        setHours(h);
        setMinutes(m);
        setPeriod(p);
        if (value) {
            const datePart = value.split('T')[0];
            if (datePart) {
                const h24 = get24Hours(h, p);
                onChange(`${datePart}T${h24}:${m}`);
            }
        }
    };

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const isSelectedDate = (day: number) => {
        if (!value) return false;
        const d = new Date(value);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() === day;
    };

    const isToday = (day: number) => {
        const today = new Date();
        return today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day;
    };

    const isDisabledDate = (day: number) => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (min && dateStr < min) return true;
        if (max && dateStr > max) return true;
        return false;
    };

    const formatDisplayValue = () => {
        if (!value) return '';
        const date = new Date(value);
        if (isNaN(date.getTime())) return value;
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: includeTime ? '2-digit' : undefined,
            minute: includeTime ? '2-digit' : undefined,
            hour12: true
        };
        return date.toLocaleDateString('en-US', options);
    };

    const clearValue = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentMonth(today.getMonth());
        setCurrentYear(today.getFullYear());
        selectDate(today.getDate());
    };

    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const prevMonthDays = getDaysInMonth(currentMonth === 0 ? 11 : currentMonth - 1, currentMonth === 0 ? currentYear - 1 : currentYear);

    // Generate year range for year picker
    const yearRange = Array.from({ length: 40 }, (_, i) => currentYear - 20 + i);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Input Display */}
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
          flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-200
          ${disabled
                        ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60'
                        : isOpen
                            ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20 bg-white dark:bg-slate-800'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500'
                    }
        `}
            >
                <Calendar className={`w-4 h-4 flex-shrink-0 ${isOpen ? 'text-blue-500' : 'text-slate-400'}`} />
                <span className={`flex-1 text-sm ${value ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                    {value ? formatDisplayValue() : placeholder}
                </span>
                {value && !disabled && (
                    <button onClick={clearValue} className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors">
                        <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                )}
            </div>

            {/* Hidden native input for form compatibility */}
            <input
                type="hidden"
                id={id}
                name={name}
                value={value}
                required={required}
            />

            {/* Calendar Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute left-0 z-50 w-[320px] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                        style={{ marginTop: '4px' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600">
                            <button
                                type="button"
                                onClick={prevMonth}
                                className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowYearPicker(!showYearPicker)}
                                className="text-sm font-semibold text-white hover:bg-white/20 px-3 py-1 rounded-lg transition-colors"
                            >
                                {MONTHS[currentMonth]} {currentYear}
                            </button>
                            <button
                                type="button"
                                onClick={nextMonth}
                                className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Year Picker */}
                        <AnimatePresence>
                            {showYearPicker && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700"
                                >
                                    <div className="grid grid-cols-4 gap-1 p-3 max-h-[160px] overflow-y-auto custom-scrollbar">
                                        {yearRange.map((year) => (
                                            <button
                                                key={year}
                                                type="button"
                                                onClick={() => {
                                                    setCurrentYear(year);
                                                    setShowYearPicker(false);
                                                }}
                                                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all
                          ${year === currentYear
                                                        ? 'bg-blue-600 text-white shadow-sm'
                                                        : 'text-slate-600 dark:text-slate-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                                                    }
                        `}
                                            >
                                                {year}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Day Labels */}
                        <div className="grid grid-cols-7 px-3 pt-3 pb-1">
                            {DAYS.map((day) => (
                                <div key={day} className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 py-1">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 px-3 pb-3 gap-0.5">
                            {/* Previous month trailing days */}
                            {Array.from({ length: firstDay }, (_, i) => (
                                <button
                                    key={`prev-${i}`}
                                    type="button"
                                    onClick={() => {
                                        prevMonth();
                                        setTimeout(() => selectDate(prevMonthDays - firstDay + i + 1), 0);
                                    }}
                                    className="h-9 w-full rounded-lg text-xs text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                    {prevMonthDays - firstDay + i + 1}
                                </button>
                            ))}

                            {/* Current month days */}
                            {Array.from({ length: daysInMonth }, (_, i) => {
                                const day = i + 1;
                                const selected = isSelectedDate(day);
                                const today = isToday(day);
                                const dayDisabled = isDisabledDate(day);

                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        disabled={dayDisabled}
                                        onClick={() => selectDate(day)}
                                        className={`
                      h-9 w-full rounded-lg text-xs font-medium transition-all relative
                      ${dayDisabled
                                                ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                                : selected
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105'
                                                    : today
                                                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold ring-1 ring-blue-300 dark:ring-blue-700'
                                                        : 'text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700'
                                            }
                    `}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Time Picker */}
                        {includeTime && (
                            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                <div className="flex items-center gap-3">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Time</span>
                                    <div className="flex items-center gap-1 ml-auto">
                                        <select
                                            value={hours}
                                            onChange={(e) => updateTime(e.target.value, minutes, period)}
                                            className="px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none text-center w-12"
                                        >
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{String(i + 1).padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                        <span className="text-slate-400 font-bold">:</span>
                                        <select
                                            value={minutes}
                                            onChange={(e) => updateTime(hours, e.target.value, period)}
                                            className="px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none text-center w-12"
                                        >
                                            {Array.from({ length: 60 }, (_, i) => (
                                                <option key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                        <div className="flex border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden ml-1">
                                            <button
                                                type="button"
                                                onClick={() => updateTime(hours, minutes, 'AM')}
                                                className={`px-2 py-1.5 text-xs font-bold transition-colors ${period === 'AM' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500'}`}
                                            >
                                                AM
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateTime(hours, minutes, 'PM')}
                                                className={`px-2 py-1.5 text-xs font-bold transition-colors ${period === 'PM' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500'}`}
                                            >
                                                PM
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                            <button
                                type="button"
                                onClick={() => { onChange(''); setIsOpen(false); }}
                                className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                onClick={goToToday}
                                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                                Today
                            </button>
                            {includeTime && (
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    Done
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
