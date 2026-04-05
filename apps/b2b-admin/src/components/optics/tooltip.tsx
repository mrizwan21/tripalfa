import * as React from 'react';
interface TooltipContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const TooltipContext = React.createContext<TooltipContextValue>({
  open: false,
  onOpenChange: () => {},
});
export interface TooltipProps {
  children?: React.ReactNode;
  content?: React.ReactNode;
  delayDuration?: number;
  side?: 'top' | 'bottom' | 'left' | 'right';
}
export const Tooltip = ({ children, content, delayDuration = 700, side = 'top' }: TooltipProps) => {
  const [open, setOpen] = React.useState(false);
  const timerRef = React.useRef<NodeJS.Timeout>(undefined);
  const show = () => {
    timerRef.current = setTimeout(() => setOpen(true), delayDuration);
  };
  const hide = () => {
    clearTimeout(timerRef.current);
    setOpen(false);
  };
  if (content && !children) {
    return (
      <TooltipContext.Provider value={{ open, onOpenChange: setOpen }}>
        <TooltipContent side={side}>{content}</TooltipContent>
      </TooltipContext.Provider>
    );
  }
  return (
    <TooltipContext.Provider value={{ open, onOpenChange: setOpen }}>
      <div onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
        {children}
        {open && content && <TooltipContent side={side}>{content}</TooltipContent>}
      </div>
    </TooltipContext.Provider>
  );
};
export const TooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onMouseEnter, onMouseLeave, children, ...props }, ref) => {
  const { onOpenChange } = React.useContext(TooltipContext);
  return (
    <button
      ref={ref}
      onMouseEnter={e => {
        onOpenChange(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={e => {
        onOpenChange(false);
        onMouseLeave?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
});
TooltipTrigger.displayName = 'TooltipTrigger';
export const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: 'top' | 'bottom' | 'left' | 'right' }
>(({ side = 'top', className = '', children, ...props }, ref) => {
  const { open } = React.useContext(TooltipContext);
  if (!open) return null;
  return (
    <div
      ref={ref}
      className={`z-tooltip overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
TooltipContent.displayName = 'TooltipContent';
