import React from 'react';
import { Filter, Calendar as CalendarIcon, User as UserIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HistoryFiltersProps {
    onFilterChange: (filters: any) => void;
    className?: string;
}

export const HistoryFilters: React.FC<HistoryFiltersProps> = ({ onFilterChange, className }) => {
    return (
        <div className={cn("flex flex-wrap gap-3 items-center p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-light)]", className)}>
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] mr-2">
                <Filter className="w-4 h-4" />
                Filters:
            </div>

            <select
                className="h-9 px-3 rounded-md border border-[var(--color-border-light)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                onChange={(e) => onFilterChange({ type: e.target.value })}
            >
                <option value="all">All Event Types</option>
                <option value="payment">Payments</option>
                <option value="modification">Modifications</option>
                <option value="system">System</option>
                <option value="alert">Alerts</option>
                <option value="login">Login Events</option>
            </select>

            <div className="relative">
                <CalendarIcon className="absolute left-2.5 top-2.5 w-4 h-4 text-[var(--color-text-tertiary)]" />
                <select
                    className="h-9 pl-9 pr-3 rounded-md border border-[var(--color-border-light)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] appearance-none"
                    onChange={(e) => onFilterChange({ dateRange: e.target.value })}
                >
                    <option value="all">Any Date</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                </select>
            </div>

            <div className="relative">
                <UserIcon className="absolute left-2.5 top-2.5 w-4 h-4 text-[var(--color-text-tertiary)]" />
                <input
                    type="text"
                    placeholder="Filter by User..."
                    className="h-9 pl-9 pr-3 rounded-md border border-[var(--color-border-light)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] w-32 focus:w-48 transition-all"
                    onChange={(e) => onFilterChange({ user: e.target.value })}
                />
            </div>
        </div>
    );
};
