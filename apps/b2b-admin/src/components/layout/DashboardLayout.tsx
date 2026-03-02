/**
 * Modern Dashboard Layout
 * State-of-the-art UI for Rules Engine Management
 */

import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { Button } from "@tripalfa/ui-components";

const {
  LayoutGrid,
  Settings,
  TrendingUp,
  Zap,
  AlertCircle,
  Activity,
  ChevronRight,
  Search,
  Bell,
  Moon,
  Sun,
  Menu,
  X,
} = Icons as any;

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const navItems = [
    { icon: LayoutGrid, label: "Dashboard", href: "#", active: true },
    { icon: TrendingUp, label: "Analytics", href: "#" },
    { icon: Zap, label: "Rules Engine", href: "#" },
    { icon: Activity, label: "API Status", href: "#" },
    { icon: Settings, label: "Configuration", href: "#" },
  ];

  return (
    <div className={`flex h-screen ${isDarkMode ? "dark" : ""}`}>
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-background via-muted/30 to-background text-foreground transition-all duration-300 border-r border-border hidden md:flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border flex items-center justify-between gap-2">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center gap-2">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent text-3xl font-bold tracking-tight">
                  TripAlfa
                </h1>
                <p className="text-xs text-muted-foreground">Rules Engine</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                item.active
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0 gap-4" />
              {sidebarOpen && (
                <>
                  <span className="flex-1 gap-4">{item.label}</span>
                  {item.active && (
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </>
              )}
            </a>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="outline"
            size="default"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors text-sm"
          >
            {sidebarOpen ? "Hide" : "Show"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between backdrop-blur-md bg-opacity-80 dark:bg-opacity-80 gap-2">
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Menu */}
            <Button
              variant="outline"
              size="default"
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 hover:bg-muted rounded-lg"
            >
              {menuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>

            {/* Search */}
            <div className="flex-1 max-w-md gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search rules, endpoints..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Button
              variant="outline"
              size="default"
              className="relative p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="default"
              onClick={toggleTheme}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-muted-foreground" />
              )}
            </Button>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold gap-2">
                AR
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-foreground">Admin</p>
                <p className="text-xs text-muted-foreground">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto gap-4">
          <div className="p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
