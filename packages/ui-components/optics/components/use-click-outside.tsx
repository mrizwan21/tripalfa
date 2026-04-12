import React, { useEffect, useRef } from 'react';

/**
 * Shared context interface for floating components (Popover, DropdownMenu, etc.)
 */
export interface FloatingContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Hook that handles click-outside and Escape key behavior for floating components.
 * Extracted from Popover and DropdownMenu to eliminate code duplication.
 */
export function useClickOutside(
  open: boolean,
  setOpen: (open: boolean) => void,
  triggerRef: React.RefObject<HTMLDivElement | null>
) {
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

  return contentRef;
}

/**
 * Shared align class mapping for floating components.
 */
export const ALIGN_CLASSES: Record<string, string> = {
  start: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  end: 'right-0',
};

/**
 * Creates a floating component context with the standard open/close pattern.
 */
export function createFloatingContext(
  initialOpen = false
): FloatingContextValue {
  const [open, setOpen] = React.useState(initialOpen);
  const triggerRef = useRef<HTMLDivElement>(null);
  return { open, setOpen, triggerRef };
}

/**
 * Creates a floating Root component factory.
 * Eliminates duplication between Popover.Root and DropdownMenu.
 */
export function createFloatingRoot<TContext extends FloatingContextValue>(
  Context: React.Context<TContext>
) {
  return function FloatingRoot({
    open: controlledOpen,
    onOpenChange,
    children,
  }: {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
  }) {
    const [internalOpen, setInternalOpen] = React.useState(false);
    const open = controlledOpen ?? internalOpen;
    const setOpen = onOpenChange ?? setInternalOpen;
    const triggerRef = useRef<HTMLDivElement>(null);

    return (
      <Context.Provider value={{ open, setOpen, triggerRef } as TContext}>
        <div className="relative">{children}</div>
      </Context.Provider>
    );
  };
}

/**
 * Creates a floating Trigger component factory.
 * Eliminates duplication between Popover.Trigger and DropdownMenuTrigger.
 */
export function createFloatingTrigger<TContext extends FloatingContextValue>(
  Context: React.Context<TContext>
) {
  return function FloatingTrigger({
    asChild,
    children,
  }: {
    asChild?: boolean;
    children: React.ReactNode;
  }) {
    const { open, setOpen, triggerRef } = React.useContext(Context);

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
  };
}
