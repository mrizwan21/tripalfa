import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@tripalfa/ui-components/ui/card";
import { Button } from "@tripalfa/ui-components/ui/button";
import { Badge } from "@tripalfa/ui-components/ui/badge";
import { Overview } from "@/features/dashboard/components/Overview";
import { RecentSales } from "@/features/dashboard/components/RecentSales";
import { motion } from "framer-motion";
import { cn } from "@tripalfa/shared-utils/utils";
import * as Icons from 'lucide-react';

const {
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowRight,
  MoreHorizontal,
  Car,
  Users,
  CreditCard,
  Wallet,
  MapPin,
  Clock,
  Activity,
  Star,
  Zap,
  Sparkles,
} = Icons as any;
import { useState } from "react";

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: any;
  description: string;
  color: "cyan" | "emerald" | "amber" | "rose" | "purple";
  index: number;
}

const colorVariants = {
  cyan: {
    bg: "from-cyan-400 to-blue-500",
    light: "bg-cyan-500/10",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
    glow: "shadow-cyan-500/25",
    gradient: "from-cyan-500/10 to-blue-500/10",
  },
  emerald: {
    bg: "from-emerald-400 to-teal-500",
    light: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/25",
    gradient: "from-emerald-500/10 to-teal-500/10",
  },
  amber: {
    bg: "from-amber-400 to-orange-500",
    light: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    glow: "shadow-amber-500/25",
    gradient: "from-amber-500/10 to-orange-500/10",
  },
  rose: {
    bg: "from-rose-400 to-pink-500",
    light: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/30",
    glow: "shadow-rose-500/25",
    gradient: "from-rose-500/10 to-pink-500/10",
  },
  purple: {
    bg: "from-purple-400 to-violet-500",
    light: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/30",
    glow: "shadow-purple-500/25",
    gradient: "from-purple-500/10 to-violet-500/10",
  },
};

function StatCard({ title, value, change, trend, icon: Icon, description, color, index }: StatCardProps) {
  const colors = colorVariants[color];
  const TrendIcon = trend === "up" ? ArrowUpRight : ArrowRight;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -4 }}
    >
      <Card className="relative overflow-hidden border-cyan-500/10 bg-gradient-to-br from-[#111827]/80 to-[#0a0e17]/90 hover:border-cyan-500/30 transition-all duration-300 group">
        {/* Gradient background on hover */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          colors.gradient
        )} />

        {/* Glow effect on hover */}
        <div className={cn(
          "absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl",
          `bg-gradient-to-r ${colors.bg}`
        )} style={{ filter: 'blur(20px)', opacity: 0.1 }} />

        <CardHeader className="flex flex-row items-center justify-between pb-3 relative">
          <CardTitle className="text-sm font-medium text-slate-400">{title}</CardTitle>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg relative overflow-hidden",
              colors.bg,
              colors.glow
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
            <Icon className="h-5 w-5 text-white relative z-10" />
          </motion.div>
        </CardHeader>

        <CardContent className="relative">
          <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
          <div className="flex items-center gap-2 mt-2">
            <div className={cn(
              "flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium border",
              trend === "up" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border-rose-500/30"
            )}>
              <TrendIcon className="h-3 w-3" />
              {change}
            </div>
            <span className="text-xs text-slate-500">{description}</span>
          </div>

          {/* Mini chart decoration */}
          <div className="absolute bottom-0 right-0 opacity-20">
            <svg width="100" height="40" viewBox="0 0 100 40">
              <path
                d={trend === "up"
                  ? "M0 35 L20 30 L40 32 L60 20 L80 25 L100 5"
                  : "M0 10 L20 15 L40 12 L60 25 L80 20 L100 35"
                }
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className={trend === "up" ? "text-cyan-400" : "text-rose-400"}
              />
            </svg>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Activity Feed Component
const activities = [
  { id: 1, user: "John Doe", action: "created a new booking", time: "2 min ago", icon: Car, color: "cyan" },
  { id: 2, user: "Sarah Smith", action: "completed payment", time: "5 min ago", icon: CreditCard, color: "emerald" },
  { id: 3, user: "Mike Johnson", action: "updated profile", time: "12 min ago", icon: Users, color: "purple" },
  { id: 4, user: "Emily Brown", action: "cancelled booking", time: "25 min ago", icon: Calendar, color: "rose" },
];

