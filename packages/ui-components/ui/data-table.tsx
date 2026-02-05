'use client';

// Super Admin Panel - Data Table Component
import { useState, useMemo } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@tripalfa/shared-utils';
import { ReactNode } from 'react';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  className?: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, item: T) => ReactNode;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date';
  options?: { label: string; value: string }[];
  placeholder?: string;
}

export interface ActionItem<T = any> {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: (item?: T) => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  danger?: boolean;
}

// ============================================================================
// Types
// ============================================================================

interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: TableColumn<T>[];
  isLoading?: boolean;
  // Pagination
  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  // Selection
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  // Search & Filter
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: FilterConfig[];
  filterValues?: Record<string, unknown>;
  onFilterChange?: (key: string, value: unknown) => void;
  // Actions
  actions?: ActionItem[];
  rowActions?: (row: T) => ActionItem[];
  // Export
  exportable?: boolean;
  onExport?: (format: 'csv' | 'xlsx') => void;
  // Refresh
  onRefresh?: () => void;
  // Row key
  rowKey?: keyof T | ((row: T) => string);
  // Empty state
  emptyMessage?: string;
}

// ============================================================================
// Data Table Component
// ============================================================================

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  isLoading = false,
  page = 1,
  pageSize = 20,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  sortBy,
  sortOrder = 'asc',
  onSort,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  searchable = false,
  searchValue = '',
  onSearchChange,
  filters,
  filterValues = {},
  onFilterChange,
  actions,
  rowActions,
  exportable = false,
  onExport,
  onRefresh,
  rowKey = 'id',
  emptyMessage = 'No data found',
}: DataTableProps<T>) {
  const [showFilters, setShowFilters] = useState(false);

  const getRowKey = (row: T): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row);
    }
    return String(row[rowKey]);
  };

  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  const isAllSelected = data.length > 0 && data.every((row) => selectedIds.includes(getRowKey(row)));
  const isSomeSelected = data.some((row) => selectedIds.includes(getRowKey(row)));

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map(getRowKey));
    }
  };

  const handleSelectRow = (row: T) => {
    if (!onSelectionChange) return;
    const key = getRowKey(row);
    if (selectedIds.includes(key)) {
      onSelectionChange(selectedIds.filter((id) => id !== key));
    } else {
      onSelectionChange([...selectedIds, key]);
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ChevronsUpDown className="h-4 w-4 text-secondary-400" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-primary-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-primary-600" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="input h-9 w-64 pl-9"
              />
            </div>
          )}

          {filters && filters.length > 0 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'btn-outline h-9',
                showFilters && 'bg-secondary-100 dark:bg-secondary-800'
              )}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && actions && (
            <div className="flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-1.5 dark:bg-primary-900/20">
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                {selectedIds.length} selected
              </span>
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={cn(
                    'text-sm font-medium',
                    action.danger
                      ? 'text-error-600 hover:text-error-700'
                      : 'text-primary-600 hover:text-primary-700'
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {exportable && (
            <div className="relative group">
              <button className="btn-outline h-9">
                <Download className="mr-2 h-4 w-4" />
                Export
              </button>
              <div className="absolute right-0 top-full z-10 mt-1 hidden w-32 rounded-lg border bg-white p-1 shadow-lg group-hover:block dark:border-secondary-700 dark:bg-secondary-800">
                <button
                  onClick={() => onExport?.('csv')}
                  className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-secondary-100 dark:hover:bg-secondary-700"
                >
                  CSV
                </button>
                <button
                  onClick={() => onExport?.('xlsx')}
                  className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-secondary-100 dark:hover:bg-secondary-700"
                >
                  Excel
                </button>
              </div>
            </div>
          )}

          {onRefresh && (
            <button onClick={onRefresh} className="btn-outline h-9 px-2">
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && filters && (
        <div className="rounded-lg border bg-white p-4 dark:border-secondary-700 dark:bg-secondary-800">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="label mb-1.5 block">{filter.label}</label>
                {filter.type === 'select' && (
                  <select
                    value={String(filterValues[filter.key] || '')}
                    onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                    className="select h-9"
                  >
                    <option value="">{filter.placeholder || 'All'}</option>
                    {filter.options?.map((opt) => (
                      <option key={String(opt.value)} value={String(opt.value)}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
                {filter.type === 'text' && (
                  <input
                    type="text"
                    value={String(filterValues[filter.key] || '')}
                    onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                    placeholder={filter.placeholder}
                    className="input h-9"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {selectable && (
                <th className="w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !isAllSelected && isSomeSelected;
                    }}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-secondary-300"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  style={{ width: col.width }}
                  className={cn(col.sortable && 'cursor-pointer select-none')}
                  onClick={() => col.sortable && onSort?.(String(col.key))}
                >
                  <div className="flex items-center gap-2">
                    {col.header}
                    {col.sortable && renderSortIcon(String(col.key))}
                  </div>
                </th>
              ))}
              {rowActions && <th className="w-12" />}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                  className="py-8 text-center"
                >
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin text-secondary-400" />
                    <span className="text-secondary-500">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                  className="py-8 text-center text-secondary-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className={cn(
                    selectedIds.includes(getRowKey(row)) && 'bg-primary-50/50 dark:bg-primary-900/10'
                  )}
                >
                  {selectable && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(getRowKey(row))}
                        onChange={() => handleSelectRow(row)}
                        className="h-4 w-4 rounded border-secondary-300"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={String(col.key)}>
                      {col.render
                        ? col.render(row[col.key as keyof T], row)
                        : String(row[col.key as keyof T] ?? '-')}
                    </td>
                  ))}
                  {rowActions && (
                    <td>
                      <RowActionsMenu actions={rowActions(row)} />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-secondary-600">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="select h-8 w-20"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>
              of {totalItems} results ({startItem}-{endItem})
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="btn-outline h-8 px-2 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange?.(pageNum)}
                  className={cn(
                    'h-8 min-w-[2rem] rounded-md px-3 text-sm font-medium',
                    page === pageNum
                      ? 'bg-primary-600 text-white'
                      : 'text-secondary-600 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="btn-outline h-8 px-2 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Row Actions Menu
// ============================================================================

function RowActionsMenu({ actions }: { actions: ActionItem[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (actions.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg p-1 hover:bg-secondary-100 dark:hover:bg-secondary-700"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border bg-white py-1 shadow-lg dark:border-secondary-700 dark:bg-secondary-800">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                disabled={action.disabled}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm',
                  action.danger
                    ? 'text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20'
                    : 'text-secondary-700 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-700',
                  action.disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
