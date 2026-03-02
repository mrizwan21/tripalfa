import React, { useState, useRef, useEffect } from "react";
import { ChevronRight } from "lucide-react";

interface AccordionItemProps {
  title: string;
  badge?: string | React.ReactNode;
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  badge,
  children,
  isOpen = false,
  onToggle,
  className = "",
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(
    isOpen ? undefined : 0,
  );

  useEffect(() => {
    if (isOpen) {
      const scrollHeight = contentRef.current?.scrollHeight;
      setHeight(scrollHeight);

      // Auto-scroll to expanded section after a short delay to allow animation to start
      const timer = setTimeout(() => {
        if (contentRef.current?.parentElement) {
          contentRef.current.parentElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
        }
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setHeight(0);
    }
  }, [isOpen]);

  return (
    <div
      className={`border border-[var(--color-border-light)] rounded-lg overflow-hidden mb-2 bg-[var(--color-bg-primary)] ${className} ${isOpen ? "border-b-0 rounded-b-none" : ""}`}
    >
      <button
        type="button"
        className={`w-full flex items-center justify-between p-4 text-left transition-colors duration-200 hover:bg-[var(--color-bg-secondary)] ${isOpen ? "bg-[var(--color-bg-tertiary)]" : "bg-[var(--color-bg-primary)]"}`}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <ChevronRight
            className={`w-5 h-5 text-[var(--color-text-tertiary)] transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
          />
          <span className="text-base font-semibold text-[var(--color-text-primary)]">
            {title}
          </span>
        </div>
        {badge && (
          <div className="text-xs font-medium text-[var(--color-text-tertiary)] bg-[var(--color-bg-tertiary)] px-3 py-1 rounded-full">
            {badge}
          </div>
        )}
      </button>

      <div
        className={`overflow-hidden transition-[max-height] duration-300 ease-out`}
        style={{ maxHeight: isOpen ? `${height ?? 0}px` : 0 }}
        ref={contentRef}
      >
        <div className="p-5 border-t border-[var(--color-border-light)] bg-[var(--color-bg-primary)]">
          {children}
        </div>
      </div>
    </div>
  );
};

interface AccordionProps {
  children: React.ReactNode;
  allowMultiple?: boolean;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  children,
  allowMultiple = false,
  className = "",
}) => {
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]); // Default open first item

  const handleToggle = (index: number) => {
    if (allowMultiple) {
      setOpenIndexes((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index],
      );
    } else {
      setOpenIndexes((prev) => (prev.includes(index) ? [] : [index]));
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return null;

        return React.cloneElement(child as React.ReactElement<any>, {
          isOpen: openIndexes.includes(index),
          onToggle: () => handleToggle(index),
        });
      })}
    </div>
  );
};
