import React from 'react';
import { cn } from '../../index';

export function DropdownTrigger({ 
  label, 
  isOpen, 
  onClick, 
  icon, 
  displayText, 
  trailingIcon, 
  className 
}: { 
  label: string, 
  isOpen: boolean, 
  onClick: () => void, 
  icon?: React.ReactNode, 
  displayText: React.ReactNode, 
  trailingIcon?: React.ReactNode,
  className?: string 
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-[10px] font-bold text-black/30 uppercase tracking-widest ml-1">{label}</label>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "w-full flex items-center gap-4 px-5 py-4 bg-white border-2 rounded-xl transition-all text-left group",
          isOpen ? "border-apple-blue shadow-sm" : "border-black/5 hover:border-navy/10"
        )}
      >
        {icon}
        <div className="flex-1 min-w-0">
          {displayText}
        </div>
        {trailingIcon}
      </button>
    </div>
  );
}

export function DropdownPopup({ 
  isOpen, 
  children, 
  className 
}: { 
  isOpen: boolean, 
  children: React.ReactNode, 
  className?: string 
}) {
  if (!isOpen) return null;
  return (
    <div className={cn(
      "absolute z-50 top-[calc(100%+8px)] bg-white rounded-2xl border border-black/5 shadow-apple p-6 animate-in slide-in-from-top-2 duration-200",
      className
    )}>
      {children}
    </div>
  );
}

export function DropdownDoneButton({ 
  onClick, 
  label = "Apply Selection" 
}: { 
  onClick: () => void, 
  label?: string 
}) {
  return (
    <div className="mt-6 pt-6 border-t border-black/5">
      <button
        type="button"
        onClick={onClick}
        className="w-full py-3.5 bg-pure-black text-apple-blue rounded-xl text-[11px] font-bold tracking-tight hover:bg-black transition-all active:scale-95 shadow-sm"
      >
        {label}
      </button>
    </div>
  );
}
