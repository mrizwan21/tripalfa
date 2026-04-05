import * as React from 'react';

export interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
  approved: 'bg-green-100 text-green-800',
  suspended: 'bg-orange-100 text-orange-800',
  expired: 'bg-red-100 text-red-800',
  default: 'bg-gray-100 text-gray-800',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-xs',
  lg: 'px-2.5 py-1 text-sm',
};

export const StatusBadge = ({ status, label, size = 'sm' }: StatusBadgeProps) => {
  const colorClasses = statusColors[status?.toLowerCase()] ?? statusColors.default;
  const sizeClass = sizeClasses[size] ?? sizeClasses.sm;

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${colorClasses} ${sizeClass}`}
    >
      {label ?? status}
    </span>
  );
};
