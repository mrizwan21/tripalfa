/**
 * Optics Components — shadcn/ui philosophy.
 * All components are owned by the project and can be modified freely.
 * Import from: @/components/optics
 */

// Button
export { Button, buttonVariants } from '@tripalfa/ui-components';
// Note: ButtonProps and VariantProps are not directly exported from ui-components
// Import ButtonProps from './components/Button' if needed

// Card
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '@tripalfa/ui-components';

// Input
export { Input } from '@tripalfa/ui-components';

// Badge
export { Badge, badgeVariants } from '@tripalfa/ui-components';

// Label - exported from ui-components via dedicated export
// export { Label } from '@tripalfa/ui-components'; // Uncomment when Label is exported from main index

// DataTable
export { DataTable } from '@tripalfa/ui-components';
export type {
  DataTableProps,
  DataTableVariant,
  DataTableLayout,
  DataTableDensity,
  ColumnDefinition,
} from '@tripalfa/ui-components';

// Form components
export { FormInput, FormField } from '@tripalfa/ui-components';
export type { FormInputProps, FormFieldProps } from '@tripalfa/ui-components';

// InteractiveModal
export { InteractiveModal, useInteractiveModal } from '@tripalfa/ui-components';
export type { InteractiveModalProps } from '@tripalfa/ui-components';

// Other available components
export { WorkflowNavigator } from '@tripalfa/ui-components';
export type { WorkflowNavigatorProps } from '@tripalfa/ui-components';

export { Pagination } from '@tripalfa/ui-components';
export type { PaginationProps } from '@tripalfa/ui-components';

export { Checkbox } from '@tripalfa/ui-components';
export type { CheckboxProps } from '@tripalfa/ui-components';

export { Accordion } from '@tripalfa/ui-components';
export type { AccordionProps } from '@tripalfa/ui-components';

export { RadioGroup } from '@tripalfa/ui-components';
export type { RadioGroupProps } from '@tripalfa/ui-components';

export { TabNavigator } from '@tripalfa/ui-components';
export type { TabNavigatorProps } from '@tripalfa/ui-components';

export { StatusAlert } from '@tripalfa/ui-components';
export type { StatusAlertProps } from '@tripalfa/ui-components';

export { PageHeader } from '@tripalfa/ui-components';
export type { PageHeaderProps } from '@tripalfa/ui-components';

export { BookingCard } from '@tripalfa/ui-components';
export type { BookingCardProps } from '@tripalfa/ui-components';

export { AdminLayout } from '@tripalfa/ui-components';
export type { AdminLayoutProps } from '@tripalfa/ui-components';

export { HierarchyTree } from '@tripalfa/ui-components';
export type { HierarchyTreeProps } from '@tripalfa/ui-components';

export { RevenueRuleCard, RevenueRuleForm } from '@tripalfa/ui-components';
export type { RevenueRuleCardProps, RevenueRuleFormProps } from '@tripalfa/ui-components';

export { ToggleSwitcher } from '@tripalfa/ui-components';
export type { ToggleSwitcherProps } from '@tripalfa/ui-components';

// Utilities
export { cn } from '@tripalfa/ui-components';
export { formatCurrency } from '@tripalfa/ui-components';

// Contexts
export { TenantProvider, useTenant } from '@tripalfa/ui-components';
export { PermissionProvider, usePermission } from '@tripalfa/ui-components';
export { ThemeProvider, useTheme } from '@tripalfa/ui-components';