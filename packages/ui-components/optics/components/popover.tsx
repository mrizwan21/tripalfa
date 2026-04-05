import React, { useState, useRef, useEffect } from 'react';

interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  children: React.ReactNode;
}

interface PopoverTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

interface PopoverContentProps {
  className?: string;
  side?: string;
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
  onOpenAutoFocus?: (e: Event) => void;
  children: React.ReactNode;
}

const PopoverContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLDivElement | null>;
}>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
});

export function PopoverRoot({ open: controlledOpen, onOpenChange, modal, children }: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const triggerRef = useRef<HTMLDivElement>(null);

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative">{children}</div>
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({ asChild, children }: PopoverTriggerProps) {
  const { open, setOpen, triggerRef } = React.useContext(PopoverContext);

  const handleClick = () => setOpen(!open);

  if (asChild && React.isValidElement(children)) {
    return (
      <div ref={triggerRef} onClick={handleClick}>
        {children}
      </div>
    );
  }

  return (
    <div ref={triggerRef} onClick={handleClick} className="cursor-pointer">
      {children}
    </div>
  );
}

export function PopoverContent({
  className = '',
  side,
  sideOffset = 4,
  align = 'center',
  onOpenAutoFocus,
  children,
}: PopoverContentProps) {
  const { open, setOpen, triggerRef } = React.useContext(PopoverContext);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, setOpen, triggerRef]);

  if (!open) return null;

  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  return (
    <div
      ref={contentRef}
      className={`absolute z-50 ${alignClasses[align]} mt-[${sideOffset}px] ${className}`}
      style={{ marginTop: sideOffset }}
    >
      {children}
    </div>
  );
}

export function PopoverPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export const Popover = {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Portal: PopoverPortal,
};
