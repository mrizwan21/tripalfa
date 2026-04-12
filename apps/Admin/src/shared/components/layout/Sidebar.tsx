import { Link, useLocation } from 'react-router-dom';
import { cn } from '@tripalfa/shared-utils/utils';
import {
  LayoutDashboard,
  Calendar,
  Users,
  CreditCard,
  Share2Icon as Network,
  Maximize2Icon as Scale,
  Settings,
  Wallet,
  PieChartIcon as PieChart,
  FileText,
  Package,
  ActivityIcon as Activity,
  Bell,
  Building2,
  ClipboardListIcon as ClipboardList,
  Plus,
  Car,
  ChevronRight,
  LogOut,
  ChevronDown,
  Sparkles,
  Zap,
  Globe,
  Shield,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAccessControl } from '@/contexts/AccessControlContext';
import { Button } from '@tripalfa/ui-components';

interface SidebarItem {
  icon: any;
  label: string;
  to: string;
  badge?: number;
  children?: { label: string; to: string }[];
}

interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

export function Sidebar() {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { canAccessRoute } = useAccessControl();

  const toggleExpand = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label) ? prev.filter(item => item !== label) : [...prev, label]
    );
  };

  const menuGroups: SidebarGroup[] = [
    {
      label: 'Overview',
      items: [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/analytics', label: 'Analytics', icon: PieChart },
      ],
    },
    {
      label: 'Operations',
      items: [
        {
          to: '/bookings',
          label: 'Bookings',
          icon: Calendar,
          badge: 12,
          children: [
            { label: 'All Bookings', to: '/bookings' },
            { label: 'Booking Queues', to: '/booking-queues' },
            { label: 'New Online', to: '/bookings/new/online' },
            { label: 'New Offline', to: '/bookings/new/offline' },
          ],
        },
        { to: '/users', label: 'User Management', icon: Users },
        { to: '/organization', label: 'Organizations', icon: Building2 },
        { to: '/inventory', label: 'Inventory', icon: Package },
        { to: '/documents', label: 'Documents', icon: FileText },
        { to: '/notifications', label: 'Notifications', icon: Bell },
        { to: '/branding', label: 'Branding', icon: Sparkles },
      ],
    },
    {
      label: 'Finance',
      items: [
        { to: '/wallet', label: 'Wallet & Credits', icon: Wallet, badge: 3 },
        { to: '/finance', label: 'Transactions', icon: CreditCard },
        {
          to: '/finance/currencies',
          label: 'Currency Management',
          icon: DollarSign,
          children: [{ label: 'Currencies', to: '/finance/currencies' }],
        },
        {
          to: '/finance/reports/b2b',
          label: 'Reports',
          icon: BarChart3,
          children: [
            { label: 'B2B Reports', to: '/finance/reports/b2b' },
            { label: 'B2C Reports', to: '/finance/reports/b2c' },
          ],
        },
      ],
    },
    {
      label: 'Platform',
      items: [
        { to: '/suppliers', label: 'Suppliers', icon: Network },
        { to: '/rules', label: 'Rules Engine', icon: Scale },
        {
          to: '/system',
          label: 'System',
          icon: Activity,
          children: [
            { label: 'System Health', to: '/system' },
            { label: 'Monitoring', to: '/system/monitoring' },
            { label: 'Runtime Settings', to: '/system/runtime-settings' },
            { label: 'Content Settings', to: '/system/content-settings' },
            { label: 'Permission Manager', to: '/system/permission-manager' },
          ],
        },
      ],
    },
  ];

  const filteredMenuGroups: SidebarGroup[] = menuGroups
    .map(group => ({
      ...group,
      items: group.items.reduce<SidebarItem[]>((acc, item) => {
        const filteredChildren = item.children?.filter(child => canAccessRoute(child.to));
        const hasDirectAccess = canAccessRoute(item.to);
        const hasChildAccess = Boolean(filteredChildren && filteredChildren.length > 0);

        if (!hasDirectAccess && !hasChildAccess) {
          return acc;
        }

        const nextItem: SidebarItem = {
          icon: item.icon,
          label: item.label,
          to: item.to,
          ...(typeof item.badge === 'number' ? { badge: item.badge } : {}),
          ...(hasChildAccess ? { children: filteredChildren } : {}),
        };

        acc.push(nextItem);

        return acc;
      }, []),
    }))
    .filter(group => group.items.length > 0);

  return (
    <div className="flex h-screen w-72 flex-col bg-background text-muted-foreground border-r border-cyan-500/10 gap-4">
      {/* Logo Section */}
      <div className="flex h-20 items-center px-6 border-b border-cyan-500/10 relative overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-transparent" />

        <Link to="/" className="flex items-center gap-3 group relative z-10">
          <img src="/logo.png" alt="TripAlfa Logo" className="h-8 md:h-10 object-contain" />
          <div className="flex flex-col gap-4">
            <span className="text-[10px] text-cyan-400/70 uppercase tracking-widest font-medium flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Admin Portal
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3 scrollbar-thin gap-4">
        {filteredMenuGroups.map((group, groupIndex) => (
          <div key={group.label} className="mb-6">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400/50 px-4 mb-3 flex items-center gap-2">
              <div className="h-px w-4 bg-gradient-to-r from-cyan-500/50 to-transparent" />
              {group.label}
            </h4>
            <div className="space-y-2">
              {group.items.map((item, itemIndex) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedItems.includes(item.label);

                return (
                  <div key={item.to}>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: groupIndex * 0.1 + itemIndex * 0.05,
                      }}
                    >
                      {hasChildren ? (
                        <Button
                          variant="outline"
                          size="default"
                          onClick={() => toggleExpand(item.label)}
                          className={cn(
                            'w-full group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300',
                            isActive || isExpanded
                              ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-foreground border border-cyan-500/20'
                              : 'text-muted-foreground hover:bg-cyan-500/5 hover:text-cyan-300 border border-transparent'
                          )}
                        >
                          {/* Active indicator */}
                          {(isActive || isExpanded) && (
                            <motion.div
                              layoutId="sidebarIndicator"
                              className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full sidebar-active-indicator"
                              initial={false}
                              transition={{
                                type: 'spring',
                                stiffness: 400,
                                damping: 30,
                              }}
                            />
                          )}

                          <div
                            className={cn(
                              'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300 relative overflow-hidden',
                              isActive || isExpanded
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'bg-card/50 text-muted-foreground group-hover:text-cyan-400 group-hover:bg-cyan-500/10'
                            )}
                          >
                            <Icon className="h-4.5 w-4.5 relative z-10" />
                          </div>

                          <span className="flex-1 text-left gap-4">{item.label}</span>

                          {item.badge && (
                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 px-2 text-[10px] font-semibold text-cyan-400 border border-cyan-500/30 gap-4">
                              {item.badge}
                            </span>
                          )}

                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </motion.div>
                        </Button>
                      ) : (
                        <Link
                          to={item.to}
                          className={cn(
                            'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300',
                            isActive
                              ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-foreground border border-cyan-500/20'
                              : 'text-muted-foreground hover:bg-cyan-500/5 hover:text-cyan-300 border border-transparent'
                          )}
                        >
                          {/* Active indicator */}
                          {isActive && (
                            <motion.div
                              layoutId="sidebarIndicator"
                              className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full sidebar-active-indicator"
                              initial={false}
                              transition={{
                                type: 'spring',
                                stiffness: 400,
                                damping: 30,
                              }}
                            />
                          )}

                          <div
                            className={cn(
                              'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300 relative overflow-hidden',
                              isActive
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'bg-card/50 text-muted-foreground group-hover:text-cyan-400 group-hover:bg-cyan-500/10'
                            )}
                          >
                            <Icon className="h-4.5 w-4.5 relative z-10" />
                          </div>

                          <span className="flex-1 gap-4">{item.label}</span>

                          {item.badge && (
                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 px-2 text-[10px] font-semibold text-cyan-400 border border-cyan-500/30 gap-4">
                              {item.badge}
                            </span>
                          )}

                          {isActive && (
                            <motion.div
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="text-cyan-400"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </motion.div>
                          )}
                        </Link>
                      )}
                    </motion.div>

                    {/* Submenu */}
                    <AnimatePresence>
                      {hasChildren && isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-6 mt-2 space-y-2 border-l border-cyan-500/20 pl-4">
                            {item.children?.map((child, childIndex) => {
                              const isChildActive = location.pathname === child.to;
                              return (
                                <motion.div
                                  key={child.to}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: childIndex * 0.05 }}
                                >
                                  <Link
                                    to={child.to}
                                    className={cn(
                                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                                      isChildActive
                                        ? 'text-cyan-400 font-medium'
                                        : 'text-muted-foreground hover:text-cyan-300'
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        'h-1.5 w-1.5 rounded-full transition-all duration-200',
                                        isChildActive
                                          ? 'bg-cyan-400 shadow-lg shadow-cyan-500/50'
                                          : 'bg-muted'
                                      )}
                                    />
                                    {child.label}
                                  </Link>
                                </motion.div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-cyan-500/10 space-y-3">
        {/* User Profile Card */}
        <div className="rounded-xl bg-gradient-to-br from-card/50 to-background/50 p-4 border border-cyan-500/10 relative overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-full blur-2xl" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="relative">
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center text-primary-foreground text-sm font-bold shadow-lg neon-glow-cyan gap-2">
                AD
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-background shadow-lg shadow-emerald-500/50" />
            </div>
            <div className="flex-1 min-w-0 gap-4">
              <p className="text-sm font-semibold text-foreground truncate">Admin User</p>
              <p className="text-xs text-cyan-400/70 truncate">admin@tripalfa.com</p>
            </div>
            <Button
              variant="outline"
              size="default"
              className="p-2 rounded-lg text-muted-foreground hover:text-cyan-400 hover:/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
