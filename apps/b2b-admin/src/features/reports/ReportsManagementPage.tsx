import React from 'react';
import {
    BarChart3,
    TrendingUp,
    Plane,
    Building2,
    DollarSign,
    FileText,
    Calendar,
    Download,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    PieChart as PieChartIcon,
    Map as MapIcon,
    ExternalLink,
    Zap
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    LineChart,
    Line,
    Cell,
    PieChart,
    Pie
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

const salesPerformanceData = [
    { month: 'Jan', revenue: 240000, target: 200000 },
    { month: 'Feb', revenue: 310000, target: 250000 },
    { month: 'Mar', revenue: 280000, target: 280000 },
    { month: 'Apr', revenue: 390000, target: 300000 },
    { month: 'May', revenue: 420000, target: 350000 },
    { month: 'Jun', revenue: 480000, target: 380000 },
];

const destinationData = [
    { name: 'Dubai', value: 40, color: '#4F46E5' },
    { name: 'London', value: 25, color: '#10B981' },
    { name: 'Singapore', value: 15, color: '#F59E0B' },
    { name: 'New York', value: 12, color: '#8B5CF6' },
    { name: 'Others', value: 8, color: '#9CA3AF' },
];

import { useParams, useNavigate } from 'react-router-dom';

export function ReportsManagementPage() {
    const { tab } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = React.useState(tab || 'sales');

    React.useEffect(() => {
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [tab]);

    const handleTabChange = (val: string) => {
        setActiveTab(val);
        navigate(`/reports/${val}`);
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 animate-in fade-in duration-700">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Intelligence & Analytics</h1>
                        <p className="text-gray-500 mt-1 font-medium">Data-driven insights for business growth and operational efficiency</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="rounded-xl h-11 border-gray-200 font-bold bg-white">
                            <Calendar className="h-4 w-4 mr-2" />
                            Last 30 Days
                        </Button>
                        <Button className="rounded-xl h-11 bg-gray-900 text-white font-bold hover:bg-primary shadow-lg shadow-gray-200">
                            <Download className="h-4 w-4 mr-2" />
                            Export Workspace
                        </Button>
                    </div>
                </div>

                {/* Report Tabs */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="bg-white rounded-2xl shadow-xl p-1.5 border border-gray-100 grid grid-cols-4 gap-1 mb-8 max-w-4xl">
                        <TabsTrigger value="sales" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white font-black py-3">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Sales Performance
                        </TabsTrigger>
                        <TabsTrigger value="bookings" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white font-black py-3">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Booking Analysis
                        </TabsTrigger>
                        <TabsTrigger value="financial" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white font-black py-3">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Financial Audits
                        </TabsTrigger>
                        <TabsTrigger value="custom" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white font-black py-3">
                            <FileText className="h-4 w-4 mr-2" />
                            Custom Builder
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="sales" className="mt-0 space-y-6">
                        {/* Sales Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="border-none shadow-lg rounded-[2rem] bg-indigo-600 text-white p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <TrendingUp className="h-32 w-32" />
                                </div>
                                <div className="relative">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-1">Total Sales (MTD)</p>
                                    <h3 className="text-4xl font-black">$2.84M</h3>
                                    <div className="mt-4 flex items-center gap-2">
                                        <Badge className="bg-white/20 text-white border-none font-bold">+18.5%</Badge>
                                        <span className="text-xs text-indigo-100 font-medium font-bold">vs last month</span>
                                    </div>
                                </div>
                            </Card>
                            <Card className="border-none shadow-lg rounded-[2rem] bg-white p-6 transition-all hover:shadow-xl">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Avg Transaction Value</p>
                                <h3 className="text-4xl font-black text-gray-900">$1,420</h3>
                                <div className="mt-4 flex items-center gap-2">
                                    <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold">+5.2%</Badge>
                                    <span className="text-xs text-gray-400 font-bold">Industry Avg: $1,280</span>
                                </div>
                            </Card>
                            <Card className="border-none shadow-lg rounded-[2rem] bg-white p-6 transition-all hover:shadow-xl">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Estimated Net Profit</p>
                                <h3 className="text-4xl font-black text-gray-900">$215,800</h3>
                                <div className="mt-4 flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest">
                                    Margin: 7.6%
                                </div>
                            </Card>
                        </div>

                        {/* Revenue Trends Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 border-none shadow-xl rounded-[2.5rem] bg-white p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-black text-gray-900">Revenue vs. Target</h3>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-indigo-600" />
                                            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Revenue</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-gray-200" />
                                            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Target</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={salesPerformanceData} barGap={12}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontWeight: 700 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontWeight: 700 }} tickFormatter={(v) => `$${v / 1000}k`} />
                                            <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                            <Bar dataKey="revenue" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                                            <Bar dataKey="target" fill="#E5E7EB" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8">
                                <h3 className="text-xl font-black text-gray-900 mb-8">Regional Demand</h3>
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={destinationData}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {destinationData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-8 space-y-3">
                                    {destinationData.map((dest) => (
                                        <div key={dest.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: dest.color }} />
                                                <span className="text-xs font-bold text-gray-600">{dest.name}</span>
                                            </div>
                                            <span className="text-xs font-black text-gray-900">{dest.value}%</span>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="outline" className="w-full mt-10 rounded-xl h-12 border-gray-100 font-bold text-primary group">
                                    Explore Map View
                                    <ExternalLink className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="bookings" className="mt-0">
                        <div className="bg-white p-20 rounded-[2.5rem] shadow-xl text-center border border-gray-100">
                            <div className="h-20 w-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-6">
                                <Plane className="h-10 w-10" />
                            </div>
                            <h2 className="text-3xl font-black text-gray-900">Demographic Insights Loading...</h2>
                            <p className="text-gray-500 max-w-md mx-auto mt-4 font-medium">We are currently processing behavior telemetry for over 50,000 unique travelers. Your multi-dimensional booking report will be available momentarily.</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="financial" className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-none shadow-lg rounded-[2.5rem] bg-gray-900 p-8 text-white">
                                <h3 className="text-xl font-black mb-6">Commission Spread Reconciler</h3>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Supplier Base</p>
                                            <p className="text-2xl font-black mt-1">$142,500</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Partner Payout</p>
                                            <p className="text-2xl font-black mt-1 text-emerald-400">$84,200</p>
                                        </div>
                                    </div>
                                    <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-400 w-[59%]" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-400 italic">Net Retention: 41% after disbursements</p>
                                </div>
                                <Button className="w-full mt-10 rounded-2xl h-14 bg-white text-gray-900 hover:bg-white/90 font-black shadow-xl shadow-indigo-900/50">
                                    Download Reconciliation Statement
                                </Button>
                            </Card>
                            <Card className="border-none shadow-lg rounded-[2.5rem] bg-white p-8 border border-gray-100">
                                <h3 className="text-xl font-black text-gray-900 mb-6">Loss/Refund Frequency</h3>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={salesPerformanceData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                            <XAxis dataKey="month" hide />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="revenue" stroke="#F43F5E" strokeWidth={3} dot={{ fill: '#F43F5E', r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-6">Recent Trends: -2.4% Refund Rate improvement</p>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="custom" className="mt-0">
                        <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col items-center justify-center p-20 border border-gray-100">
                            <div className="h-24 w-24 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-8 border border-amber-100 shadow-xl shadow-amber-50">
                                <Zap className="h-10 w-10 fill-amber-500" />
                            </div>
                            <h2 className="text-4xl font-black text-gray-900">Custom Query Builder</h2>
                            <p className="text-gray-500 text-center max-w-lg mt-6 text-lg font-medium leading-relaxed">Slice your data by 50+ dimensions including Airline, Region, Account Manager, and Payment Provider. Build your own proprietary reports with live pivot tables.</p>
                            <div className="mt-12 flex gap-4">
                                <Button className="h-14 px-10 rounded-2xl bg-gray-900 text-white font-black text-lg hover:bg-primary transition-all">Enable Lab Access</Button>
                                <Button variant="outline" className="h-14 px-10 rounded-2xl border-gray-100 font-bold text-gray-600">Watch Tutorial</Button>
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

export default ReportsManagementPage;
