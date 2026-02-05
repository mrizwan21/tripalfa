import React from 'react';
import {
    LayoutDashboard,
    TrendingUp,
    Users,
    Briefcase,
    Globe,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Zap,
    AlertCircle,
    ChevronRight,
    Plane,
    Building2,
    Package,
    ShieldCheck
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/progress';

const revenueData = [
    { name: 'Mon', revenue: 45000, profit: 5400 },
    { name: 'Tue', revenue: 52000, profit: 6200 },
    { name: 'Wed', revenue: 48000, profit: 5800 },
    { name: 'Thu', revenue: 61000, profit: 7400 },
    { name: 'Fri', revenue: 55000, profit: 6600 },
    { name: 'Sat', revenue: 67000, profit: 8100 },
    { name: 'Sun', revenue: 72000, profit: 8800 },
];

const serviceDistribution = [
    { name: 'Flights', value: 55, color: '#4F46E5' },
    { name: 'Hotels', value: 30, color: '#10B981' },
    { name: 'Packages', value: 15, color: '#F59E0B' },
];

const topAgencies = [
    { name: 'TravelPro Int.', revenue: 124000, bookings: 142, growth: 12 },
    { name: 'Global Wings', revenue: 98000, bookings: 110, growth: 8 },
    { name: 'Al Rayan Travels', revenue: 86000, bookings: 95, growth: -3 },
    { name: 'Skyline B2B', revenue: 74000, bookings: 82, growth: 15 },
];

export function ExecutiveDashboard() {
    return (
        <div className="min-h-screen bg-gray-50/50 p-6 animate-in fade-in duration-700">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            Executive View
                            <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-widest px-2 py-0.5">Live Data</Badge>
                        </h1>
                        <p className="text-gray-500 mt-1 font-medium">System performance and revenue analytics for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="rounded-xl h-12 px-6 border-gray-200 font-bold bg-white shadow-sm transition-all hover:bg-gray-50">
                            Download Report
                        </Button>
                        <Button className="rounded-xl h-12 px-6 bg-gray-900 hover:bg-primary font-bold shadow-xl shadow-gray-200 text-white transition-all transform hover:-translate-y-0.5">
                            <Zap className="h-4 w-4 mr-2" />
                            Force Sync
                        </Button>
                    </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white hover:shadow-2xl transition-all duration-300 group">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center transition-transform group-hover:scale-110 duration-500">
                                    <TrendingUp className="h-7 w-7" />
                                </div>
                                <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-black">
                                    <ArrowUpRight className="h-3 w-3" />
                                    14.2%
                                </div>
                            </div>
                            <div className="mt-5">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Gross Revenue</p>
                                <h3 className="text-3xl font-black text-gray-900 mt-1">$412,450</h3>
                                <div className="mt-4 flex items-center gap-2">
                                    <Progress value={78} className="h-1.5 flex-1 bg-gray-100" />
                                    <span className="text-[10px] font-bold text-gray-400">78% of Target</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white hover:shadow-2xl transition-all duration-300 group">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-110 duration-500">
                                    <Briefcase className="h-7 w-7" />
                                </div>
                                <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-black">
                                    <ArrowUpRight className="h-3 w-3" />
                                    8.5%
                                </div>
                            </div>
                            <div className="mt-5">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Bookings Count</p>
                                <h3 className="text-3xl font-black text-gray-900 mt-1">1,248</h3>
                                <div className="mt-4 flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white" />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400">+12 new today</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white hover:shadow-2xl transition-all duration-300 group">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center transition-transform group-hover:scale-110 duration-500">
                                    <Zap className="h-7 w-7" />
                                </div>
                                <div className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-lg text-xs font-black">
                                    <ArrowDownRight className="h-3 w-3" />
                                    2.1%
                                </div>
                            </div>
                            <div className="mt-5">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Conversion Rate</p>
                                <h3 className="text-3xl font-black text-gray-900 mt-1">4.2%</h3>
                                <p className="text-xs font-bold text-gray-400 mt-4 italic">Avg: 3.8% last month</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white hover:shadow-2xl transition-all duration-300 group">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="h-14 w-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center transition-transform group-hover:scale-110 duration-500 shadow-lg shadow-indigo-200">
                                    <ShieldCheck className="h-7 w-7" />
                                </div>
                                <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] px-2 py-0.5">Healthy</Badge>
                            </div>
                            <div className="mt-5">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">API Health</p>
                                <h3 className="text-3xl font-black text-gray-900 mt-1">99.9%</h3>
                                <div className="mt-4 flex items-center gap-1.5 h-1.5">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                        <div key={i} className="flex-1 bg-emerald-400 rounded-full h-full" />
                                    ))}
                                    <div className="flex-1 bg-gray-100 rounded-full h-full" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 border-none shadow-xl rounded-[2.5rem] bg-white p-8">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">Revenue Performance</h3>
                                <p className="text-gray-400 text-sm font-bold">Daily analytics for current week</p>
                            </div>
                            <div className="flex bg-gray-50 p-1 rounded-xl">
                                <Button size="sm" variant="ghost" className="rounded-lg h-8 px-4 font-bold text-primary bg-white shadow-sm">Revenue</Button>
                                <Button size="sm" variant="ghost" className="rounded-lg h-8 px-4 font-bold text-gray-400">Profit</Button>
                            </div>
                        </div>
                        <div className="h-[350px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontWeight: 700, fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontWeight: 700, fontSize: 12 }}
                                        tickFormatter={(v) => `$${v / 1000}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                                        cursor={{ stroke: '#4F46E5', strokeWidth: 2 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#4F46E5"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorRev)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8">
                        <div className="mb-8">
                            <h3 className="text-xl font-black text-gray-900">Service Line Split</h3>
                            <p className="text-gray-400 text-sm font-bold">Booking volume distribution</p>
                        </div>
                        <div className="h-[250px] w-full relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={serviceDistribution}
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {serviceDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-black text-gray-900">2.4k</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Srvs</span>
                            </div>
                        </div>
                        <div className="mt-8 space-y-4">
                            {serviceDistribution.map((item) => (
                                <div key={item.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-sm font-bold text-gray-600">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-black text-gray-900">{item.value}%</span>
                                        <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                            <div className="h-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Leaderboard & Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
                    <Card className="lg:col-span-2 border-none shadow-xl rounded-[2.5rem] bg-white p-8">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">Top Performing Agencies</h3>
                                <p className="text-gray-400 text-sm font-bold">Leaderboard based on MTD sales</p>
                            </div>
                            <Button variant="ghost" className="text-primary font-black text-sm">View All Rankings</Button>
                        </div>
                        <div className="space-y-6">
                            {topAgencies.map((agency, i) => (
                                <div key={agency.name} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-500">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 group-hover:text-primary transition-colors">{agency.name}</p>
                                            <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                                                <span>{agency.bookings} Bookings</span>
                                                <span className="h-1 w-1 rounded-full bg-gray-300" />
                                                <span className={agency.growth > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                                                    {agency.growth > 0 ? '+' : ''}{agency.growth}% growth
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-gray-900">${agency.revenue.toLocaleString()}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">MTD Sales</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden p-0">
                        <div className="p-8 pb-4">
                            <h3 className="text-xl font-black text-gray-900">Activity Stream</h3>
                            <p className="text-gray-400 text-sm font-bold">Real-time system events</p>
                        </div>
                        <div className="p-4 space-y-2 max-h-[480px] overflow-y-auto">
                            {[
                                { icon: Plane, color: 'text-indigo-600', bg: 'bg-indigo-50', text: 'New Flight Booking by TravelPro', time: '2m ago', ref: 'BK-10293' },
                                { icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50', text: 'Hotel Reservation Confirmed', time: '12m ago', ref: 'HT-88129' },
                                { icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', text: 'Markup Rule Updated (Global)', time: '45m ago', ref: 'RL-992' },
                                { icon: Package, color: 'text-purple-600', bg: 'bg-purple-50', text: 'Package Created: Dubai Summer', time: '1h ago', ref: 'PK-229' },
                                { icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', text: 'Payment Failed: BK-10288', time: '2h ago', ref: 'ERR' },
                                { icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', text: 'New Subagent Registered', time: '3h ago', ref: 'USR-882' },
                            ].map((activity, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                                    <div className={`h-10 w-10 rounded-xl ${activity.bg} ${activity.color} flex items-center justify-center shrink-0`}>
                                        <activity.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{activity.text}</p>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{activity.ref}</span>
                                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                                <Clock className="h-2.5 w-2.5" />
                                                {activity.time}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100">
                            <Button variant="ghost" className="w-full text-xs font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors">
                                View Full System Audit logs
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
export default ExecutiveDashboard;
