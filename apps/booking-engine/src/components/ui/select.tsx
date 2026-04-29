import * as React from "react";
import { cn } from "@tripalfa/ui-components";

type SelectContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error("Select components must be used inside <Select>");
  return ctx;
}

type SelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
};

export function Select({ value, defaultValue = "", onValueChange, children }: SelectProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const currentValue = value ?? internalValue;
  const handleChange = React.useCallback(
    (next: string) => {
      if (value === undefined) setInternalValue(next);
      onValueChange?.(next);
    },
    [onValueChange, value]
  );

  return (
    <SelectContext.Provider value={{ value: currentValue, onValueChange: handleChange }}>
      <div>{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-md border border-border bg-background px-3 py-2", className)}>
      {children}
    </div>
  );
}

export function SelectContent({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-2", className)}>{children}</div>;
}

type SelectItemProps = {
  value: string;
  children: React.ReactNode;
};

export function SelectItem({ value, children }: SelectItemProps) {
  const { value: selected, onValueChange } = useSelectContext();
  return (
    <button
      type="button"
      className={cn(
        "block w-full rounded px-2 py-1 text-left text-sm",
        selected === value
          ? "bg-blue-600 text-white"
          : "text-foreground hover:bg-muted"
      )}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useSelectContext();
  return <span className="text-sm">{value || placeholder || ""}</span>;
}
