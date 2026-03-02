/**
 * B2B Admin Layout Component - Futuristic Design
 *
 * Main layout wrapper for the B2B Admin application
 * Includes sidebar navigation, header, breadcrumbs, and content area
 * Features a sleek, cyberpunk-inspired design with neon accents
 */

import { useState } from "react";
import {
  Menu,
  X,
  LogOut,
  Settings,
  Zap,
  Search,
  Bell,
  Sparkles,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  navigationMenu,
  getBreadcrumb,
  SidebarNavigation,
  Breadcrumb,
} from "@/config/routing";
import { Button } from "@tripalfa/ui-components";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@tripalfa/shared-utils/utils";

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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none gap-4" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-cyan-500/10">
        <div className="flex items-center justify-between h-16 px-4 gap-2">
          {/* Logo and Sidebar Toggle */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="default"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-cyan-500/5 rounded-xl text-muted-foreground hover:text-cyan-400 transition-colors border border-transparent hover:border-cyan-500/20 lg:hidden"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25 relative overflow-hidden gap-2">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                <Zap className="h-4 w-4 text-white relative z-10" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-foreground gradient-text">
                  TripAlfa
                </span>
                <span className="text-xs text-cyan-400/60 block -mt-0.5">
                  Admin Portal
                </span>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden sm:block relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400/50" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 bg-cyan-500/5 border border-cyan-500/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/30 transition-all w-48"
              />
            </div>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="default"
              className="relative p-2.5 hover:bg-cyan-500/5 rounded-xl transition-colors border border-transparent hover:border-cyan-500/20"
            >
              <Bell className="h-5 w-5 text-muted-foreground hover:text-cyan-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full animate-pulse" />
            </Button>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="default"
                className="p-2.5 hover:bg-cyan-500/5 rounded-xl transition-colors border border-transparent hover:border-cyan-500/20 text-muted-foreground hover:text-cyan-400"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="default"
                onClick={handleLogout}
                className="p-2.5 hover:bg-rose-500/5 rounded-xl transition-colors border border-transparent hover:border-rose-500/20 text-muted-foreground hover:text-rose-400"
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
        <AnimatePresence>
          <aside
            className={cn(
              "fixed lg:static w-64 h-full bg-gradient-to-b from-background via-muted/30 to-background border-r border-cyan-500/10 transition-all duration-300 overflow-y-auto z-30 scrollbar-thin",
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0",
            )}
          >
            {/* Sidebar gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />

            <div className="p-4 relative z-10">
              <SidebarNavigation
                currentPath={location.pathname}
                onNavigate={handleNavigation}
              />
            </div>
          </aside>
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative gap-4">
          {/* Breadcrumb */}
          <div className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-cyan-500/10 px-6 py-3 z-20">
            <Breadcrumb items={getBreadcrumb(location.pathname)} />
          </div>

          {/* Page Content */}
          <div className="p-6 relative z-10">{children}</div>
        </main>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
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
