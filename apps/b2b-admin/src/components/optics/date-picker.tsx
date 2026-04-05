import * as React from 'react';
export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  className?: string;
  placeholder?: string;
}
export const DatePicker = ({
  value,
  onChange,
  className = '',
  placeholder = 'Pick a date',
}: DatePickerProps) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full items-center justify-between rounded-md border bg-background px-3 text-sm"
      >
        {value ? (
          value.toLocaleDateString()
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </button>
      {open && (
        <div className="absolute z-dropdown mt-1 rounded-md border bg-popover p-2 shadow-md">
          <div className="text-sm text-muted-foreground text-center">Calendar popup</div>
        </div>
      )}
    </div>
  );
};