// Quick Stats Row
const quickStats = [
  { label: "Active Trips", value: "24", icon: Car, color: "cyan" },
  { label: "Online Users", value: "156", icon: Users, color: "emerald" },
  { label: "Pending", value: "8", icon: Clock, color: "amber" },
  { label: "Rating", value: "4.8", icon: Star, color: "purple" },
];

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState("today");

  const stats = [
    {
      title: "Total Revenue",
      value: "$84,232.50",
      change: "+12.5%",
      trend: "up" as const,
      icon: Wallet,
      description: "vs last month",
      color: "cyan" as const,
    },
    {
      title: "Total Bookings",
      value: "1,429",
      change: "+8.2%",
      trend: "up" as const,
      icon: Car,
      description: "vs last month",
      color: "emerald" as const,
    },
    {
      title: "Active Users",
      value: "3,842",
      change: "+5.1%",
      trend: "up" as const,
      icon: Users,
      description: "vs last month",
      color: "purple" as const,
    },
    {
      title: "Avg. Trip Value",
      value: "$58.90",
      change: "-2.3%",
      trend: "down" as const,
      icon: CreditCard,
      description: "vs last month",
      color: "amber" as const,
    },
  ];

  return (
    <div className="flex-1 space-y-6 relative">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10"
      >
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Zap className="h-7 w-7 text-cyan-400" />
            Welcome back, Admin!
          </h2>
          <p className="text-cyan-400/60 mt-1">
            Here's what's happening with your business today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#111827]/50 rounded-xl border border-cyan-500/10 p-1">
            {["today", "week", "month", "year"].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200",
                  dateRange === range
                    ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30"
                    : "text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/5"
                )}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-2 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/5 hover:border-cyan-500/40 bg-transparent">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Quick Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10"
      >
        {quickStats.map((stat, index) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 p-4 bg-gradient-to-br from-[#111827]/50 to-[#0a0e17]/50 rounded-xl border border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-300 group"
          >
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg border transition-all duration-300",
              stat.color === "cyan" && "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 group-hover:shadow-lg group-hover:shadow-cyan-500/20",
              stat.color === "emerald" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 group-hover:shadow-lg group-hover:shadow-emerald-500/20",
              stat.color === "amber" && "bg-amber-500/10 text-amber-400 border-amber-500/30 group-hover:shadow-lg group-hover:shadow-amber-500/20",
              stat.color === "purple" && "bg-purple-500/10 text-purple-400 border-purple-500/30 group-hover:shadow-lg group-hover:shadow-purple-500/20",
            )}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{stat.label}</p>
              <p className="text-lg font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 relative z-10">
        {stats.map((stat, index) => (
          <StatCard key={stat.title} {...stat} index={index} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7 relative z-10">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="lg:col-span-4"
        >
          <Card className="border-cyan-500/10 bg-gradient-to-br from-[#111827]/80 to-[#0a0e17]/90 overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-cyan-400" />
                    Revenue Overview
                  </CardTitle>
                  <CardDescription className="text-cyan-400/60">
                    Revenue performance over time
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12.5%
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Overview />
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity & Sales */}
        <div className="lg:col-span-3 space-y-6">
          {/* Recent Sales */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <Card className="border-cyan-500/10 bg-gradient-to-br from-[#111827]/80 to-[#0a0e17]/90">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-emerald-400" />
                      Recent Sales
                    </CardTitle>
                    <CardDescription className="text-cyan-400/60">
                      Latest transactions
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/5">
                    View all
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <RecentSales />
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Feed */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <Card className="border-cyan-500/10 bg-gradient-to-br from-[#111827]/80 to-[#0a0e17]/90">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-purple-400" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription className="text-cyan-400/60">
                      Latest actions on the platform
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="flex items-start gap-3 group"
                    >
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg shrink-0 border transition-all duration-300",
                        activity.color === "cyan" && "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 group-hover:shadow-lg group-hover:shadow-cyan-500/20",
                        activity.color === "emerald" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 group-hover:shadow-lg group-hover:shadow-emerald-500/20",
                        activity.color === "purple" && "bg-purple-500/10 text-purple-400 border-purple-500/30 group-hover:shadow-lg group-hover:shadow-purple-500/20",
                        activity.color === "rose" && "bg-rose-500/10 text-rose-400 border-rose-500/30 group-hover:shadow-lg group-hover:shadow-rose-500/20",
                      )}>
                        <activity.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">
                          <span className="font-medium">{activity.user}</span>{" "}
                          <span className="text-slate-400">{activity.action}</span>
                        </p>
                        <p className="text-xs text-cyan-400/50 mt-0.5">{activity.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Bottom Info Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="grid gap-4 md:grid-cols-3 relative z-10"
      >
        {/* Quick Actions */}
        <Card className="border-cyan-500/10 bg-gradient-to-br from-[#111827]/80 to-[#0a0e17]/90">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start hover:bg-cyan-500/5 hover:border-cyan-500/30 hover:text-cyan-400 border-cyan-500/10 text-slate-300 bg-transparent" size="sm">
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
            <Button variant="outline" className="w-full justify-start hover:bg-emerald-500/5 hover:border-emerald-500/30 hover:text-emerald-400 border-cyan-500/10 text-slate-300 bg-transparent" size="sm">
              <CreditCard className="mr-2 h-4 w-4" />
              View Transactions
            </Button>
            <Button variant="outline" className="w-full justify-start hover:bg-amber-500/5 hover:border-amber-500/30 hover:text-amber-400 border-cyan-500/10 text-slate-300 bg-transparent" size="sm">
              <Activity className="mr-2 h-4 w-4" />
              System Status
            </Button>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="border-cyan-500/10 bg-gradient-to-br from-[#111827]/80 to-[#0a0e17]/90">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/50" />
                <span className="text-sm text-slate-300">API Status</span>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                Operational
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/50" />
                <span className="text-sm text-slate-300">Database</span>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                Healthy
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-500/50" />
                <span className="text-sm text-slate-300">Services</span>
              </div>
              <span className="text-sm font-medium text-cyan-400">99.9%</span>
            </div>
            <div className="pt-2 border-t border-cyan-500/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Last check: 2 min ago</span>
                <Button variant="ghost" size="sm" className="h-auto py-0 px-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/5">
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Stats */}
        <Card className="border-cyan-500/10 bg-gradient-to-br from-[#111827]/80 to-[#0a0e17]/90">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-purple-400" />
              Top Locations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { city: "New York", trips: 452, percent: 85 },
              { city: "Los Angeles", trips: 328, percent: 65 },
              { city: "Chicago", trips: 245, percent: 48 },
            ].map((location) => (
              <div key={location.city} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-300">{location.city}</span>
                  </div>
                  <span className="text-sm font-medium text-cyan-400">{location.trips} trips</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden border border-cyan-500/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${location.percent}%` }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full shadow-lg shadow-cyan-500/30"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
