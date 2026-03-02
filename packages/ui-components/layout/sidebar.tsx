"use client";

// Admin Panel - Sidebar Navigation
// @ts-ignore
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  Plane,
  Truck,
  DollarSign,
  Tags,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  X,
  Menu,
  LogOut,
  Sun,
  Moon,
  Bell,
} from "lucide-react";
import { cn } from "@tripalfa/shared-utils";

// Types
export interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: string;
  children?: MenuItem[];
}

// Temporary Mock for Theme (since next-themes is gone)
const useTheme = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  return { theme, setTheme };
};

// Hardcoded Menu for now to replace missing @/lib/constants
const MAIN_MENU: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
  },
  {
    id: "staff",
    label: "Staff Onboarding",
    href: "/staff/onboarding",
    icon: "Users",
  },
  {
    id: "companies",
    label: "Companies",
    href: "/companies",
    icon: "Building2",
  },
  { id: "users", label: "Users", href: "/users", icon: "Users" },
  { id: "security", label: "Security", href: "/security", icon: "ShieldCheck" },
];

// Icon mapping
const iconMap: Record<string, any> = {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  Plane,
  Truck,
  DollarSign,
  Tags,
  BarChart3,
  Settings,
};

// ============================================================================
// Sidebar Component
// ============================================================================

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps): React.ReactElement {
  const { pathname } = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(["dashboard"]);

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const isActive = (href: string) => {
    if (href === "/dashboard")
      return pathname === "/dashboard" || pathname === "/";
    return pathname.startsWith(href);
  };

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const Icon = iconMap[item.icon] || LayoutDashboard;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const active = isActive(item.href);

    return (
      <li key={item.id}>
        {hasChildren ? (
          <div>
            <button
              onClick={() => toggleExpanded(item.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                  : "text-secondary-600 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:bg-secondary-800",
                depth > 0 && "pl-10",
              )}
            >
              <span className="flex items-center gap-3">
                {depth === 0 && <Icon className="h-5 w-5" />}
                {item.label}
              </span>
              <span className="flex items-center gap-2">
                {item.badge && (
                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                    {item.badge}
                  </span>
                )}
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </span>
            </button>
            {isExpanded && (
              <ul className="mt-1 space-y-1">
                {item.children?.map((child) =>
                  renderMenuItem(child, depth + 1),
                )}
              </ul>
            )}
          </div>
        ) : (
          <Link
            to={item.href}
            onClick={() => onClose()}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                : "text-secondary-600 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:bg-secondary-800",
              depth > 0 && "pl-10",
            )}
          >
            <span className="flex items-center gap-3">
              {depth === 0 && <Icon className="h-5 w-5" />}
              {item.label}
            </span>
            {item.badge && (
              <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                {item.badge}
              </span>
            )}
          </Link>
        )}
      </li>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r bg-white transition-transform duration-300 dark:border-secondary-800 dark:bg-secondary-900",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4 dark:border-secondary-800">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
              <Plane className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-secondary-900 dark:text-white">
              TripAlfa
            </span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-secondary-500 hover:bg-secondary-100 lg:hidden dark:hover:bg-secondary-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {MAIN_MENU.map((item) => renderMenuItem(item))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t p-4 dark:border-secondary-800">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:bg-secondary-800">
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

// ============================================================================
// Header Component
// ============================================================================

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps): React.ReactElement {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/80 px-4 backdrop-blur-md dark:border-secondary-800 dark:bg-secondary-900/80 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-secondary-500 hover:bg-secondary-100 lg:hidden dark:hover:bg-secondary-800"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-secondary-900 dark:text-white lg:text-xl">
          Admin Panel
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error-500" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-lg p-2 text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* User menu */}
        <div className="flex items-center gap-3 rounded-lg px-3 py-1.5 hover:bg-secondary-100 dark:hover:bg-secondary-800">
          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-sm font-medium text-primary-700">SA</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-secondary-900 dark:text-white">
              Admin
            </p>
            <p className="text-xs text-secondary-500">admin@tripalfa.com</p>
          </div>
        </div>
      </div>
    </header>
  );
}
