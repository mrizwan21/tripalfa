/**
 * B2B Admin Layout Component
 *
 * Main layout wrapper for the B2B Admin application
 * Includes sidebar navigation, header, breadcrumbs, and content area
 */

import { useState } from "react";
import { Menu, X, LogOut, Settings } from "lucide-react";
// @ts-ignore
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  navigationMenu,
  getBreadcrumb,
  SidebarNavigation,
  Breadcrumb,
} from "@/config/routing";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleNavigation = (path: string) => {
    navigate(path);
    setSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  const handleLogout = () => {
    // Clear localStorage auth data
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between h-16 px-4 gap-2">
          {/* Logo and Sidebar Toggle */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="default"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-muted rounded-lg lg:hidden"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center gap-2">
                <span className="text-white font-bold text-sm">TA</span>
              </div>
              <span className="font-semibold text-foreground hidden sm:inline">
                TripAlfa Admin
              </span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Search (placeholder) */}
            <div className="hidden sm:block">
              <input
                type="text"
                placeholder="Search..."
                className="px-3 py-1.5 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="default"
                className="p-2 hover:bg-muted rounded-lg"
              >
                <Settings className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={handleLogout}
                className="p-2 hover:bg-muted rounded-lg text-muted-foreground"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)] gap-4">
        {/* Sidebar - Responsive */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } fixed lg:static w-64 h-full bg-card border-r border-border transition-transform duration-200 overflow-y-auto z-30`}
        >
          <div className="p-4">
            <SidebarNavigation
              currentPath={location.pathname}
              onNavigate={handleNavigation}
            />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto gap-4">
          {/* Breadcrumb */}
          <div className="sticky top-0 bg-card border-b border-border px-6 py-3 z-20">
            <Breadcrumb items={getBreadcrumb(location.pathname)} />
          </div>

          {/* Page Content */}
          <div className="p-6">{children}</div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * Example App Router Setup
 * 
 * This would go in your main app.tsx or router file:
 * 
 * ```tsx
 * import { BrowserRouter, Routes, Route } from 'react-router-dom'
 * import { AdminLayout } from '@/layout/AdminLayout'
 * import { routeConfig } from '@/config/routing'
import { Button } from '@tripalfa/ui-components';
 * 
 * function App() {
 *   return (
 *     <BrowserRouter>
 *       <Routes>
 *         {routeConfig.map((route) => (
 *           <Route
 *             key={route.path}
 *             path={route.path}
 *             element={
 *               <AdminLayout>
 *                 {route.component}
 *               </AdminLayout>
 *             }
 *           />
 *         ))}
 *       </Routes>
 *     </BrowserRouter>
 *   )
 * }
 * ```
 */
