import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-200',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-200',
    suspended: 'bg-destructive/10 text-destructive border-destructive-200',
    inactive: 'bg-muted text-muted-foreground border-border',
  };
  const color = colors[status] || 'bg-muted text-muted-foreground border-border';
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${color}`}
    >
      {status}
    </span>
  );
}
