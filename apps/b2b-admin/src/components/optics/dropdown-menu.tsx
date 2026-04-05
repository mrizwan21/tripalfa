import * as React from 'react';
interface DropdownMenuContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const DropdownMenuContext = React.createContext<DropdownMenuContextValue>({
  open: false,
  onOpenChange: () => {},
});
export interface DropdownMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}
export const DropdownMenu = ({
  open: controlledOpen,
  onOpenChange,
  children,
}: DropdownMenuProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  return (
    <DropdownMenuContext.Provider
      value={{
        open: controlledOpen ?? internalOpen,
        onOpenChange: onOpenChange ?? setInternalOpen,
      }}
    >
      <div className="relative">{children}</div>
    </DropdownMenuContext.Provider>
  );
};
export const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ asChild, onClick, children, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(DropdownMenuContext);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      onClick: (e: React.MouseEvent) => {
        onOpenChange(!open);
        (
          children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
        ).props?.onClick?.(e);
      },
      'aria-expanded': open,
    });
  }
  return (
    <button
      ref={ref}
      onClick={e => {
        onOpenChange(!open);
        onClick?.(e);
      }}
      aria-expanded={open}
      {...props}
    >
      {children}
    </button>
  );
});
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';
export const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'center' | 'end' }
>(({ align = 'start', className = '', children, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(DropdownMenuContext);
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
  const alignStyles: Record<string, React.CSSProperties> = {
    start: { left: 0 },
    center: { left: '50%', transform: 'translateX(-50%)' },
    end: { right: 0 },
  };
  return (
    <div
      ref={node => {
        (contentRef as any).current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as any).current = node;
      }}
      className={`absolute top-full mt-1 z-dropdown min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md ${className}`}
      style={alignStyles[align]}
      role="menu"
      {...props}
    >
      {children}
    </div>
  );
});
DropdownMenuContent.displayName = 'DropdownMenuContent';
export const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ asChild, onClick, children, className = '', ...props }, ref) => {
  const { onOpenChange } = React.useContext(DropdownMenuContext);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      onClick: (e: React.MouseEvent) => {
        onOpenChange(false);
        (
          children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
        ).props?.onClick?.(e);
      },
      role: 'menuitem',
    });
  }
  return (
    <button
      ref={ref}
      role="menuitem"
      onClick={e => {
        onOpenChange(false);
        onClick?.(e);
      }}
      className={`relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});
DropdownMenuItem.displayName = 'DropdownMenuItem';
export const DropdownMenuLabel = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`px-2 py-1.5 text-sm font-semibold ${className}`} {...props} />
);
export const DropdownMenuSeparator = () => <div className="-mx-1 my-1 h-px bg-muted" />;
export const DropdownMenuGroup = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props}>{children}</div>
);
