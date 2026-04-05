import * as React from 'react';
export interface CalendarProps {
  month?: Date;
  onMonthChange?: (date: Date) => void;
  selected?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
}
export const Calendar = ({
  month = new Date(),
  onMonthChange,
  selected,
  onSelect,
  className = '',
}: CalendarProps) => {
  const year = month.getFullYear();
  const m = month.getMonth();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const firstDay = new Date(year, m, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => null);
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => onMonthChange?.(new Date(year, m - 1, 1))} className="btn btn--icon">
          &larr;
        </button>
        <span className="font-medium">
          {month.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={() => onMonthChange?.(new Date(year, m + 1, 1))} className="btn btn--icon">
          &rarr;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {blanks.map((_, i) => (
          <div key={`b${i}`} />
        ))}
        {days.map(d => {
          const date = new Date(year, m, d);
          const isSelected = selected && date.toDateString() === selected.toDateString();
          return (
            <button
              key={d}
              onClick={() => onSelect?.(date)}
              className={`h-8 w-8 rounded-md text-sm ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
};
