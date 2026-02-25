/**
 * B2B Admin Routing & Navigation Setup
 * 
 * This file provides navigation menu configuration and helper functions
 * for the B2B Admin application. Routes are defined in app/App.tsx.
 * 
 * File Structure:
 * - Navigation menu items for sidebar
 * - Route configuration for breadcrumbs and permissions
 * - Helper functions for navigation
 */

import { ReactNode } from "react"
import { LayoutDashboard, Users, Building2, ShoppingCart, Settings, BookOpen, Activity, Bell, Palette, CreditCard, Wallet } from "lucide-react"

// ============================================
// TYPE DEFINITIONS
// ============================================

interface NavItem {
  id: string
  label: string
  icon: ReactNode
  path: string
  badge?: number | string
  description?: string
  children?: NavItem[]
}

interface RouteConfig {
  path: string
  label: string
  icon?: ReactNode
  breadcrumb?: string[]
  permissions?: string[]
}

// ============================================
// NAVIGATION MENU CONFIGURATION
// ============================================

export const navigationMenu: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    path: "/",
    description: "View system overview and analytics",
  },

  {
    id: "analytics",
    label: "Analytics",
    icon: <Activity className="h-4 w-4" />,
    path: "/analytics",
    description: "View analytics and reports",
  },

  {
    id: "organizations",
    label: "Organizations",
    icon: <Building2 className="h-4 w-4" />,
    path: "/organizations",
    description: "Manage organization profiles and branches",
  },

  {
    id: "users",
    label: "User Management",
    icon: <Users className="h-4 w-4" />,
    path: "/users",
    description: "Manage staff, B2B, and B2C users",
    children: [
      {
        id: "users-list",
        label: "Users",
        icon: <Users className="h-4 w-4" />,
        path: "/users",
        description: "View and manage all users",
      },
      {
        id: "b2b-companies",
        label: "B2B Companies",
        icon: <Building2 className="h-4 w-4" />,
        path: "/users/b2b-companies",
        description: "Manage B2B partner companies",
      },
    ],
  },

  {
    id: "bookings",
    label: "Bookings",
    icon: <BookOpen className="h-4 w-4" />,
    path: "/bookings",
    description: "Manage bookings and booking queues",
    children: [
      {
        id: "bookings-list",
        label: "All Bookings",
        icon: <BookOpen className="h-4 w-4" />,
        path: "/bookings",
        description: "View and manage all bookings",
      },
      {
        id: "bookings-queues",
        label: "Booking Queues",
        icon: <ShoppingCart className="h-4 w-4" />,
        path: "/booking-queues",
        description: "Manage booking action queues",
      },
      {
        id: "bookings-new-online",
        label: "New Online Booking",
        icon: <BookOpen className="h-4 w-4" />,
        path: "/bookings/new/online",
        description: "Create online booking",
      },
      {
        id: "bookings-new-offline",
        label: "New Offline Booking",
        icon: <BookOpen className="h-4 w-4" />,
        path: "/bookings/new/offline",
        description: "Create offline booking",
      },
    ],
  },

  {
    id: "finance",
    label: "Finance",
    icon: <Wallet className="h-4 w-4" />,
    path: "/finance",
    description: "Manage finances and reports",
    children: [
      {
        id: "finance-overview",
        label: "Overview",
        icon: <Wallet className="h-4 w-4" />,
        path: "/finance",
        description: "Finance overview",
      },
      {
        id: "finance-currencies",
        label: "Currencies",
        icon: <CreditCard className="h-4 w-4" />,
        path: "/finance/currencies",
        description: "Manage currencies",
      },
      {
        id: "finance-reports-b2b",
        label: "B2B Reports",
        icon: <BookOpen className="h-4 w-4" />,
        path: "/finance/reports/b2b",
        description: "B2B financial reports",
      },
      {
        id: "finance-reports-b2c",
        label: "B2C Reports",
        icon: <BookOpen className="h-4 w-4" />,
        path: "/finance/reports/b2c",
        description: "B2C financial reports",
      },
    ],
  },

  {
    id: "wallet",
    label: "Wallet",
    icon: <Wallet className="h-4 w-4" />,
    path: "/wallet",
    description: "Manage wallet and virtual cards",
    children: [
      {
        id: "wallet-overview",
        label: "Overview",
        icon: <Wallet className="h-4 w-4" />,
        path: "/wallet",
        description: "Wallet overview",
      },
      {
        id: "wallet-virtual-cards",
        label: "Virtual Cards",
        icon: <CreditCard className="h-4 w-4" />,
        path: "/wallet/virtual-cards",
        description: "Manage virtual cards",
      },
    ],
  },

  {
    id: "suppliers",
    label: "Suppliers",
    icon: <ShoppingCart className="h-4 w-4" />,
    path: "/suppliers",
    description: "Manage supplier profiles and products",
    children: [
      {
        id: "suppliers-list",
        label: "All Suppliers",
        icon: <ShoppingCart className="h-4 w-4" />,
        path: "/suppliers",
        description: "View and manage all suppliers",
      },
      {
        id: "suppliers-management",
        label: "Supplier Management",
        icon: <Settings className="h-4 w-4" />,
        path: "/suppliers/management",
        description: "Manage supplier details",
      },
    ],
  },

  {
    id: "notifications",
    label: "Notifications",
    icon: <Bell className="h-4 w-4" />,
    path: "/notifications",
    description: "Manage notifications and alerts",
  },

  {
    id: "branding",
    label: "Branding",
    icon: <Palette className="h-4 w-4" />,
    path: "/branding",
    description: "Customize branding and appearance",
  },

  {
    id: "system",
    label: "System",
    icon: <Settings className="h-4 w-4" />,
    path: "/system",
    description: "System settings and monitoring",
    children: [
      {
        id: "system-health",
        label: "System Health",
        icon: <Activity className="h-4 w-4" />,
        path: "/system",
        description: "View system health status",
      },
      {
        id: "system-monitoring",
        label: "System Monitoring",
        icon: <Activity className="h-4 w-4" />,
        path: "/system/monitoring",
        description: "Real-time system monitoring",
      },
    ],
  },
]

