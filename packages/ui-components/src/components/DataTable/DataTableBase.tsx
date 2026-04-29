import * as React from "react";
import { cn } from "../../lib/utils";
import { 
  DataTableVariant, 
  DataTableLayout, 
  DataTableDensity, 
  DataTableInformationDensity, 
  ColumnDefinition 
} from "./types";

// Define interfaces for SortConfig, BulkAction, DataTableProps if needed for legacy compatibility
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

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDefinition<T>[];
  variant?: DataTableVariant;
  layout?: DataTableLayout;
  density?: DataTableDensity;
  informationDensity?: DataTableInformationDensity;
}

// Legacy DataTableBase component (deprecated)
// This is a placeholder for the legacy component to prevent build errors
export const DataTableBase = <T,>(props: DataTableProps<T>) => {
  return null; // Implementation removed as it is deprecated
};