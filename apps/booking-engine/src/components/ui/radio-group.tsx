/**
 * RadioGroup Component
 * Radio button group for sort options
 */

import * as React from "react";
import { Circle } from "lucide-react";
import { cn } from "../../lib/utils";

interface RadioGroupContextValue {
  value: string;
  onValueChange: (value: string) => void;
  name: string;
  disabled?: boolean;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(
  null,
);

export interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      className,
      value: controlledValue,
      onValueChange,
      defaultValue,
      name,
      disabled,
      children,
    },
    ref,
  ) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(
      defaultValue || "",
    );
    const value =
      controlledValue !== undefined ? controlledValue : uncontrolledValue;

    const handleValueChange = React.useCallback(
      (newValue: string) => {
        if (controlledValue === undefined) {
          setUncontrolledValue(newValue);
        }
        onValueChange?.(newValue);
      },
      [controlledValue, onValueChange],
    );

    const contextValue = React.useMemo(
      () => ({
        value,
        onValueChange: handleValueChange,
        name: name || `radio-group-${React.useId()}`,
        disabled,
      }),
      [value, handleValueChange, name, disabled],
    );

    return (
      <RadioGroupContext.Provider value={contextValue}>
        <div ref={ref} className={cn("space-y-2", className)} role="radiogroup">
          {children}
        </div>
      </RadioGroupContext.Provider>
    );
  },
);

RadioGroup.displayName = "RadioGroup";

export interface RadioGroupItemProps {
  value: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value: itemValue, id, disabled }, ref) => {
    const context = React.useContext(RadioGroupContext);
    if (!context)
      throw new Error("RadioGroupItem must be used within RadioGroup");

    const { value, onValueChange, name, disabled: groupDisabled } = context;
    const isChecked = value === itemValue;
    const isDisabled = disabled || groupDisabled;

    return (
      <div className="relative inline-flex items-center gap-2">
        <input
          ref={ref}
          type="radio"
          name={name}
          value={itemValue}
          checked={isChecked}
          disabled={isDisabled}
          onChange={() => !isDisabled && onValueChange(itemValue)}
          className="sr-only"
          id={id}
        />
        <div
          className={cn(
            "h-4 w-4 rounded-full border border-gray-300 transition-all cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            isChecked
              ? "border-[hsl(var(--primary))]"
              : "bg-white hover:border-gray-400",
            isDisabled && "cursor-not-allowed opacity-50",
            className,
          )}
          onClick={() => !isDisabled && onValueChange(itemValue)}
        >
          {isChecked && (
            <Circle className="h-2.5 w-2.5 fill-[hsl(var(--primary))] text-[hsl(var(--primary))]" />
          )}
        </div>
      </div>
    );
  },
);

RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
