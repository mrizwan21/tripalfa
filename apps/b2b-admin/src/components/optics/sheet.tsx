import * as React from 'react';
interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const SheetContext = React.createContext<SheetContextValue>({
  open: false,
  onOpenChange: () => {},
});
export interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}
export const Sheet = ({ open: controlledOpen, onOpenChange, children }: SheetProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  return (
    <SheetContext.Provider
      value={{
        open: controlledOpen ?? internalOpen,
        onOpenChange: onOpenChange ?? setInternalOpen,
      }}
    >
      {children}
    </SheetContext.Provider>
  );
};
export const SheetTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ asChild, onClick, children, ...props }, ref) => {
  const { onOpenChange } = React.useContext(SheetContext);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>,
      {
        onClick: (e: React.MouseEvent) => {
          onOpenChange(true);
          (
            children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
          ).props?.onClick?.(e);
        },
      }
    );
  }
  return (
    <button
      ref={ref}
      onClick={e => {
        onOpenChange(true);
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
});
SheetTrigger.displayName = 'SheetTrigger';
export const SheetContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: 'top' | 'bottom' | 'left' | 'right' }
>(({ side = 'right', className = '', children, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(SheetContext);
  if (!open) return null;
  const sideClasses: Record<string, string> = {
    top: 'inset-x-0 top-0 border-b h-auto',
    bottom: 'inset-x-0 bottom-0 border-t h-auto',
    left: 'inset-y-0 left-0 h-full w-3/4 border-r',
    right: 'inset-y-0 right-0 h-full w-3/4 border-l',
  };
  return (
    <div className="fixed inset-0 z-overlay">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div
        ref={ref}
        className={`fixed z-overlay gap-4 bg-background p-6 shadow-lg transition ease-in-out ${sideClasses[side]} ${className}`}
        {...props}
      >
        {children}
      </div>
    </div>
  );
});
SheetContent.displayName = 'SheetContent';
export const SheetHeader = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-2 ${className}`} {...props} />
);
export const SheetFooter = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
    {...props}
  />
);
export const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = '', ...props }, ref) => (
  <h2 ref={ref} className={`text-lg font-semibold ${className}`} {...props} />
));
export const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = '', ...props }, ref) => (
  <p ref={ref} className={`text-sm text-muted-foreground ${className}`} {...props} />
));
