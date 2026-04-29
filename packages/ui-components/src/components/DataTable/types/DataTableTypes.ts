import * as React from "react";

/**
 * Core type definitions for DataTable component
 */
export type DataTableVariant = "b2b-dense" | "b2c-card" | "admin-complex";
export type DataTableLayout = "table" | "cards" | "timeline";
export type DataTableDensity = "compact" | "normal" | "expanded";
export type DataTableInformationDensity = "minimal" | "standard" | "detailed";

export interface ColumnDefinition<T> {
  key: string;
  header: React.ReactNode;
  cell: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: "left" | "center" | "right";
  className?: string;
  editable?: boolean;
  editComponent?: (props: {
    value: any;
    onChange: (value: any) => void;
    item: T;
    index: number;
    column: ColumnDefinition<T>;
  }) => React.ReactNode;
  validate?: (value: any, item: T) => string | null;
}

export interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

export interface BulkAction<T> {
  label: string;
  onClick: (selectedRows: Set<string | number>, data: T[]) => void;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "success";
  disabled?: boolean;
}

interface DataTableFeatures {
  bulkActions?: boolean;
  inlineEditing?: boolean;
  visualSummary?: boolean;
  export?: boolean;
  sorting?: boolean;
  pagination?: boolean;
  rowSelection?: boolean;
  search?: boolean;
  filters?: boolean;
}

export interface DataTableProps<T> {
  // Core data
  data: T[];
  columns: ColumnDefinition<T>[];
  
  // Presentation
  variant?: DataTableVariant;
  layout?: DataTableLayout;
  density?: DataTableDensity;
  informationDensity?: DataTableInformationDensity;
  
  // Features
  features?: DataTableFeatures;
  
  // Sorting
  sortConfig?: SortConfig;
  onSortChange?: (sortConfig: SortConfig | null) => void;
  
  // Selection
  selectedRows?: Set<string | number>;
  onSelectionChange?: (selectedRows: Set<string | number>) => void;
  rowKey?: (item: T, index: number) => string | number;
  
  // Bulk actions
  bulkActions?: BulkAction<T>[];
  
  // Pagination
  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  
  // Inline editing
  onEdit?: (item: T, field: string, value: any, index: number) => Promise<void> | void;
  editMode?: "single" | "batch";
  onBatchEdit?: (updates: Array<{ item: T; field: string; value: any; index: number }>) => Promise<void> | void;
  
  // Loading & empty states
  isLoading?: boolean;
  loadingMessage?: string;
  isEmpty?: boolean;
  emptyState?: React.ReactNode;
  
  // Actions
  actions?: React.ReactNode;
  
  // Search and filters
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: React.ReactNode;
  
  // Customization
  className?: string;
  containerClassName?: string;
  headerClassName?: string;
  rowClassName?: string | ((item: T, index: number) => string);
  cellClassName?: string;
  
  // Events
  onRowClick?: (item: T, index: number) => void;
  
  // Visual summary
  summaryRenderer?: (data: T[]) => React.ReactNode;
}