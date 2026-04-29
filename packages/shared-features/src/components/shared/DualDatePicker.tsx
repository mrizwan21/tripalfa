import { useState, useEffect } from 'react';
import { useDropdown } from '../../hooks/useDropdown';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, isBefore } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '../../index';
import { DropdownTrigger, DropdownPopup } from './DropdownBase';

interface DateRange {
 from: Date | undefined;
 to: Date | undefined;
}

interface DualDatePickerProps {
 checkIn: Date | undefined;
 checkOut: Date | undefined;
 onCheckInChange: (date: Date) => void;
 onCheckOutChange: (date: Date) => void;
 minDate?: Date;
 label?: string;
 className?: string;
}

export function DualDatePicker({ 
 checkIn, 
 checkOut, 
 onCheckInChange, 
 onCheckOutChange, 
 minDate = new Date(),
 label = "Travel Dates",
 className
}: DualDatePickerProps) {
 const { isOpen, containerRef, toggle, close } = useDropdown();
 const [currentMonth, setCurrentMonth] = useState(new Date());
 const [dateRange, setDateRange] = useState<DateRange>({ from: checkIn, to: checkOut });

 useEffect(() => {
 setDateRange({ from: checkIn, to: checkOut });
 }, [checkIn, checkOut]);

 const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
 const prevMonth = () => setCurrentMonth(addMonths(currentMonth, -1));

 const handleDayClick = (day: Date) => {
 if (isBefore(day, minDate)) return;
 
 if (!dateRange.from || (dateRange.from && dateRange.to)) {
 setDateRange({ from: day, to: undefined });
 onCheckInChange(day);
 } else if (isBefore(day, dateRange.from)) {
 setDateRange({ from: day, to: dateRange.from });
 onCheckInChange(day);
 } else {
 const newTo = day;
 setDateRange({ ...dateRange, to: newTo });
 onCheckOutChange(newTo);
 close();
 }
 };

 const renderMonth = (monthDate: Date) => {
 const days = eachDayOfInterval({
 start: startOfMonth(monthDate),
 end: endOfMonth(monthDate)
 });

 const startDay = days[0].getDay();
 const emptyDays = Array(startDay).fill(null);

 return (
 <div key={monthDate.toISOString()} className="w-[280px]">
 <div className="text-center mb-6">
 <span className="text-sm font-bold text-slate-900">
 {format(monthDate, 'MMMM yyyy')}
 </span>
 </div>
 <div className="grid grid-cols-7 mb-2">
 {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
 <div key={`${d}-${i}`} className="text-[11px] font-bold text-slate-900 py-1 text-center">{d}</div>
 ))}
 </div>
 <div className="grid grid-cols-7 gap-y-1">
 {emptyDays.map((_, i) => (
 <div key={`empty-${i}`} className="aspect-square"/>
 ))}
 {days.map(day => {
 const isDisabled = isBefore(day, minDate);
 const isRangeStart = dateRange.from && isSameDay(day, dateRange.from);
 const isRangeEnd = dateRange.to && isSameDay(day, dateRange.to);
 const isSelected = isRangeStart || isRangeEnd;
 const isInRange = dateRange.from && dateRange.to && 
 isWithinInterval(day, { start: dateRange.from, end: dateRange.to });

 return (
 <button
 key={day.toISOString()}
 type="button"
 disabled={isDisabled}
 onClick={() => handleDayClick(day)}
 className={cn(
 "aspect-square relative flex items-center justify-center text-[13px] font-bold transition-all",
 isDisabled && "text-slate-200 cursor-not-allowed",
 !isDisabled && !isSelected && !isInRange && "text-slate-900 hover:bg-light-gray rounded-lg",
 isInRange && !isSelected && "bg-light-gray text-slate-900",
 isSelected && "bg-slate-800 text-white z-10",
 isRangeStart && "rounded-l-lg",
 isRangeEnd && "rounded-r-lg"
 )}
 >
 {format(day, 'd')}
 </button>
 );
 })}
 </div>
 </div>
 );
 };

 const secondMonth = addMonths(currentMonth, 1);

 return (
 <div ref={containerRef} className={cn("relative w-full", className)}>
 <DropdownTrigger
 label={label}
 isOpen={isOpen}
 onClick={toggle}
 icon={<Calendar className="w-4 h-4 text-near-black/40 group-hover:text-slate-600 transition-colors" />}
 displayText={
 <div className="text-sm font-semibold text-slate-900 truncate">
 {checkIn ? format(checkIn, 'EEE d/M') : 'Select Date'}
 {checkOut ? ` — ${format(checkOut, 'EEE d/M')}` : ' — Return'}
 </div>
 }
 trailingIcon={<ChevronRight className={cn("w-4 h-4 text-near-black/40 transition-transform duration-200", isOpen && "rotate-90")} />}
 />

 <DropdownPopup isOpen={isOpen} className="left-0 md:left-auto md:right-0 lg:left-0 p-4 md:p-8 min-w-[300px] md:min-w-[624px] max-w-[95vw] overflow-x-auto">
 <div className="relative min-w-[560px] md:min-w-0">
 <div className="absolute top-0 left-0 right-0 flex justify-between items-center z-10 h-5">
 <button 
 type="button"
 onClick={prevMonth} 
 className="p-1 hover:bg-light-gray rounded-lg transition-colors text-near-black/40 hover:text-slate-900"
 >
 <ChevronLeft className="w-5 h-5"/>
 </button>
 <button 
 type="button"
 onClick={nextMonth} 
 className="p-1 hover:bg-light-gray rounded-lg transition-colors text-near-black/40 hover:text-slate-900"
 >
 <ChevronRight className="w-5 h-5"/>
 </button>
 </div>

 <div className="flex gap-8">
 {renderMonth(currentMonth)}
 {renderMonth(secondMonth)}
 </div>
 </div>
 </DropdownPopup>
 </div>
 );
}
