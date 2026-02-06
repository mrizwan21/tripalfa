import React, { useState, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
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
  isToday
} from 'date-fns';

interface DualMonthCalendarProps {
  departureDate?: Date | null;
  returnDate?: Date | null;
  onDepartureDateChange?: (date: Date) => void;
  onReturnDateChange?: (date: Date) => void;
  onClose?: () => void;
  mode?: 'flight' | 'hotel';
  departureLabel?: string;
  returnLabel?: string;
  minDate?: Date;
}

type SelectionMode = 'departure' | 'return';

export function DualMonthCalendar({
  departureDate,
  returnDate,
  onDepartureDateChange,
  onReturnDateChange,
  onClose,
  mode = 'flight',
  departureLabel = 'Departure',
  returnLabel = 'Return',
  minDate = new Date()
}: DualMonthCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('departure');
  const [isOpen, setIsOpen] = useState(false);
  const [internalDeparture, setInternalDeparture] = useState<Date | null>(departureDate || null);
  const [internalReturn, setInternalReturn] = useState<Date | null>(returnDate || null);

  useEffect(() => {
    setInternalDeparture(departureDate || null);
  }, [departureDate]);

  useEffect(() => {
    setInternalReturn(returnDate || null);
  }, [returnDate]);

  const nextMonth = addMonths(currentMonth, 1);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    if (isBefore(date, startOfDay(minDate))) return;

    if (selectionMode === 'departure') {
      setInternalDeparture(date);
      onDepartureDateChange?.(date);
      // Auto-advance to return selection
      setSelectionMode('return');
      // If return date is before new departure, clear it
      if (internalReturn && isBefore(internalReturn, date)) {
        setInternalReturn(null);
      }
    } else {
      // Return date must be after departure
      if (internalDeparture && !isAfter(date, internalDeparture)) {
        // If clicked date is before departure, set it as new departure
        setInternalDeparture(date);
        onDepartureDateChange?.(date);
        setInternalReturn(null);
        return;
      }
      setInternalReturn(date);
      onReturnDateChange?.(date);
      // Close after selecting return date
      setTimeout(() => {
        setIsOpen(false);
        onClose?.();
      }, 200);
    }
  };

  const startOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const isInRange = (date: Date) => {
    if (!internalDeparture || !internalReturn) return false;
    return isAfter(date, internalDeparture) && isBefore(date, internalReturn);
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
        <div className="text-center font-bold text-gray-900 text-lg mb-4">
          {format(monthDate, 'MMMM yyyy')}
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-xs font-bold text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((date, dayIndex) => {
                const isCurrentMonth = isSameMonth(date, monthDate);
                const isPast = isBefore(date, startOfDay(minDate));
                const isDeparture = internalDeparture && isSameDay(date, internalDeparture);
                const isReturn = internalReturn && isSameDay(date, internalReturn);
                const inRange = isInRange(date);
                const isTodayDate = isToday(date);

                let bgClass = 'bg-transparent hover:bg-gray-100';
                let textClass = 'text-gray-900';
                let borderClass = '';

                if (!isCurrentMonth) {
                  textClass = 'text-gray-300';
                  bgClass = 'bg-transparent';
                } else if (isPast) {
                  textClass = 'text-gray-300';
                  bgClass = 'bg-transparent cursor-not-allowed';
                } else if (isDeparture) {
                  bgClass = 'bg-pink-400';
                  textClass = 'text-white font-bold';
                } else if (isReturn) {
                  bgClass = 'bg-green-500';
                  textClass = 'text-white font-bold';
                } else if (inRange) {
                  bgClass = 'bg-yellow-400/80';
                  textClass = 'text-gray-900';
                } else if (isTodayDate) {
                  borderClass = 'ring-2 ring-purple-500';
                }

                return (
                  <button
                    key={dayIndex}
                    onClick={() => isCurrentMonth && !isPast && handleDateClick(date)}
                    disabled={!isCurrentMonth || isPast}
                    className={`
                      w-10 h-10 flex items-center justify-center rounded-lg text-sm transition-all
                      ${bgClass} ${textClass} ${borderClass}
                      ${isCurrentMonth && !isPast ? 'cursor-pointer' : 'cursor-default'}
                    `}
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

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return 'Select date';
    return format(date, 'EEE, d MMM');
  };

  return (
    <div>
      {/* Hidden inputs for E2E testing */}
      <input 
        type="text" 
        data-testid={mode === 'flight' ? 'flight-departure-date' : 'hotel-checkin-date'}
        className="hidden" 
        value={internalDeparture ? format(internalDeparture, 'yyyy-MM-dd') : ''} 
        onChange={(e) => {
          const date = new Date(e.target.value);
          if (!isNaN(date.getTime())) {
            setInternalDeparture(date);
            onDepartureDateChange?.(date);
          }
        }}
      />
      <input 
        type="text" 
        data-testid={mode === 'flight' ? 'flight-return-date' : 'hotel-checkout-date'}
        className="hidden" 
        value={internalReturn ? format(internalReturn, 'yyyy-MM-dd') : ''} 
        onChange={(e) => {
          const date = new Date(e.target.value);
          if (!isNaN(date.getTime())) {
            setInternalReturn(date);
            onReturnDateChange?.(date);
          }
        }}
      />
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <div className="flex gap-2 cursor-pointer">
          {/* Departure/Check-in Input */}
          <div 
            className={`flex items-center gap-2 bg-white px-4 py-3 rounded-xl border-2 transition-all ${
              selectionMode === 'departure' && isOpen 
                ? 'border-purple-500 ring-2 ring-purple-100' 
                : 'border-gray-100 hover:border-gray-200'
            }`}
            onClick={() => { setSelectionMode('departure'); setIsOpen(true); }}
          >
            <Calendar size={18} className="text-purple-500" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {mode === 'hotel' ? 'Check-in' : departureLabel}
              </span>
              <span className="text-sm font-bold text-gray-900">
                {formatDisplayDate(internalDeparture)}
              </span>
            </div>
          </div>

          {/* Return/Check-out Input */}
          <div 
            className={`flex items-center gap-2 bg-white px-4 py-3 rounded-xl border-2 transition-all ${
              selectionMode === 'return' && isOpen 
                ? 'border-green-500 ring-2 ring-green-100' 
                : 'border-gray-100 hover:border-gray-200'
            }`}
            onClick={() => { setSelectionMode('return'); setIsOpen(true); }}
          >
            <Calendar size={18} className="text-green-500" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {mode === 'hotel' ? 'Check-out' : returnLabel}
              </span>
              <span className="text-sm font-bold text-gray-900">
                {formatDisplayDate(internalReturn)}
              </span>
            </div>
          </div>
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="w-[700px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 z-[100] animate-in fade-in-0 zoom-in-95"
          sideOffset={12}
          align="start"
        >
          {/* Selection Mode Tabs */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div className="flex gap-4">
              <button
                onClick={() => setSelectionMode('departure')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  selectionMode === 'departure'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {mode === 'hotel' ? 'Check-in' : departureLabel}
                {internalDeparture && (
                  <span className="ml-2 text-xs font-normal">
                    {format(internalDeparture, 'MMM d')}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSelectionMode('return')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  selectionMode === 'return'
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {mode === 'hotel' ? 'Check-out' : returnLabel}
                {internalReturn && (
                  <span className="ml-2 text-xs font-normal">
                    {format(internalReturn, 'MMM d')}
                  </span>
                )}
              </button>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Dual Month View */}
          <div className="flex gap-8">
            {renderMonth(currentMonth)}
            {renderMonth(nextMonth)}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-pink-400" />
              <span className="text-xs text-gray-500">
                {mode === 'hotel' ? 'Check-in' : 'Departure'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="text-xs text-gray-500">
                {mode === 'hotel' ? 'Check-out' : 'Return'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-400" />
              <span className="text-xs text-gray-500">Selected Range</span>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
    </div>
  );
}
