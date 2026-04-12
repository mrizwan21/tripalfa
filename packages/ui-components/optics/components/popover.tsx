import React from 'react';
import {
  useClickOutside,
  ALIGN_CLASSES,
  type FloatingContextValue,
  createFloatingRoot,
  createFloatingTrigger,
} from './use-click-outside';

interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
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

const PopoverContext = React.createContext<FloatingContextValue>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
});

// Shared Root and Trigger from factory — eliminates duplication with DropdownMenu
export const PopoverRoot = createFloatingRoot(PopoverContext);
export const PopoverTrigger = createFloatingTrigger(PopoverContext);

export function PopoverContent({
  className = '',
  side,
  sideOffset = 4,
  align = 'center',
  onOpenAutoFocus,
  children,
}: PopoverContentProps) {
  const { open, setOpen, triggerRef } = React.useContext(PopoverContext);
  const contentRef = useClickOutside(open, setOpen, triggerRef);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={`absolute z-50 ${ALIGN_CLASSES[align]} mt-[${sideOffset}px] ${className}`}
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