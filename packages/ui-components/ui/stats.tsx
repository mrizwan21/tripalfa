'use client';

// Admin Panel - Stat Cards & Dashboard Components
import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn, formatCurrency, formatNumber, formatPercent } from '@tripalfa/shared-utils';

// ============================================================================
// Stat Card Component
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    label?: string;
  };
  icon?: ReactNode;
  iconBg?: string;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  change,
  icon,
  iconBg = 'bg-primary-100 dark:bg-primary-900/30',
  loading = false,
}: StatCardProps): React.ReactElement {
  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-secondary-200 dark:bg-secondary-700" />
            <div className="h-8 w-32 rounded bg-secondary-200 dark:bg-secondary-700" />
            <div className="h-3 w-20 rounded bg-secondary-200 dark:bg-secondary-700" />
          </div>
          <div className="h-12 w-12 rounded-lg bg-secondary-200 dark:bg-secondary-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">
            {title}
          </p>
          <p className="mt-1 text-2xl font-bold text-secondary-900 dark:text-white">
            {value}
          </p>
          {(change || subtitle) && (
            <div className="mt-2 flex items-center gap-2">
              {change && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-sm font-medium',
                    change.type === 'increase' && 'text-success-600',
                    change.type === 'decrease' && 'text-error-600',
                    change.type === 'neutral' && 'text-secondary-500'
                  )}
                >
                  {change.type === 'increase' && <TrendingUp className="h-4 w-4" />}
                  {change.type === 'decrease' && <TrendingDown className="h-4 w-4" />}
                  {change.type === 'neutral' && <Minus className="h-4 w-4" />}
                  {formatPercent(Math.abs(change.value))}
                </span>
              )}
              {(subtitle || change?.label) && (
                <span className="text-sm text-secondary-500">
                  {subtitle || change?.label}
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('rounded-lg p-3', iconBg)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Stats Grid
// ============================================================================

interface StatsGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5;
}

export function StatsGrid({ children, columns = 4 }: StatsGridProps): React.ReactElement {
  return (
    <div
      className={cn(
        'grid gap-4',
        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        columns === 5 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Mini Stat Card (Compact)
// ============================================================================

interface MiniStatProps {
  label: string;
  value: string | number;
  color?: 'default' | 'success' | 'warning' | 'error';
}

export function MiniStat({ label, value, color = 'default' }: MiniStatProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-secondary-500">{label}</span>
      <span
        className={cn(
          'text-sm font-semibold',
          color === 'default' && 'text-secondary-900 dark:text-white',
          color === 'success' && 'text-success-600',
          color === 'warning' && 'text-warning-600',
          color === 'error' && 'text-error-600'
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ============================================================================
// Progress Card
// ============================================================================

interface ProgressCardProps {
  title: string;
  current: number;
  total: number;
  unit?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

export function ProgressCard({
  title,
  current,
  total,
  unit = '',
  color = 'primary',
}: ProgressCardProps): React.ReactElement {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-secondary-500">{title}</span>
        <span className="text-sm font-semibold text-secondary-900 dark:text-white">
          {formatNumber(current)}{unit} / {formatNumber(total)}{unit}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary-100 dark:bg-secondary-700">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            color === 'primary' && 'bg-primary-600',
            color === 'success' && 'bg-success-600',
            color === 'warning' && 'bg-warning-500',
            color === 'error' && 'bg-error-600'
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-secondary-500">
        {formatPercent(percentage)} complete
      </p>
    </div>
  );
}

// ============================================================================
// Activity Item
// ============================================================================

interface ActivityItemProps {
  icon?: ReactNode;
  iconBg?: string;
  title: string;
  description?: string;
  timestamp: string;
  action?: ReactNode;
}

export function ActivityItem({
  icon,
  iconBg = 'bg-secondary-100 dark:bg-secondary-700',
  title,
  description,
  timestamp,
  action,
}: ActivityItemProps): React.ReactElement {
  return (
    <div className="flex gap-4">
      {icon && (
        <div className={cn('flex-shrink-0 rounded-full p-2', iconBg)}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-secondary-900 dark:text-white">
          {title}
        </p>
        {description && (
          <p className="mt-0.5 text-sm text-secondary-500 truncate">
            {description}
          </p>
        )}
        <p className="mt-1 text-xs text-secondary-400">{timestamp}</p>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ============================================================================
// Activity Feed
// ============================================================================

interface ActivityFeedProps {
  children: ReactNode;
  title?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

export function ActivityFeed({
  children,
  title = 'Recent Activity',
  showViewAll = false,
  onViewAll,
}: ActivityFeedProps): React.ReactElement {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
          {title}
        </h3>
        {showViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View all
          </button>
        )}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && (
        <div className="mb-4 rounded-full bg-secondary-100 p-4 dark:bg-secondary-800">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-secondary-500">{description}</p>
      )}
      {action && (
        <button onClick={action.onClick} className="btn-primary mt-4">
          {action.label}
        </button>
      )}
    </div>
  );
}
