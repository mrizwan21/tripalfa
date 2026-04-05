import * as React from 'react';
export interface TimezoneSelectProps {
  value?: string;
  onChange?: (tz: string) => void;
  className?: string;
}
export const TimezoneSelect = ({
  value = 'UTC',
  onChange,
  className = '',
}: TimezoneSelectProps) => {
  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
  ];
  return (
    <select
      value={value}
      onChange={e => onChange?.(e.target.value)}
      className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ${className}`}
    >
      {timezones.map(tz => (
        <option key={tz} value={tz}>
          {tz}
        </option>
      ))}
    </select>
  );
};
