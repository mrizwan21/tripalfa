import React from 'react';
import {
    TrendingUp,
    Percent,
    Settings,
    Tag,
    Plane,
    LayoutDashboard,
    Plus,
    ShieldCheck,
    CloudSun,
    HandCoins,
    TicketPercent,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/Badge';
import { MarkupManagement } from './MarkupManagement.tsx';
import { WhitelabelCommission } from './WhitelabelCommission.tsx';
import { SupplierCommission } from './SupplierCommission.tsx';
import { DiscountCoupons } from './DiscountCoupons.tsx';
import { AirlineDeals } from './AirlineDeals.tsx';

import { useParams, useNavigate } from 'react-router-dom';

export function RulesManagementPage() {
    const { tab } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = React.useState(tab || 'markup');

    React.useEffect(() => {
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [tab]);

    const handleTabChange = (val: string) => {
        setActiveTab(val);
        navigate(`/rules/${val}`);
    };

    const stats = [
        { label: 'Active Markups', value: '24', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Active Coupons', value: '12', icon: TicketPercent, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Airline Deals', value: '08', icon: Plane, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Pending Settl.', value: '$4.2k', icon: HandCoins, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900">Rule Management</h1>
                        <p className="text-gray-500 mt-1">Configure pricing, commissions, and promotional rules</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="rounded-xl h-11 border-gray-200 font-bold">
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Audit Logs
                        </Button>
                        <Button className="rounded-xl h-11 bg-gray-900 hover:bg-primary font-bold">
                            <Plus className="h-4 w-4 mr-2" />
                            New Rule
                        </Button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {stats.map((stat) => (
                        <Card key={stat.label} className="border-none shadow-lg rounded-2xl overflow-hidden">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                                    <h3 className="text-2xl font-black text-gray-900 mt-1">{stat.value}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Tabbed Navigation */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="bg-white rounded-2xl shadow-xl p-1.5 border border-gray-100 grid grid-cols-5 gap-1 mb-6">
                        <TabsTrigger value="markup" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white font-bold py-3">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Markups
                        </TabsTrigger>
                        <TabsTrigger value="whitelabel" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white font-bold py-3">
                            <Percent className="h-4 w-4 mr-2" />
                            Whitelabel
                        </TabsTrigger>
                        <TabsTrigger value="supplier" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white font-bold py-3">
                            <HandCoins className="h-4 w-4 mr-2" />
                            Supplier Comm.
                        </TabsTrigger>
                        <TabsTrigger value="coupons" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white font-bold py-3">
                            <TicketPercent className="h-4 w-4 mr-2" />
                            Coupons
                        </TabsTrigger>
                        <TabsTrigger value="deals" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white font-bold py-3">
                            <Zap className="h-4 w-4 mr-2" />
                            Airline Deals
                        </TabsTrigger>
                    </TabsList>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <TabsContent value="markup" className="mt-0">
                            <MarkupManagement />
                        </TabsContent>
                        <TabsContent value="whitelabel" className="mt-0">
                            <WhitelabelCommission />
                        </TabsContent>
                        <TabsContent value="supplier" className="mt-0">
                            <SupplierCommission />
                        </TabsContent>
                        <TabsContent value="coupons" className="mt-0">
                            <DiscountCoupons />
                        </TabsContent>
                        <TabsContent value="deals" className="mt-0">
                            <AirlineDeals />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}

export default RulesManagementPage;
