import * as React from "react";
import { cn } from "../lib/utils";
import { ChevronRight, Home, Settings, Users, Palette, Server, Globe, Shield, Database, BarChart, CreditCard, FileText, Bell, HelpCircle, Mail, Cpu } from "lucide-react";

export type WorkflowNavigatorVariant = "super-admin" | "sub-agency" | "b2b" | "b2c";
export type WorkflowNavigatorDensity = "compact" | "normal" | "expanded";
export type WorkflowNavigatorLayout = "vertical" | "horizontal" | "sidebar";

export interface WorkflowNavigatorItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  isActive?: boolean;
  isDisabled?: boolean;
  badge?: string | number;
  children?: WorkflowNavigatorItem[];
  onClick?: (item: WorkflowNavigatorItem) => void;
  permission?: string; // Required permission to show this item
}

export interface WorkflowNavigatorProps {
  // Core configuration
  variant?: WorkflowNavigatorVariant;
  density?: WorkflowNavigatorDensity;
  layout?: WorkflowNavigatorLayout;
  
  // Data
  items: WorkflowNavigatorItem[];
  activeItemId?: string;
  
  // Context
  context?: {
    tenantId?: string;
    userId?: string;
    userRole?: string;
    permissions?: string[];
  };
  
  // Callbacks
  onItemClick?: (item: WorkflowNavigatorItem) => void;
  onNavigate?: (path: string) => void;
  
  // Customization
  className?: string;
  itemClassName?: string;
  activeItemClassName?: string;
  iconClassName?: string;
  badgeClassName?: string;
  
  // State
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  showIcons?: boolean;
  showBadges?: boolean;
}

const defaultIcons: Record<string, React.ReactNode> = {
  dashboard: <Home className="h-4 w-4" />,
  tenants: <Users className="h-4 w-4" />,
  themes: <Palette className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  gateway: <Globe className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  database: <Database className="h-4 w-4" />,
  analytics: <BarChart className="h-4 w-4" />,
  payments: <CreditCard className="h-4 w-4" />,
  documents: <FileText className="h-4 w-4" />,
  notifications: <Bell className="h-4 w-4" />,
  help: <HelpCircle className="h-4 w-4" />,
  system: <Server className="h-4 w-4" />,
  mail: <Mail className="h-4 w-4" />,
  cpu: <Cpu className="h-4 w-4" />,
};

const variantConfigs = {
  "super-admin": {
    bgColor: "bg-near-black",
    textColor: "text-white",
    activeBgColor: "bg-apple-blue",
    hoverBgColor: "hover:bg-near-black",
    borderColor: "border-near-black",
  },
  "sub-agency": {
    bgColor: "bg-white",
    textColor: "text-near-black",
    activeBgColor: "bg-apple-blue",
    hoverBgColor: "hover:bg-near-black",
    borderColor: "border-near-black",
  },
  "b2b": {
    bgColor: "bg-near-black",
    textColor: "text-white",
    activeBgColor: "bg-apple-blue",
    hoverBgColor: "hover:bg-dark-surface-1",
    borderColor: "border-white/10",
  },
  "b2c": {
    bgColor: "bg-white",
    textColor: "text-near-black",
    activeBgColor: "bg-apple-blue",
    hoverBgColor: "hover:bg-near-black",
    borderColor: "border-near-black",
  },
};

const densityConfigs = {
  compact: {
    itemPadding: "px-3 py-2",
    iconSize: "h-3 w-3",
    textSize: "text-xs",
    gap: "gap-2",
  },
  normal: {
    itemPadding: "px-4 py-3",
    iconSize: "h-4 w-4",
    textSize: "text-sm",
    gap: "gap-3",
  },
  expanded: {
    itemPadding: "px-5 py-4",
    iconSize: "h-5 w-5",
    textSize: "text-base",
    gap: "gap-4",
  },
};