// ============================================
// ROUTE CONFIGURATION
// ============================================

export const routeConfig: RouteConfig[] = [
  {
    path: "/",
    label: "Dashboard",
    breadcrumb: ["Home"],
  },

  {
    path: "/analytics",
    label: "Analytics",
    breadcrumb: ["Home", "Analytics"],
    permissions: ["analytics:view"],
  },

  // User Management Routes
  {
    path: "/users",
    label: "Users",
    breadcrumb: ["Home", "User Management", "Users"],
    permissions: ["users:view", "users:manage"],
  },

  {
    path: "/users/b2b-companies",
    label: "B2B Companies",
    breadcrumb: ["Home", "User Management", "B2B Companies"],
    permissions: ["companies:view", "companies:manage"],
  },

  // Organization Management Routes
  {
    path: "/organizations",
    label: "Organizations",
    breadcrumb: ["Home", "Organizations"],
    permissions: ["organizations:view", "organizations:manage"],
  },

  // Booking Management Routes
  {
    path: "/bookings",
    label: "Bookings",
    breadcrumb: ["Home", "Bookings"],
    permissions: ["bookings:view", "bookings:manage"],
  },

  {
    path: "/bookings/:id",
    label: "Booking Details",
    breadcrumb: ["Home", "Bookings", "Details"],
    permissions: ["bookings:view", "bookings:manage"],
  },

  {
    path: "/booking-queues",
    label: "Booking Queues",
    breadcrumb: ["Home", "Bookings", "Queues"],
    permissions: ["bookings:view", "bookings:manage"],
  },

  {
    path: "/bookings/new/online",
    label: "New Online Booking",
    breadcrumb: ["Home", "Bookings", "Create", "Online"],
    permissions: ["bookings:create", "bookings:manage"],
  },

  {
    path: "/bookings/new/offline",
    label: "New Offline Booking",
    breadcrumb: ["Home", "Bookings", "Create", "Offline"],
    permissions: ["bookings:create", "bookings:manage"],
  },

  // Finance Routes
  {
    path: "/finance",
    label: "Finance",
    breadcrumb: ["Home", "Finance"],
    permissions: ["finance:view"],
  },

  {
    path: "/finance/currencies",
    label: "Currencies",
    breadcrumb: ["Home", "Finance", "Currencies"],
    permissions: ["finance:view"],
  },

  {
    path: "/finance/reports/b2b",
    label: "B2B Reports",
    breadcrumb: ["Home", "Finance", "B2B Reports"],
    permissions: ["finance:view"],
  },

  {
    path: "/finance/reports/b2c",
    label: "B2C Reports",
    breadcrumb: ["Home", "Finance", "B2C Reports"],
    permissions: ["finance:view"],
  },

  // Wallet Routes
  {
    path: "/wallet",
    label: "Wallet",
    breadcrumb: ["Home", "Wallet"],
    permissions: ["wallet:view"],
  },

  {
    path: "/wallet/virtual-cards",
    label: "Virtual Cards",
    breadcrumb: ["Home", "Wallet", "Virtual Cards"],
    permissions: ["wallet:view"],
  },

  // Supplier Routes
  {
    path: "/suppliers",
    label: "Suppliers",
    breadcrumb: ["Home", "Suppliers"],
    permissions: ["suppliers:view", "suppliers:manage"],
  },

  {
    path: "/suppliers/management",
    label: "Supplier Management",
    breadcrumb: ["Home", "Suppliers", "Management"],
    permissions: ["suppliers:view", "suppliers:manage"],
  },

  {
    path: "/suppliers/:id/gateway",
    label: "Supplier Gateway",
    breadcrumb: ["Home", "Suppliers", "Gateway"],
    permissions: ["suppliers:view", "suppliers:manage"],
  },

  // Notification Routes
  {
    path: "/notifications",
    label: "Notifications",
    breadcrumb: ["Home", "Notifications"],
    permissions: ["notifications:view"],
  },

  // Branding Routes
  {
    path: "/branding",
    label: "Branding",
    breadcrumb: ["Home", "Branding"],
    permissions: ["branding:view", "branding:manage"],
  },

  // System Routes
  {
    path: "/system",
    label: "System Health",
    breadcrumb: ["Home", "System"],
    permissions: ["system:view"],
  },

  {
    path: "/system/monitoring",
    label: "System Monitoring",
    breadcrumb: ["Home", "System", "Monitoring"],
    permissions: ["monitoring:view", "monitoring:manage"],
  },

  // Other Routes
  {
    path: "/inventory",
    label: "Inventory",
    breadcrumb: ["Home", "Inventory"],
    permissions: ["inventory:view"],
  },

  {
    path: "/documents",
    label: "Documents",
    breadcrumb: ["Home", "Documents"],
    permissions: ["documents:view"],
  },

  {
    path: "/rules",
    label: "Rules",
    breadcrumb: ["Home", "Rules"],
    permissions: ["rules:view"],
  },

  {
    path: "/organization",
    label: "Organization",
    breadcrumb: ["Home", "Organization"],
    permissions: ["organization:view"],
  },
]

