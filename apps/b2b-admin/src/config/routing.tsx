/**
 * B2B Admin Routing & Navigation Setup
 * 
 * This file demonstrates the complete routing structure for all management pages
 * created in the B2B Admin application.
 * 
 * File Structure:
 * - Define route configuration
 * - Navigation menu items
 * - Sidebar navigation structure
 * - Page component imports
 */

import { ReactNode } from "react"
import { LayoutDashboard, Users, Building2, ShoppingCart, Settings, BookOpen } from "lucide-react"

// ============================================
// PAGE COMPONENT IMPORTS
// ============================================

// User Management Pages
import { UsersList } from "@/features/users/pages/UsersList"
import { B2BCompaniesList } from "@/features/users/pages/B2BCompaniesList"

// Organization Management Pages
import { OrganizationsList } from "@/features/system/pages/OrganizationsList"

// Supplier Management Pages
import { SuppliersManagement } from "@/features/suppliers/pages/SuppliersManagement"

// Booking Management Pages
import BookingsList from "@/features/bookings/pages/BookingsList"
import BookingDetails from "@/features/bookings/pages/BookingDetails"
import BookingQueues from "@/features/bookings/pages/BookingQueues"
import NewBookingOnline from "@/features/bookings/pages/NewBookingOnline"
import NewBookingOffline from "@/features/bookings/pages/NewBookingOffline"

// ============================================
// TYPE DEFINITIONS
// ============================================

interface NavItem {
  id: string
  label: string
  icon: ReactNode
  path: string
  component: ReactNode
  badge?: number | string
  description?: string
  children?: NavItem[]
}

interface RouteConfig {
  path: string
  label: string
  component: ReactNode
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
    path: "/dashboard",
    component: <div>Dashboard Component</div>,
    description: "View system overview and analytics",
  },

  {
    id: "organizations",
    label: "Organizations",
    icon: <Building2 className="h-4 w-4" />,
    path: "/organizations",
    component: <OrganizationsList />,
    description: "Manage organization profiles and branches",
    badge: "3 new",
  },

  {
    id: "settings",
    label: "System Settings",
    icon: <Settings className="h-4 w-4" />,
    path: "/settings",
    component: <div>Settings Component</div>,
    description: "Configure system preferences",
    children: [
      {
        id: "settings-general",
        label: "General",
        icon: <Settings className="h-4 w-4" />,
        path: "/settings/general",
        component: <div>General Settings</div>,
      },
      {
        id: "settings-advanced",
        label: "Advanced",
        icon: <Settings className="h-4 w-4" />,
        path: "/settings/advanced",
        component: <div>Advanced Settings</div>,
      },
    ],
  },

  {
    id: "users",
    label: "User Management",
    icon: <Users className="h-4 w-4" />,
    path: "/users",
    component: <UsersList />,
    description: "Manage staff, B2B, and B2C users",
    badge: "Updated",
    children: [
      {
        id: "users-list",
        label: "Users",
        icon: <Users className="h-4 w-4" />,
        path: "/users",
        component: <UsersList />,
        description: "View and manage all users",
      },
      {
        id: "b2b-companies",
        label: "B2B Companies",
        icon: <Building2 className="h-4 w-4" />,
        path: "/users/b2b-companies",
        component: <B2BCompaniesList />,
        description: "Manage B2B partner companies",
      },
    ],
  },

  {
    id: "suppliers",
    label: "Suppliers",
    icon: <ShoppingCart className="h-4 w-4" />,
    path: "/suppliers",
    component: <SuppliersManagement />,
    description: "Manage supplier profiles and products",
  },

  {
    id: "bookings",
    label: "Bookings",
    icon: <BookOpen className="h-4 w-4" />,
    path: "/bookings",
    component: <BookingsList />,
    description: "Manage bookings and booking queues",
    children: [
      {
        id: "bookings-list",
        label: "All Bookings",
        icon: <BookOpen className="h-4 w-4" />,
        path: "/bookings",
        component: <BookingsList />,
        description: "View and manage all bookings",
      },
      {
        id: "bookings-queues",
        label: "Booking Queues",
        icon: <ShoppingCart className="h-4 w-4" />,
        path: "/bookings/queues",
        component: <BookingQueues />,
        description: "Manage booking action queues",
      },
      {
        id: "bookings-new-online",
        label: "New Online Booking",
        icon: <BookOpen className="h-4 w-4" />,
        path: "/bookings/new/online",
        component: <NewBookingOnline />,
        description: "Create online booking",
      },
      {
        id: "bookings-new-offline",
        label: "New Offline Booking",
        icon: <BookOpen className="h-4 w-4" />,
        path: "/bookings/new/offline",
        component: <NewBookingOffline />,
        description: "Create offline booking",
      },
    ],
  },
]

// ============================================
// ROUTE CONFIGURATION
// ============================================

export const routeConfig: RouteConfig[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    breadcrumb: ["Home", "Dashboard"],
    component: <div>Dashboard</div>,
  },

  // User Management Routes
  {
    path: "/users",
    label: "Users",
    breadcrumb: ["Home", "User Management", "Users"],
    component: <UsersList />,
    permissions: ["users:view", "users:manage"],
  },

  {
    path: "/users/b2b-companies",
    label: "B2B Companies",
    breadcrumb: ["Home", "User Management", "B2B Companies"],
    component: <B2BCompaniesList />,
    permissions: ["companies:view", "companies:manage"],
  },

  // Organization Management Routes
  {
    path: "/organizations",
    label: "Organizations",
    breadcrumb: ["Home", "Organizations"],
    component: <OrganizationsList />,
    permissions: ["organizations:view", "organizations:manage"],
  },

  // Supplier Management Routes
  {
    path: "/suppliers",
    label: "Suppliers",
    breadcrumb: ["Home", "Suppliers"],
    component: <SuppliersManagement />,
    permissions: ["suppliers:view", "suppliers:manage"],
  },

  // Booking Management Routes
  {
    path: "/bookings",
    label: "Bookings",
    breadcrumb: ["Home", "Bookings"],
    component: <BookingsList />,
    permissions: ["bookings:view", "bookings:manage"],
  },

  {
    path: "/bookings/:id",
    label: "Booking Details",
    breadcrumb: ["Home", "Bookings", "Details"],
    component: <BookingDetails />,
    permissions: ["bookings:view", "bookings:manage"],
  },

  {
    path: "/bookings/queues",
    label: "Booking Queues",
    breadcrumb: ["Home", "Bookings", "Queues"],
    component: <BookingQueues />,
    permissions: ["bookings:view", "bookings:manage"],
  },

  {
    path: "/bookings/new/online",
    label: "New Online Booking",
    breadcrumb: ["Home", "Bookings", "Create", "Online"],
    component: <NewBookingOnline />,
    permissions: ["bookings:create", "bookings:manage"],
  },

  {
    path: "/bookings/new/offline",
    label: "New Offline Booking",
    breadcrumb: ["Home", "Bookings", "Create", "Offline"],
    component: <NewBookingOffline />,
    permissions: ["bookings:create", "bookings:manage"],
  },

  // Settings Routes
  {
    path: "/settings/general",
    label: "General Settings",
    breadcrumb: ["Home", "Settings", "General"],
    component: <div>General Settings</div>,
    permissions: ["settings:view", "settings:manage"],
  },

  {
    path: "/settings/advanced",
    label: "Advanced Settings",
    breadcrumb: ["Home", "Settings", "Advanced"],
    component: <div>Advanced Settings</div>,
    permissions: ["settings:view", "settings:manage"],
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