const layoutConfigs = {
  vertical: {
    container: "flex flex-col",
    item: "w-full",
    children: "ml-6 mt-1",
  },
  horizontal: {
    container: "flex flex-row flex-wrap",
    item: "flex-shrink-0",
    children: "ml-0 mt-2",
  },
  sidebar: {
    container: "flex flex-col h-full",
    item: "w-full",
    children: "ml-8",
  },
};

export const WorkflowNavigator = React.forwardRef<HTMLDivElement, WorkflowNavigatorProps>(
  (
    {
      variant = "super-admin",
      density = "normal",
      layout = "vertical",
      items,
      activeItemId,
      context = {},
      onItemClick,
      onNavigate,
      className,
      itemClassName,
      activeItemClassName,
      iconClassName,
      badgeClassName,
      collapsible = false,
      defaultCollapsed = false,
      showIcons = true,
      showBadges = true,
    },
    ref
  ) => {
    const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
    const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

    const config = variantConfigs[variant];
    const densityConfig = densityConfigs[density];
    const layoutConfig = layoutConfigs[layout];

    const handleItemClick = (item: WorkflowNavigatorItem, event: React.MouseEvent) => {
      event.stopPropagation();
      
      if (item.children && collapsible) {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(item.id)) {
          newExpanded.delete(item.id);
        } else {
          newExpanded.add(item.id);
        }
        setExpandedItems(newExpanded);
      }
      
      if (item.onClick) {
        item.onClick(item);
      }
      
      if (onItemClick) {
        onItemClick(item);
      }
      
      if (item.path && onNavigate) {
        onNavigate(item.path);
      }
    };

    const hasPermission = (item: WorkflowNavigatorItem): boolean => {
      if (!item.permission) return true;
      if (!context.permissions) return true;
      return context.permissions.includes(item.permission);
    };

    const renderItem = (item: WorkflowNavigatorItem, level = 0) => {
      if (!hasPermission(item)) return null;
      
      const isActive = activeItemId === item.id || item.isActive;
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedItems.has(item.id);
      
      const icon = item.icon || (item.id in defaultIcons ? defaultIcons[item.id] : null);
      
      const itemClasses = cn(
        "flex items-center transition-colors cursor-pointer rounded-md",
        densityConfig.itemPadding,
        densityConfig.gap,
        config.textColor,
        isActive 
          ? cn(config.activeBgColor, "font-semibold", activeItemClassName)
          : cn(config.hoverBgColor, "hover:font-medium"),
        item.isDisabled && "opacity-50 cursor-not-allowed",
        layoutConfig.item,
        itemClassName
      );
      
      const iconClasses = cn(
        densityConfig.iconSize,
        "flex-shrink-0",
        iconClassName
      );
      
      const textClasses = cn(
        densityConfig.textSize,
        "font-medium truncate"
      );
      
      const badgeClasses = cn(
        "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full",
        isActive ? "bg-white/20 text-white" : "bg-near-black text-near-black",
        badgeClassName
      );

      return (
        <React.Fragment key={item.id}>
          <div
            className={itemClasses}
            onClick={(e) => !item.isDisabled && handleItemClick(item, e)}
            style={level > 0 ? { marginLeft: `${level * 1}rem` } : undefined}
          >
            {showIcons && icon && <span className={iconClasses}>{icon}</span>}
            {(!collapsed || layout !== "sidebar") && (
              <span className={textClasses}>{item.label}</span>
            )}
            {showBadges && item.badge && (
              <span className={badgeClasses}>{item.badge}</span>
            )}
            {hasChildren && collapsible && (
              <ChevronRight className={cn(
                densityConfig.iconSize,
                "ml-auto transition-transform",
                isExpanded && "rotate-90"
              )} />
            )}
          </div>
          
          {hasChildren && item.children && (isExpanded || !collapsible) && (
            <div className={layoutConfig.children}>
              {item.children.map(child => renderItem(child, level + 1))}
            </div>
          )}
        </React.Fragment>
      );
    };

    const containerClasses = cn(
      layoutConfig.container,
      config.bgColor,
      config.borderColor,
      layout === "sidebar" && "border-r",
      className
    );

    return (
      <div ref={ref} className={containerClasses}>
        {items.map(item => renderItem(item))}
      </div>
    );
  }
);

