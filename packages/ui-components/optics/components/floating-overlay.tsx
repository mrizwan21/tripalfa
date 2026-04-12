import React, { useState, useRef, useEffect } from 'react';

export interface FloatingOverlayContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLDivElement | null>;
}

export function createFloatingOverlay<T extends FloatingOverlayContextValue>(
  Context: React.Context<T>
) {
  function Trigger({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) {
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
  }

  function Content({
    className = '',
    side,
    sideOffset = 4,
    align = 'center',
    onOpenAutoFocus,
    children,
    extraClasses = '',
  }: {
    className?: string;
    side?: string;
    sideOffset?: number;
    align?: 'start' | 'center' | 'end';
    onOpenAutoFocus?: (e: Event) => void;
    children: React.ReactNode;
    extraClasses?: string;
  }) {
    const { open, setOpen, triggerRef } = React.useContext(Context);
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
        className={`absolute z-50 ${alignClasses[align]} mt-[${sideOffset}px] ${extraClasses} ${className}`}
        style={{ marginTop: sideOffset }}
      >
        {children}
      </div>
    );
  }

  return { Trigger, Content };
}
