import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { Button } from './button';
import { Label } from './label';
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
  getYear,
} from 'date-fns';

interface SingleMonthCalendarProps {
  selectedDate?: Date | null;
  onDateChange?: (date: Date) => void;
  onClose?: () => void;
  label?: string;
  maxDate?: Date;
  minDate?: Date;
  error?: string;
}

export function SingleMonthCalendar({
  selectedDate,
  onDateChange,
  onClose,
  label = 'Select Date',
  maxDate = new Date(),
  minDate = new Date(1920, 0, 1),
  error,
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
      <div className="flex-1 gap-4">
        {/* Month Header */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevMonth}
            className="p-1 h-auto w-auto hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={16} />
          </Button>
          <div className="flex gap-2">
            <select
              value={format(monthDate, 'M')}
              onChange={e => setCurrentMonth(setMonth(monthDate, parseInt(e.target.value) - 1))}
              className="text-xs font-bold uppercase bg-transparent outline-none cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i + 1}>
                  {format(new Date(2000, i, 1), 'MMMM')}
                </option>
              ))}
            </select>
            <select
              value={getYear(monthDate)}
              onChange={e => setCurrentMonth(setYear(monthDate, parseInt(e.target.value)))}
              className="text-xs font-bold uppercase bg-transparent outline-none cursor-pointer"
            >
              {(() => {
                const minYear = getYear(minDate);
                const maxYear = getYear(maxDate);
                const years: number[] = [];
                for (let y = maxYear; y >= minYear; y--) {
                  years.push(y);
                }
                return years.map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ));
              })()}
            </select>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            className="p-1 h-auto w-auto hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={16} />
          </Button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-gray-400 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="space-y-2">
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
                  bgClass = 'bg-[#003b95]';
                  textClass = 'text-white font-bold';
                }

                return (
                  <Button
                    key={dayIndex}
                    variant="ghost"
                    onClick={() =>
                      isCurrentMonth && !isFuture && !isTooOld && handleDateClick(date)
                    }
                    disabled={!isCurrentMonth || isFuture || isTooOld}
                    data-testid={`calendar-day-${format(date, 'yyyy-MM-dd')}`}
                    className={`w-8 h-8 p-0 flex items-center justify-center rounded-lg text-xs transition-all hover:bg-transparent ${bgClass} ${textClass}`}
                  >
                    {format(date, 'd')}
                  </Button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-visible [&_*]:overflow-visible">
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        {/* @ts-ignore - Radix UI / React 19 type mismatch */}
        <Popover.Trigger asChild>
          <div
            className="relative group/field cursor-pointer space-y-1.5"
            data-testid={label.toLowerCase().replace(/\s+/g, '-')}
          >
            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              {label}*
            </Label>
            <div
              className={`w-full h-12 rounded-xl border bg-white px-4 flex items-center justify-between text-sm font-semibold transition-all duration-200 hover:border-gray-300 ${error ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200'}`}
            >
              <span className={selectedDate ? 'text-gray-900' : 'text-gray-400'}>
                {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'DD/MM/YYYY'}
              </span>
              <CalendarIcon size={16} className="text-gray-400" />
            </div>
            {error && (
              <div className="flex items-center gap-1 text-red-500 pl-1">
                <AlertCircle size={10} />
                <span className="text-xs font-bold uppercase tracking-widest">{error}</span>
              </div>
            )}
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
    </div>
  );
}
