import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    isSameMonth,
    isSameDay,
    isBefore,
    isToday,
    setYear,
    setMonth,
    getYear
} from 'date-fns';

interface SingleMonthCalendarProps {
    selectedDate?: Date | null;
    onDateChange?: (date: Date) => void;
    onClose?: () => void;
    label?: string;
    maxDate?: Date;
    minDate?: Date;
}

export function SingleMonthCalendar({
    selectedDate,
    onDateChange,
    onClose,
    label = 'Select Date',
    maxDate = new Date(),
    minDate = new Date(1920, 0, 1)
}: SingleMonthCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
    const [isOpen, setIsOpen] = useState(false);

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const handleDateClick = (date: Date) => {
        onDateChange?.(date);
        setIsOpen(false);
        onClose?.();
    };

    const renderMonth = (monthDate: Date) => {
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

        const days: Date[] = [];
        let day = calendarStart;
        while (day <= calendarEnd) {
            days.push(day);
            day = addDays(day, 1);
        }

        const weeks: Date[][] = [];
        for (let i = 0; i < days.length; i += 7) {
            weeks.push(days.slice(i, i + 7));
        }

        return (
            <div className="flex-1">
                {/* Month Header */}
                <div className="flex items-center justify-between mb-4">
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft size={16} /></button>
                    <div className="flex gap-2">
                        <select
                            value={format(monthDate, 'M')}
                            onChange={(e) => setCurrentMonth(setMonth(monthDate, parseInt(e.target.value) - 1))}
                            className="text-[10px] font-black uppercase bg-transparent outline-none cursor-pointer"
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i} value={i + 1}>{format(new Date(2000, i, 1), 'MMMM')}</option>
                            ))}
                        </select>
                        <select
                            value={getYear(monthDate)}
                            onChange={(e) => setCurrentMonth(setYear(monthDate, parseInt(e.target.value)))}
                            className="text-[10px] font-black uppercase bg-transparent outline-none cursor-pointer"
                        >
                            {Array.from({ length: 150 }, (_, i) => {
                                const y = getYear(new Date()) - i;
                                return <option key={y} value={y}>{y}</option>;
                            })}
                        </select>
                    </div>
                    <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight size={16} /></button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="text-center text-[9px] font-black text-gray-400 py-1">{day}</div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="space-y-1">
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="grid grid-cols-7 gap-1">
                            {week.map((date, dayIndex) => {
                                const isCurrentMonth = isSameMonth(date, monthDate);
                                const isFuture = isBefore(maxDate, date) && !isSameDay(date, maxDate);
                                const isTooOld = isBefore(date, minDate);
                                const isSelected = selectedDate && isSameDay(date, selectedDate);

                                let bgClass = 'hover:bg-gray-50';
                                let textClass = 'text-gray-900';
                                if (!isCurrentMonth) textClass = 'text-gray-200';
                                if (isFuture || isTooOld) {
                                    textClass = 'text-gray-200 cursor-not-allowed';
                                    bgClass = '';
                                }
                                if (isSelected) {
                                    bgClass = 'bg-[#8B5CF6]';
                                    textClass = 'text-white font-bold';
                                }

                                return (
                                    <button
                                        key={dayIndex}
                                        onClick={() => isCurrentMonth && !isFuture && !isTooOld && handleDateClick(date)}
                                        disabled={!isCurrentMonth || isFuture || isTooOld}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-[10px] transition-all ${bgClass} ${textClass}`}
                                    >
                                        {format(date, 'd')}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
            <Popover.Trigger asChild>
                <div className="relative group/field cursor-pointer">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{label}*</label>
                    <div className="w-full h-11 px-4 bg-gray-50/50 border-2 border-transparent hover:bg-gray-50 rounded-xl flex items-center justify-between text-[11px] font-bold group-hover/field:border-[#8B5CF6]/30 transition-all">
                        <span className={selectedDate ? 'text-gray-900' : 'text-gray-300'}>
                            {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'DD/MM/YYYY'}
                        </span>
                        <CalendarIcon size={14} className="text-gray-400" />
                    </div>
                </div>
            </Popover.Trigger>

            <Popover.Portal>
                <Popover.Content
                    className="w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-[200] animate-in fade-in-0 zoom-in-95"
                    sideOffset={8}
                    align="start"
                >
                    {renderMonth(currentMonth)}
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
