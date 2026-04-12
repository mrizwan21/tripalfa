import React from 'react';
import {
  useClickOutside,
  ALIGN_CLASSES,
  type FloatingContextValue,
  createFloatingRoot,
  createFloatingTrigger,
} from './use-click-outside';

const DropdownMenuContext = React.createContext<FloatingContextValue>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
});

// Shared Root and Trigger from factory — eliminates duplication with Popover
const DropdownMenuRoot = createFloatingRoot(DropdownMenuContext);
const DropdownMenuTrigger = createFloatingTrigger(DropdownMenuContext);

export interface DropdownMenuProps {
  children: React.ReactNode;
}

/**
 * DropdownMenu is an alias for the Root component (compound component pattern)
 */
export const DropdownMenu = DropdownMenuRoot as typeof DropdownMenuRoot & {
  Root: typeof DropdownMenuRoot;
  Trigger: typeof DropdownMenuTrigger;
  Content: typeof DropdownMenuContent;
  Item: typeof DropdownMenuItem;
  Separator: typeof DropdownMenuSeparator;
  Label: typeof DropdownMenuLabel;
};

export interface DropdownMenuContentProps {
  className?: string;
  align?: 'start' | 'center' | 'end';
  side?: string;
  sideOffset?: number;
  children: React.ReactNode;
}

export function DropdownMenuContent({
  className = '',
  align = 'start',
  side,
  sideOffset,
  children,
}: DropdownMenuContentProps) {
  const { open, setOpen, triggerRef } = React.useContext(DropdownMenuContext);
  const contentRef = useClickOutside(open, setOpen, triggerRef);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={`absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md ${ALIGN_CLASSES[align]} ${className}`}
    >
      {children}
    </div>
  );
}

export interface DropdownMenuItemProps {
  className?: string;
  onClick?: () => void;
  onSelect?: () => void;
  children: React.ReactNode;
}

export function DropdownMenuItem({
  className = '',
  onClick,
  onSelect,
  children,
}: DropdownMenuItemProps) {
  const { setOpen } = React.useContext(DropdownMenuContext);

  const handleClick = () => {
    onClick?.();
    onSelect?.();
    setOpen(false);
  };

  return (
    <div
      onClick={handleClick}
      className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${className}`}
    >
      {children}
    </div>
  );
}

export interface DropdownMenuSeparatorProps {
  className?: string;
}

export function DropdownMenuSeparator({ className = '' }: DropdownMenuSeparatorProps) {
  return <div className={`-mx-1 my-1 h-px bg-muted ${className}`} />;
}

export interface DropdownMenuLabelProps {
  className?: string;
  children: React.ReactNode;
}

export function DropdownMenuLabel({ className = '', children }: DropdownMenuLabelProps) {
  return <div className={`px-2 py-1.5 text-sm font-semibold ${className}`}>{children}</div>;
}

// Compound component pattern - attach subcomponents to main component
DropdownMenu.Root = DropdownMenuRoot;
DropdownMenu.Trigger = DropdownMenuTrigger;
DropdownMenu.Content = DropdownMenuContent;
DropdownMenu.Item = DropdownMenuItem;
DropdownMenu.Separator = DropdownMenuSeparator;
DropdownMenu.Label = DropdownMenuLabel;