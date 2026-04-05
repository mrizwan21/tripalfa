import * as React from 'react';
interface DrawerContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const DrawerContext = React.createContext<DrawerContextValue>({
  open: false,
  onOpenChange: () => {},
});
export interface DrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}
export const Drawer = ({ open: controlledOpen, onOpenChange, children }: DrawerProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  return (
    <DrawerContext.Provider
      value={{
        open: controlledOpen ?? internalOpen,
        onOpenChange: onOpenChange ?? setInternalOpen,
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
};
export const DrawerTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ asChild, onClick, children, ...props }, ref) => {
  const { onOpenChange } = React.useContext(DrawerContext);
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
DrawerTrigger.displayName = 'DrawerTrigger';
export const DrawerContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: 'left' | 'right' | 'top' | 'bottom' }
>(({ side = 'right', className = '', children, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(DrawerContext);
  if (!open) return null;
  const sideClasses = {
    right: 'right-0 top-0 h-full w-80',
    left: 'left-0 top-0 h-full w-80',
    top: 'top-0 left-0 w-full h-80',
    bottom: 'bottom-0 left-0 w-full h-80',
  };
  return (
    <div className="fixed inset-0 z-overlay">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div
        ref={ref}
        className={`fixed z-overlay bg-background border shadow-lg ${sideClasses[side]} ${className}`}
        {...props}
      >
        {children}
      </div>
    </div>
  );
});
DrawerContent.displayName = 'DrawerContent';
export const DrawerHeader = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`grid gap-1.5 p-4 ${className}`} {...props} />
);
export const DrawerFooter = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`mt-auto flex flex-col gap-2 p-4 ${className}`} {...props} />
);
export const DrawerTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = '', ...props }, ref) => (
  <h2 ref={ref} className={`text-lg font-semibold ${className}`} {...props} />
));
export const DrawerDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = '', ...props }, ref) => (
  <p ref={ref} className={`text-sm text-muted-foreground ${className}`} {...props} />
));
export const DrawerClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, children, ...props }, ref) => {
  const { onOpenChange } = React.useContext(DrawerContext);
  return (
    <button
      ref={ref}
      onClick={e => {
        onOpenChange(false);
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
});