// ============================================
// NAVIGATION HELPER FUNCTIONS
// ============================================

/**
 * Get a navigation item by ID
 */
export function getNavItemById(id: string): NavItem | undefined {
  const findItem = (items: NavItem[]): NavItem | undefined => {
    for (const item of items) {
      if (item.id === id) return item
      if (item.children) {
        const found = findItem(item.children)
        if (found) return found
      }
    }
    return undefined
  }
  return findItem(navigationMenu)
}

/**
 * Get all navigation items in a flattened array
 */
export function flattenNavigation(items: NavItem[] = navigationMenu): NavItem[] {
  return items.reduce((acc: NavItem[], item) => {
    acc.push(item)
    if (item.children) {
      acc.push(...flattenNavigation(item.children))
    }
    return acc
  }, [])
}

/**
 * Get breadcrumb items for a route
 */
export function getBreadcrumb(path: string): string[] {
  const route = routeConfig.find((r) => r.path === path)
  return route?.breadcrumb || ["Home"]
}

/**
 * Check if user has permission for a route
 */
export function hasPermission(path: string, userPermissions: string[]): boolean {
  const route = routeConfig.find((r) => r.path === path)
  if (!route?.permissions) return true
  return route.permissions.some((perm) => userPermissions.includes(perm))
}

/**
 * Get all accessible routes for a user
 */
export function getAccessibleRoutes(userPermissions: string[]): RouteConfig[] {
  return routeConfig.filter((route) => hasPermission(route.path, userPermissions))
}

// ============================================
// NAVIGATION COMPONENT EXAMPLE
// ============================================

/**
 * Example sidebar navigation component
 * 
 * Usage:
 * <SidebarNavigation 
 *   currentPath="/users" 
 *   onNavigate={(path) => navigate(path)}
 * />
 */
