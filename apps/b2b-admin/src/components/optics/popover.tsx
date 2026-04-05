import * as React from 'react';
interface PopoverContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const PopoverContext = React.createContext<PopoverContextValue>({
  open: false,
  onOpenChange: () => {},
});
export interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}
export const Popover = ({ open: controlledOpen, onOpenChange, children }: PopoverProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  return (
    <PopoverContext.Provider
      value={{
        open: controlledOpen ?? internalOpen,
        onOpenChange: onOpenChange ?? setInternalOpen,
      }}
    >
      {children}
    </PopoverContext.Provider>
  );
};
export const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ asChild, onClick, children, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(PopoverContext);
  if (asChild && React.isValidElement(children))
    return React.cloneElement(children as any, { onClick: () => onOpenChange(!open) });
  return (
    <button
      ref={ref}
      onClick={e => {
        onOpenChange(!open);
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
});
PopoverTrigger.displayName = 'PopoverTrigger';
export const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', children, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(PopoverContext);
  const contentRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) onOpenChange(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, onOpenChange]);
  if (!open) return null;
  return (
    <div
      ref={node => {
        (contentRef as any).current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as any).current = node;
      }}
      className={`z-popover w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
PopoverContent.displayName = 'PopoverContent';
