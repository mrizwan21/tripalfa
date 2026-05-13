'use client';

/**
 * Dual Month Calendar - Kayak.com style
 * 
 * From screenshot (ST - Dual Calendar.png):
 * - White card with rounded corners
 * - Two months side by side (May 2026 / June 2026)
 * - Days of week: S, M, T, W, T, F, S
 * - Navigation arrows on sides
 * - Departure and Return labels at top with "exact" dropdown
 * - Clean day grid, no special past/future coloring
 */

import React, { useState, useCallback } from 'react';
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
  isAfter,
  isBefore,
  isToday,
} from 'date-fns';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { cn } from '@tripalfa/shared-utils/utils';

// --- Types ---

interface DualMonthCalendarProps {
  departureDate?: Date | null;
  returnDate?: Date | null;
  onDepartureDateChange?: (date: Date) => void;
  onReturnDateChange?: (date: Date) => void;
  onClose?: () => void;
  mode?: 'flight' | 'hotel';
  tripType?: 'roundtrip' | 'oneway';
  departureLabel?: string;
  returnLabel?: string;
}

// --- Component ---

export function DualMonthCalendar({
  departureDate,
  returnDate,
  onDepartureDateChange,
  onReturnDateChange,
  onClose,
  mode = 'flight',
  tripType = 'roundtrip',
  departureLabel = 'Departure',
  returnLabel = 'Return',
}: DualMonthCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectionType, setSelectionType] = useState<'departure' | 'return'>('departure');

  const nextMonth = addMonths(currentMonth, 1);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDateClick = (date: Date) => {
    if (selectionType === 'departure') {
      onDepartureDateChange?.(date);
      if (tripType === 'roundtrip') {
        setSelectionType('return');
      }
    } else {
      onReturnDateChange?.(date);
      setSelectionType('departure');
      onClose?.();
    }
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
        <div className="text-center font-bold text-gray-900 text-sm mb-3 px-2">
          {format(monthDate, 'MMMM yyyy')}
        </div>
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-xs font-medium text-gray-500 py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="space-y-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-0.5">
              {week.map((date, di) => {
                const isCurrentMonth = isSameMonth(date, monthDate);
                const isDeparture = departureDate && isSameDay(date, departureDate);
                const isReturn = returnDate && isSameDay(date, returnDate);

                return (
                  <button
                    key={`${wi}-${di}`}
                    onClick={() => isCurrentMonth && handleDateClick(date)}
                    disabled={!isCurrentMonth}
                    className={cn(
                      'relative w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all',
                      !isCurrentMonth && 'text-gray-300 cursor-default',
                      isDeparture && 'bg-[#003b95] text-white',
                      isReturn && 'bg-[#FF5722] text-white',
                      !isDeparture && !isReturn && isCurrentMonth && 'text-gray-900 hover:bg-gray-100'
                    )}
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
    <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-2xl shadow-black/10 ring-1 ring-gray-200/60 z-50 w-[640px] max-w-[95vw] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div className="flex gap-4">
          <span className="text-sm font-semibold text-gray-900">
            {mode === 'hotel' ? 'Check-in' : 'Departure'}
          </span>
          {tripType === 'roundtrip' && (
            <span className="text-sm font-semibold text-gray-900">
              {mode === 'hotel' ? 'Check-out' : 'Return'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <CaretLeft size={20} className="text-gray-500" />
          </button>
          <button onClick={handleNextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <CaretRight size={20} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Dual Month View */}
      <div className="flex gap-8">
        {renderMonth(currentMonth)}
        {renderMonth(nextMonth)}
      </div>
    </div>
  );
}

export default DualMonthCalendar;
