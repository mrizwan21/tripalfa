import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Building2,
    Bed,
    DoorOpen,
    CalendarCheck,
    FileText,
    Lock,
    TrendingUp,
    Plus,
    Search,
    Filter
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

// Lazy load the sub-pages
const HotelListPage = React.lazy(() => import('./HotelListPage'));
const RoomTypeListPage = React.lazy(() => import('./RoomTypeListPage'));
const RoomsListPage = React.lazy(() => import('./RoomsListPage'));
const AllocationsListPage = React.lazy(() => import('./AllocationsListPage'));
const RoomContractsListPage = React.lazy(() => import('./RoomContractsListPage'));
const RevenueBlocksListPage = React.lazy(() => import('./RevenueBlocksListPage'));

const InventoryManagementPage: React.FC = () => {
    const { tab } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(tab || 'hotels');

    useEffect(() => {
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [tab]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        navigate(`/inventory/${value}`);
    };

    const tabs = [
        { id: 'hotels', label: 'Properties', icon: Building2 },
        { id: 'room-types', label: 'Room Types', icon: Bed },
        { id: 'rooms', label: 'Rooms', icon: DoorOpen },
        { id: 'allocations', label: 'Allocations', icon: CalendarCheck },
        { id: 'contracts', label: 'Contracts', icon: FileText },
        { id: 'revenue-blocks', label: 'Revenue Blocks', icon: Lock },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 animate-in fade-in duration-700">
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white flex items-center justify-center shadow-2xl shadow-indigo-200">
                            <Box className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Inventory Hub</h1>
                            <p className="text-gray-500 mt-1 font-medium">Coordinate global property supply, contracts, and revenue blocks</p>
                        </div>
                    </div>
                </div>

                {/* Dashboard Metrics Bar */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Properties</p>
                                <h3 className="text-2xl font-black text-gray-900 mt-1">1,248</h3>
                                <p className="text-emerald-500 text-[10px] font-bold mt-1 flex items-center">
                                    <TrendingUp className="h-3 w-3 mr-1" /> +12 this week
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Building2 className="h-6 w-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Rooms</p>
                                <h3 className="text-2xl font-black text-gray-900 mt-1">45.2k</h3>
                                <p className="text-emerald-500 text-[10px] font-bold mt-1 flex items-center">
                                    <TrendingUp className="h-3 w-3 mr-1" /> 92% Utilization
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Bed className="h-6 w-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending Contracts</p>
                                <h3 className="text-2xl font-black text-gray-900 mt-1">18</h3>
                                <p className="text-amber-500 text-[10px] font-bold mt-1 tracking-tight">Awaiting verification</p>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FileText className="h-6 w-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Revenue Blocks</p>
                                <h3 className="text-2xl font-black text-gray-900 mt-1">42</h3>
                                <p className="text-indigo-500 text-[10px] font-bold mt-1 tracking-tight">Locked for special events</p>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Lock className="h-6 w-6" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Primary Navigation */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl p-2 border border-white/20 grid grid-cols-2 lg:grid-cols-6 gap-2 mb-8">
                        {tabs.map((t) => (
                            <TabsTrigger
                                key={t.id}
                                value={t.id}
                                className="rounded-[1.5rem] data-[state=active]:bg-gray-900 data-[state=active]:text-white font-black py-4 transition-all duration-300" > <t.icon className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">{t.label}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="mt-2 min-h-[600px]">
                        <React.Suspense fallback={
                            <div className="flex items-center justify-center h-64">
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                            </div>
                        }>
                            <TabsContent value="hotels" className="outline-none focus:ring-0">
                                <HotelListPage />
                            </TabsContent>
                            <TabsContent value="room-types" className="outline-none focus:ring-0">
                                <RoomTypeListPage />
                            </TabsContent>
                            <TabsContent value="rooms" className="outline-none focus:ring-0">
                                <RoomsListPage />
                            </TabsContent>
                            <TabsContent value="allocations" className="outline-none focus:ring-0">
                                <AllocationsListPage />
                            </TabsContent>
                            <TabsContent value="contracts" className="outline-none focus:ring-0">
                                <RoomContractsListPage />
                            </TabsContent>
                            <TabsContent value="revenue-blocks" className="outline-none focus:ring-0">
                                <RevenueBlocksListPage />
                            </TabsContent>
                        </React.Suspense>
                    </div>
                </Tabs>
            </div>
        </div>
    );
};

export default InventoryManagementPage;
