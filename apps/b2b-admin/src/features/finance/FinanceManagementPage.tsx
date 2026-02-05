import React from 'react';
import {
    Wallet,
    ArrowRightLeft,
    Receipt,
    CheckCircle,
    DollarSign,
    TrendingUp,
    ArrowDownRight,
    ArrowUpRight,
    PieChart,
    Landmark,
    FileText
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletOverview } from './WalletOverview';
import { TransactionLedger } from './TransactionLedger';
import { InvoiceManagement } from './InvoiceManagement';
import { SettlementHub } from './SettlementHub';

import { useParams, useNavigate } from 'react-router-dom';

export function FinanceManagementPage() {
    const { tab } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = React.useState(tab || 'wallets');

    React.useEffect(() => {
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [tab]);

    const handleTabChange = (val: string) => {
        setActiveTab(val);
        navigate(`/finance/${val}`);
    };

    const stats = [
        { label: 'Total Float', value: '$840,250', icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50', change: '+12%', trend: 'up' },
        { label: 'Net Receivables', value: '$125,400', icon: ArrowDownRight, color: 'text-emerald-600', bg: 'bg-emerald-50', change: '-5%', trend: 'down' },
        { label: 'Pending Payouts', value: '$42,100', icon: CheckCircle, color: 'text-orange-600', bg: 'bg-orange-50', change: '+8%', trend: 'up' },
        { label: 'Total Revenue (MTD)', value: '$3.2M', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', change: '+18%', trend: 'up' },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900">Financial Hub</h1>
                        <p className="text-gray-500 mt-1">Global liquidity monitoring and accounting</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="rounded-xl h-11 border-gray-200 font-bold">
                            <FileText className="h-4 w-4 mr-2" />
                            Reports
                        </Button>
                        <Button className="rounded-xl h-11 bg-gray-900 hover:bg-primary font-bold shadow-lg shadow-gray-200/50">
                            <Landmark className="h-4 w-4 mr-2" />
                            Deposit Funds
                        </Button>
                    </div>
                </div>

                {/* Financial Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {stats.map((stat) => (
                        <Card key={stat.label} className="border-none shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-shadow bg-white">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start">
                                    <div className={`h-12 w-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                                        <stat.icon className="h-6 w-6" />
                                    </div>
                                    <div className={`flex items-center gap-1 text-xs font-bold ${stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'} bg-gray-50 px-2 py-1 rounded-lg`}>
                                        {stat.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                        {stat.change}
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                                    <h3 className="text-2xl font-black text-gray-900 mt-1">{stat.value}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Tabbed Navigation */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="bg-white rounded-2xl shadow-xl p-1.5 border border-gray-100 grid grid-cols-4 gap-1 mb-6">
                        <TabsTrigger value="wallets" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white font-bold py-3 transition-all">
                            <Wallet className="h-4 w-4 mr-2" />
                            Wallet & Accounts
                        </TabsTrigger>
                        <TabsTrigger value="ledger" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white font-bold py-3 transition-all">
                            <ArrowRightLeft className="h-4 w-4 mr-2" />
                            Transaction Ledger
                        </TabsTrigger>
                        <TabsTrigger value="invoices" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white font-bold py-3 transition-all">
                            <Receipt className="h-4 w-4 mr-2" />
                            Invoices & Billing
                        </TabsTrigger>
                        <TabsTrigger value="settlements" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white font-bold py-3 transition-all">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Settlements
                        </TabsTrigger>
                    </TabsList>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <TabsContent value="wallets" className="mt-0">
                            <WalletOverview />
                        </TabsContent>
                        <TabsContent value="ledger" className="mt-0">
                            <TransactionLedger />
                        </TabsContent>
                        <TabsContent value="invoices" className="mt-0">
                            <InvoiceManagement />
                        </TabsContent>
                        <TabsContent value="settlements" className="mt-0">
                            <SettlementHub />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}

export default FinanceManagementPage;