export function SidebarNavigation({
  currentPath,
  onNavigate,
}: {
  currentPath: string
  onNavigate: (path: string) => void
}) {
  const flatNav = flattenNavigation()

  return (
    <nav className="space-y-2">
      {navigationMenu.map((item) => (
        <div key={item.id} className="space-y-1">
          {/* Parent Item */}
          <button
            onClick={() => onNavigate(item.path)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
              currentPath.startsWith(item.path)
                ? "bg-blue-100 text-blue-900 font-medium"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                {item.badge}
              </span>
            )}
          </button>

          {/* Child Items */}
          {item.children && (
            <div className="pl-6 space-y-1">
              {item.children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => onNavigate(child.path)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm transition ${
                    currentPath === child.path
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {child.icon}
                  <span>{child.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}

// ============================================
// ROUTING SETUP INSTRUCTIONS
// ============================================

/**
 * ROUTING SETUP FOR REACT ROUTER v6
 * 
 * Example in main app.tsx or router configuration:
 * 
 * import { BrowserRouter, Routes, Route } from 'react-router-dom'
 * import { routeConfig } from '@/config/routing'
 * 
 * function App() {
 *   return (
 *     <BrowserRouter>
 *       <Routes>
 *         {routeConfig.map((route) => (
 *           <Route key={route.path} path={route.path} element={route.component} />
 *         ))}
 *       </Routes>
 *     </BrowserRouter>
 *   )
 * }
 */

/**
 * LAYOUT STRUCTURE EXAMPLE
 * 
 * The B2B Admin app should have this structure:
 * 
 * ├── Layout
 * │   ├── Header
 * │   │   ├── Logo/Brand
 * │   │   ├── Search Bar
 * │   │   └── User Menu
 * │   ├── Sidebar Navigation
 * │   │   └── SidebarNavigation component
 * │   ├── Main Content Area
 * │   │   ├── Breadcrumb Navigation
 * │   │   └── Route Content
 * │   └── Footer (optional)
 */

/**
 * BREADCRUMB COMPONENT EXAMPLE
 * 
 * Usage:
 * <Breadcrumb items={getBreadcrumb(currentPath)} />
 */
export function Breadcrumb({ items }: { items: string[] }) {
  return (
    <nav className="flex items-center gap-2 text-sm mb-4">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <span className="text-slate-400">/</span>}
          <span className={index === items.length - 1 ? "text-slate-900 font-medium" : "text-slate-600"}>
            {item}
          </span>
        </div>
      ))}
    </nav>
  )
}

// ============================================
// API ENDPOINTS MAPPING
// ============================================

/**
 * API Endpoints used by all management pages:
 * 
 * USERS:
 * - GET    /users                       (list with pagination)
 * - GET    /users/{id}                  (get user details)
 * - POST   /users                       (create user)
 * - PUT    /users/{id}/details          (update user details)
 * - DELETE /users/{id}                  (delete user)
 * - GET    /users/{id}/permissions      (get user permissions)
 * - PUT    /users/{id}/permissions/{id} (update permission)
 * - GET    /users/{id}/documents        (get user documents)
 * - POST   /users/{id}/documents        (upload document)
 * - DELETE /users/{id}/documents/{id}   (delete document)
 * - PUT    /users/{id}/password         (change password)
 * - POST   /users/{id}/image            (upload profile image)
 * 
 * B2B COMPANIES:
 * - GET    /companies                   (list with pagination)
 * - GET    /companies/{id}              (get company details)
 * - POST   /companies                   (create company)
 * - PUT    /companies/{id}              (update company)
 * - DELETE /companies/{id}              (delete company)
 * - GET    /companies/{id}/branches     (get branches)
 * - POST   /companies/{id}/branches     (create branch)
 * - GET    /companies/{id}/users        (get users)
 * - POST   /companies/{id}/users        (create user)
 * - GET    /companies/{id}/headers      (get branding)
 * - POST   /companies/{id}/media        (upload media)
 * 
 * ORGANIZATIONS:
 * - GET    /organization                (list with pagination)
 * - GET    /organization/{id}           (get details)
 * - POST   /organization                (create)
 * - PUT    /organization/{id}           (update)
 * - DELETE /organization/{id}           (delete)
 * - GET    /branches                    (list branches)
 * - POST   /branches                    (create branch)
 * - GET    /branding/headers            (get headers)
 * - POST   /branding/media              (upload media)
 * 
 * SUPPLIERS:
 * - GET    /admin/suppliers             (list with pagination)
 * - GET    /admin/suppliers/{id}        (get details)
 * - POST   /admin/suppliers             (create)
 * - PUT    /admin/suppliers/{id}        (update)
 * - DELETE /admin/suppliers/{id}        (delete)
 * - GET    /admin/suppliers/{id}/products   (get products)
 * - POST   /admin/suppliers/{id}/products   (create product)
 * - GET    /admin/suppliers/{id}/rules      (get rules)
 * - POST   /admin/suppliers/{id}/rules      (create rule)
 * - GET    /admin/suppliers/{id}/finance    (get payments)
 * - POST   /admin/suppliers/{id}/finance    (create payment)
 * - GET    /admin/suppliers/{id}/documents  (get documents)
 * - POST   /admin/suppliers/{id}/documents  (upload document)
 * - GET    /admin/suppliers/{id}/credentials (get API credentials)
 * - POST   /admin/suppliers/{id}/credentials (create credentials)
 * 
 * DROPDOWN OPTIONS (SHARED):
 * - GET    /dropdown-options/countries
 * - GET    /dropdown-options/nationalities
 * - GET    /dropdown-options/states
 * - GET    /dropdown-options/cities
 * - GET    /dropdown-options/document-types
 * - GET    /permissions
 */

export default {
  navigationMenu,
  routeConfig,
  getNavItemById,
  flattenNavigation,
  getBreadcrumb,
  hasPermission,
  getAccessibleRoutes,
  SidebarNavigation,
  Breadcrumb,
}
