import * as React from 'react';
export interface MultiSelectProps {
  options: Array<{ value: string; label: string }>;
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}
export const MultiSelect = ({
  options,
  value = [],
  onChange,
  placeholder = 'Select...',
  className = '',
}: MultiSelectProps) => {
  const [open, setOpen] = React.useState(false);
  const toggle = (v: string) =>
    onChange?.(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full items-center justify-between rounded-md border bg-background px-3 text-sm"
      >
        <span className={value.length ? '' : 'text-muted-foreground'}>
          {value.length ? `${value.length} selected` : placeholder}
        </span>
        <span>&#9662;</span>
      </button>
      {open && (
        <div className="absolute z-dropdown mt-1 w-full rounded-md border bg-popover p-1 shadow-md max-h-60 overflow-auto">
          {options.map(o => (
            <button
              key={o.value}
              onClick={() => toggle(o.value)}
              className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent ${value.includes(o.value) ? 'bg-accent' : ''}`}
            >
              <span
                className={`h-4 w-4 rounded border ${value.includes(o.value) ? 'bg-primary text-primary-foreground' : ''}`}
              >
                {value.includes(o.value) ? '✓' : ''}
              </span>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