WorkflowNavigator.displayName = "WorkflowNavigator";

// Helper function to generate navigation items based on context
export function generateNavigationItems(
  variant: WorkflowNavigatorVariant,
  context?: { permissions?: string[] }
): WorkflowNavigatorItem[] {
  const baseItems: WorkflowNavigatorItem[] = [];
  
  if (variant === "super-admin") {
    baseItems.push(
      { id: "dashboard", label: "System Overview", icon: defaultIcons.dashboard, path: "/dashboard" },
      { id: "tenants", label: "Tenant Management", icon: defaultIcons.tenants, path: "/tenants", badge: "12" },
      { id: "themes", label: "White-Label Themes", icon: defaultIcons.themes, path: "/themes" },
      { id: "settings", label: "Global Settings", icon: defaultIcons.settings, path: "/settings" },
      { id: "gateway", label: "API Gateway Config", icon: defaultIcons.gateway, path: "/gateway" },
      { id: "security", label: "Security", icon: defaultIcons.security, path: "/security", permission: "security.view" },
      { id: "analytics", label: "Analytics", icon: defaultIcons.analytics, path: "/analytics", permission: "analytics.view" },
      {
        id: "revenue",
        label: "Revenue Management",
        icon: defaultIcons.payments,
        path: "/revenue",
        children: [
          { id: "tax", label: "Tax Rules", icon: defaultIcons.documents, path: "/revenue/tax" },
          { id: "markup", label: "Markup Configuration", icon: defaultIcons.analytics, path: "/revenue/markup" },
          { id: "commission", label: "Commission Rules", icon: defaultIcons.system, path: "/revenue/commission" },
        ],
      },
      {
        id: "system-config",
        label: "System Configuration",
        icon: defaultIcons.cpu,
        path: "/system-config",
        children: [
          { id: "payment-gateways", label: "Payment Gateways", icon: defaultIcons.payments, path: "/system-config/payment-gateways" },
          { id: "email-templates", label: "Email Templates", icon: defaultIcons.mail, path: "/system-config/email-templates" },
        ],
      },
      { id: "health", label: "System Health", icon: defaultIcons.cpu, path: "/health" },
      { id: "audit", label: "Audit Trail", icon: defaultIcons.security, path: "/audit" },
    );
  } else if (variant === "sub-agency") {
    baseItems.push(
      { id: "dashboard", label: "Dashboard", icon: defaultIcons.dashboard, path: "/dashboard" },
      { id: "staff", label: "Staff Management", icon: defaultIcons.users, path: "/staff" },
      { id: "clients", label: "Client Management", icon: defaultIcons.users, path: "/clients" },
      { id: "bookings", label: "Bookings", icon: defaultIcons.documents, path: "/bookings" },
      { id: "payments", label: "Payments", icon: defaultIcons.payments, path: "/payments" },
      { id: "reports", label: "Reports", icon: defaultIcons.analytics, path: "/reports" },
    );
  } else if (variant === "b2b") {
    baseItems.push(
      { id: "dashboard", label: "Dashboard", icon: defaultIcons.dashboard, path: "/dashboard" },
      { id: "bookings", label: "My Bookings", icon: defaultIcons.documents, path: "/bookings" },
      { id: "search", label: "Search Flights", icon: defaultIcons.system, path: "/search" },
      { id: "profile", label: "Profile", icon: defaultIcons.users, path: "/profile" },
      { id: "support", label: "Support", icon: defaultIcons.help, path: "/support" },
    );
  }
  
  // Filter items based on permissions
  if (context?.permissions) {
    return baseItems.filter(item => 
      !item.permission || context.permissions?.includes(item.permission)
    );
  }
  
  return baseItems;
}