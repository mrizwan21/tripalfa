import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Building2,
    Plus,
    Search,
    Filter,
    Box,
    ClipboardList,
    BarChart3,
    Settings2,
    Globe,
    ShieldCheck,
    Zap,
    Activity
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { SupplierList } from './components/SupplierList';
import { ApiVendorConfig } from './components/ApiVendorConfig';
import { ContractList } from './components/ContractList';
import { SupplierRegistrationForm } from './components/SupplierRegistrationForm';
import { ApiOnboardingForm } from './components/ApiOnboardingForm';

export function SupplierManagementPage() {
    const { tab } = useParams<{ tab: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(tab || 'suppliers');
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [isApiOnboardOpen, setIsApiOnboardOpen] = useState(false);

    useEffect(() => {
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [tab]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        navigate(`/suppliers/${value}`);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-secondary-900 tracking-tight dark:text-white">Supplier Hub</h1>
                    <p className="text-secondary-500 mt-2 font-medium">Coordinate GDS, API partners, and local supplier lifecycles.</p>
                </div>
                <Button
                    onClick={() => setIsRegisterOpen(true)}
                    className="h-12 bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 rounded-2xl shadow-lg shadow-primary-600/20 transition-all active:scale-95" > <Plus className="mr-2 h-5 w-5" />
                    Onboard Supplier
                </Button>
            </div>

            {/* High Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Active Suppliers', value: '24', icon: Building2, color: 'blue', detail: 'Across 8 categories' },
                    { label: 'API Integrity', value: '99.9%', icon: Zap, color: 'emerald', detail: 'System-wide health' },
                    { label: 'Pending Contracts', value: '7', icon: ClipboardList, color: 'amber', detail: 'Awaiting signature' },
                    { label: 'Monthly Volume', value: '$2.4M', icon: Activity, color: 'indigo', detail: 'Processed through partners' },
                ].map((stat) => (
                    <Card key={stat.label} className="border-none shadow-xl shadow-secondary-100/50 bg-white dark:bg-secondary-900 overflow-hidden group hover:shadow-2xl transition-all">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">{stat.label}</p>
                                <h3 className="text-2xl font-black text-secondary-900 dark:text-white mt-1">{stat.value}</h3>
                                <p className="text-[10px] font-bold text-secondary-500 mt-1">{stat.detail}</p>
                            </div>
                            <div className={`h-12 w-12 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 dark:bg-${stat.color}-900/20 dark:text-${stat.color}-400 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Tabs Container */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                    <TabsList className="bg-secondary-100/80 dark:bg-secondary-900/80 backdrop-blur-xl rounded-2xl p-1.5 shadow-xl border border-secondary-200 dark:border-secondary-800 flex gap-1">
                        <TabsTrigger
                            value="suppliers"
                            className="rounded-xl flex items-center gap-2 px-6 py-2.5 font-bold data-[state=active]:bg-secondary-900 data-[state=active]:text-white dark:data-[state=active]:bg-primary-600"
                        >
                            <Building2 size={16} />
                            Suppliers
                        </TabsTrigger>
                        <TabsTrigger
                            value="vendors"
                            className="rounded-xl flex items-center gap-2 px-6 py-2.5 font-bold data-[state=active]:bg-secondary-900 data-[state=active]:text-white dark:data-[state=active]:bg-primary-600"
                        >
                            <Globe size={16} />
                            API Vendors
                        </TabsTrigger>
                        <TabsTrigger
                            value="contracts"
                            className="rounded-xl flex items-center gap-2 px-6 py-2.5 font-bold data-[state=active]:bg-secondary-900 data-[state=active]:text-white dark:data-[state=active]:bg-primary-600"
                        >
                            <ShieldCheck size={16} />
                            Contracts
                        </TabsTrigger>
                        <TabsTrigger
                            value="analytics"
                            className="rounded-xl flex items-center gap-2 px-6 py-2.5 font-bold data-[state=active]:bg-secondary-900 data-[state=active]:text-white dark:data-[state=active]:bg-primary-600"
                        >
                            <BarChart3 size={16} />
                            Performance
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                            <Input
                                placeholder="Search suppliers, IDs..."
                                className="pl-10 h-11 bg-white dark:bg-secondary-900 border-secondary-100 dark:border-secondary-800 rounded-xl focus:ring-primary-500/20"
                            />
                        </div>
                        <Button variant="outline" className="h-11 rounded-xl border-secondary-100 dark:border-secondary-800 font-bold gap-2">
                            <Filter size={16} />
                            Filters
                        </Button>
                    </div>
                </div>

                <TabsContent value="suppliers" className="focus-visible:outline-none">
                    <SupplierList />
                </TabsContent>

                <TabsContent value="vendors" className="focus-visible:outline-none">
                    <ApiVendorConfig onAdd={() => setIsApiOnboardOpen(true)} />
                </TabsContent>

                <TabsContent value="contracts" className="focus-visible:outline-none">
                    <ContractList />
                </TabsContent>

                <TabsContent value="analytics" className="focus-visible:outline-none">
                    <div className="flex flex-col items-center justify-center p-20 text-center bg-white dark:bg-secondary-950 rounded-[2.5rem] border border-secondary-100 dark:border-secondary-800">
                        <div className="h-20 w-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6 text-indigo-600">
                            <BarChart3 size={40} />
                        </div>
                        <h3 className="text-xl font-black text-secondary-900 dark:text-white mb-2">Partner Insights</h3>
                        <p className="text-secondary-500 max-w-sm">Advanced performance metrics and revenue tracking will be available here soon.</p>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Modals */}
            <SupplierRegistrationForm
                open={isRegisterOpen}
                onOpenChange={setIsRegisterOpen}
            />

            <ApiOnboardingForm
                open={isApiOnboardOpen}
                onOpenChange={setIsApiOnboardOpen}
            />
        </div>
    );
}
