import { Avatar, AvatarFallback, AvatarImage } from "@tripalfa/ui-components/ui/avatar";
import { Button } from "@tripalfa/ui-components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tripalfa/ui-components/ui/dropdown-menu";
import {
  User,
  LogOut,
  Settings,
  Bell,
  Search,
  Menu,
  TerminalIcon as Command,
  Sparkles,
  Calendar,
  Mail,
  CheckCircle2,
  AlertCircle,
  Info,
  Zap,
  Moon,
  Sun,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@tripalfa/shared-utils/utils";

const notifications = [
  {
    id: 1,
    type: "success",
    title: "Booking Confirmed",
    message: "New booking #12345 has been confirmed",
    time: "2 min ago",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
  },
  {
    id: 2,
    type: "warning",
    title: "Payment Pending",
    message: "Invoice #INV-2024-001 payment is overdue",
    time: "1 hour ago",
    icon: AlertCircle,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
  {
    id: 3,
    type: "info",
    title: "System Update",
    message: "Scheduled maintenance tonight at 2 AM",
    time: "3 hours ago",
    icon: Info,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
  },
];

const quickActions = [
  { label: "New Booking", shortcut: "⌘B", icon: Calendar },
  { label: "Search", shortcut: "⌘K", icon: Search },
  { label: "Messages", shortcut: "⌘M", icon: Mail },
];

export function Header() {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return { title: "Dashboard", subtitle: "Overview of your business" };
    if (path.includes("/analytics")) return { title: "Analytics", subtitle: "Detailed insights & reports" };
    if (path.includes("/bookings")) return { title: "Bookings", subtitle: "Manage all reservations" };
    if (path.includes("/users")) return { title: "User Management", subtitle: "Manage user accounts" };
    if (path.includes("/organization") || path.includes("/companies")) {
      return { title: "Organizations", subtitle: "Organization management" };
    }
    if (path.includes("/wallet")) return { title: "Wallet", subtitle: "Credits & transactions" };
    if (path.includes("/finance")) return { title: "Finance", subtitle: "Financial overview" };
    if (path.includes("/suppliers")) return { title: "Suppliers", subtitle: "Supplier management" };
    if (path.includes("/rules")) return { title: "Rules Engine", subtitle: "Automated workflows" };
    if (path.includes("/system")) return { title: "System Health", subtitle: "Monitor performance" };
    return { title: "Admin Portal", subtitle: "Manage your platform" };
  };

  const pageInfo = getPageTitle();

  return (
    <header className="flex h-20 w-full items-center justify-between border-b border-cyan-500/10 bg-[#0a0e17]/80 backdrop-blur-xl px-6 sticky top-0 z-30 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      {/* Left Section - Page Title */}
      <div className="flex items-center gap-4 relative z-10">
        <motion.div
          key={pageInfo.title}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="h-5 w-5 text-cyan-400" />
            {pageInfo.title}
          </h1>
          <p className="text-sm text-cyan-400/60">{pageInfo.subtitle}</p>
        </motion.div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-3 relative z-10">
        {/* Search Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSearchOpen(true)}
          className="h-10 px-4 text-slate-400 border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/5 gap-2 hidden md:flex bg-transparent"
        >
          <Search className="h-4 w-4" />
          <span className="text-sm">Search...</span>
          <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-cyan-500/20 bg-cyan-500/5 px-1.5 font-mono text-[10px] font-medium text-cyan-400">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Quick Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 text-cyan-400 border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/5 bg-transparent"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass border-cyan-500/20 bg-[#0d1117]/95">
            <DropdownMenuLabel className="text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">
              Quick Actions
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-cyan-500/10" />
            {quickActions.map((action) => (
              <DropdownMenuItem
                key={action.label}
                className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/5 focus:bg-cyan-500/5 focus:text-cyan-400"
              >
                <div className="flex items-center gap-2">
                  <action.icon className="h-4 w-4 text-cyan-400" />
                  <span>{action.label}</span>
                </div>
                <kbd className="text-[10px] text-cyan-400/50">{action.shortcut}</kbd>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Time Display */}
        <div className="hidden lg:flex flex-col items-end px-3 py-1 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
          <span className="text-sm font-semibold text-cyan-400 font-mono">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-xs text-cyan-400/50">
            {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Notifications */}
        <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 text-slate-400 border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/5 relative bg-transparent"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-500 opacity-30 animate-ping" />
                <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 text-[10px] font-bold text-white">
                  3
                </span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 glass border-cyan-500/20 bg-[#0d1117]/95">
            <div className="flex items-center justify-between p-4 border-b border-cyan-500/10">
              <h4 className="font-semibold text-white">Notifications</h4>
              <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/5">
                Mark all read
              </Button>
            </div>
            <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex items-start gap-3 p-4 border-b border-cyan-500/5 last:border-0 hover:bg-cyan-500/5 cursor-pointer transition-colors",
                    notification.borderColor
                  )}
                >
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0 border", notification.bgColor, notification.borderColor)}>
                    <notification.icon className={cn("h-4 w-4", notification.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{notification.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{notification.message}</p>
                    <p className="text-[10px] text-cyan-400/50 mt-1">{notification.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="p-3 border-t border-cyan-500/10">
              <Button variant="ghost" size="sm" className="w-full text-xs text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5">
                View all notifications
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-11 pl-2 pr-3 rounded-xl hover:bg-cyan-500/5 gap-2 border border-cyan-500/10"
            >
              <div className="relative">
                <Avatar className="h-8 w-8 border-2 border-cyan-500/30">
                  <AvatarImage src="/avatar.png" alt="@user" />
                  <AvatarFallback className="bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 text-white text-sm font-bold">
                    AD
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#0a0e17] shadow-lg shadow-emerald-500/50" />
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-semibold text-white">Admin User</span>
                <span className="text-[10px] text-cyan-400/60">Admin</span>
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-64 glass border-cyan-500/20 bg-[#0d1117]/95" align="end" forceMount>
            <DropdownMenuLabel className="font-normal p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-cyan-500/30">
                  <AvatarFallback className="bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 text-white font-bold">
                    AD
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-white">Admin User</p>
                  <p className="text-xs text-cyan-400/60">admin@tripalfa.com</p>
                  <span className="inline-flex mt-1.5 w-fit items-center rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 px-2 py-0.5 text-[10px] font-medium text-cyan-400 border border-cyan-500/30">
                    <Zap className="h-3 w-3 mr-1" />
                    Admin
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-cyan-500/10" />

            <DropdownMenuItem asChild className="cursor-pointer py-2.5 text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/5 focus:bg-cyan-500/5 focus:text-cyan-400">
              <Link to="/profile" className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <User className="h-4 w-4 text-cyan-400" />
                </div>
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="cursor-pointer py-2.5 text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/5 focus:bg-cyan-500/5 focus:text-cyan-400">
              <Link to="/settings" className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <Settings className="h-4 w-4 text-cyan-400" />
                </div>
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-cyan-500/10" />

            <DropdownMenuItem className="cursor-pointer py-2.5 text-rose-400 focus:text-rose-300 focus:bg-rose-500/5 hover:bg-rose-500/5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20">
                <LogOut className="h-4 w-4 text-rose-400" />
              </div>
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
