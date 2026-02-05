// Super Admin Panel - Type Definitions
// Re-exports from shared types + admin-specific types

export * from '../shared-types/types';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
  details?: any;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// Admin Panel Specific Types
// ============================================================================

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  children?: MenuItem[];
  badge?: string | number;
  permissions?: string[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  count?: number;
  disabled?: boolean;
}

export interface StatCard {
  id: string;
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: string;
  trend?: { label: string; value: number }[];
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'donut' | 'area';
  data: unknown[];
  xKey?: string;
  yKey?: string;
  series?: { key: string; name: string; color?: string }[];
}

export interface TableColumn<T = unknown> {
  key: keyof T | string;
  header: string;
  width?: number | string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface FilterOption {
  label: string;
  value: string | number | boolean;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'text' | 'number';
  options?: FilterOption[];
  placeholder?: string;
}

export interface ActionItem {
  id: string;
  label: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardStats {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  activeBookings: number;
  totalRevenue: number;
  pendingPayments: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'booking' | 'payment' | 'user' | 'company' | 'system';
  title: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  bookings: number;
}

export interface TopPerformer {
  id: string;
  name: string;
  type: 'company' | 'agent' | 'supplier';
  metric: string;
  value: number;
  change: number;
}

// ============================================================================
// Form Types
// ============================================================================

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'multiselect' | 'date' | 'datetime' | 'checkbox' | 'radio' | 'file' | 'rich-text';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: { label: string; value: unknown }[];
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: (value: unknown) => string | undefined;
  };
  helpText?: string;
  grid?: { cols?: number; span?: number };
}

// ============================================================================
// Modal/Dialog Types
// ============================================================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface ConfirmDialogProps extends ModalProps {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  type?: 'info' | 'warning' | 'danger';
}

// ============================================================================
// Notification Types
// ============================================================================

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================================
// Theme Types
// ============================================================================

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}
