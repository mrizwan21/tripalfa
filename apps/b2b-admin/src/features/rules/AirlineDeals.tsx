import React from 'react';
import {
    Plane,
    Search,
    Plus,
    TrendingUp,
    MapPin,
    Calendar,
    ArrowRight,
    Zap,
    ShieldCheck,
    Star,
    Globe,
    Briefcase,
    ExternalLink,
    Tag
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface AirlineDeal {
    id: string;
    airline: string;
    airlineCode: string;
    dealName: string;
    dealType: 'Private Fare' | 'NDC Special' | 'Corporate' | 'Group';
    route: string;
    discount: string;
    validUntil: string;
    status: 'Active' | 'Pending Approval';
}

export function AirlineDeals() {
    const deals: AirlineDeal[] = [
        { id: '1', airline: 'Emirates', airlineCode: 'EK', dealName: 'Europe Seasonal Private', dealType: 'Private Fare', route: 'DXB → LHR/CDG', discount: '15% Off', validUntil: '2024-06-30', status: 'Active' },
        { id: '2', airline: 'Qatar Airways', airlineCode: 'QR', dealName: 'NDC Exclusive Asia', dealType: 'NDC Special', route: 'DOH → BKK/SIN', discount: '$120 Fixed', validUntil: '2024-05-15', status: 'Active' },
        { id: '3', airline: 'Etihad', airlineCode: 'EY', dealName: 'Global Corporate Deal', dealType: 'Corporate', route: 'All Network', discount: '12% Base', validUntil: '2024-12-31', status: 'Pending Approval' },
        { id: '4', airline: 'Singapore Airlines', airlineCode: 'SQ', dealName: 'Group Incentive Program', dealType: 'Group', route: 'SIN → Global', discount: 'Tiered', validUntil: '2024-09-01', status: 'Active' },
    ];

    return (
        <div className="space-y-8">
            {/* Featured Insight */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 border-none shadow-xl rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-800 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                        <Plane className="h-48 w-48 -rotate-45" />
                    </div>
                    <div className="relative space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                <Star className="h-5 w-5 text-yellow-300" />
                            </div>
                            <h2 className="text-2xl font-black">EK Special Private Fares</h2>
                        </div>
                        <p className="text-blue-100 max-w-lg leading-relaxed font-medium">
                            Your active private fare with Emirates (EK) for the DXB-London route is outperforming public fares by 18%. Consider boosting visibility for this route.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/10">
                                <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Active Bookings</p>
                                <p className="text-2xl font-black mt-1">1,240</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/10">
                                <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Saved Amount</p>
                                <p className="text-2xl font-black mt-1">$45.6k</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-900 p-8 text-white flex flex-col justify-between">
                    <div className="space-y-4">
                        <Zap className="h-10 w-10 text-primary" />
                        <h3 className="text-xl font-black leading-tight">Sync New NDC Deals</h3>
                        <p className="text-indigo-200 text-sm font-medium">Fetch the latest exclusive offers directly from airline NDC pipes.</p>
                    </div>
                    <Button className="w-full h-14 rounded-2xl bg-primary text-white font-black text-lg gap-2 shadow-xl shadow-primary/20 mt-6 border-none">
                        Sync Now <ExternalLink className="h-5 w-5" />
                    </Button>
                </Card>
            </div>

            {/* Main Deals Grid */}
            <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-white">
                <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row gap-6 justify-between items-center">
                    <div>
                        <h4 className="text-xl font-black text-gray-900">Airline Private Deals</h4>
                        <p className="text-sm text-gray-500 font-medium">Manage special fares and inventory overrides</p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Search deal name or route..." className="pl-10 h-12 rounded-2xl border-gray-100" />
                        </div>
                        <Button className="h-12 rounded-2xl bg-gray-900 px-6 font-bold shadow-lg shadow-gray-200">
                            <Plus className="h-4 w-4 mr-2" /> Push Deal
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-100">
                    {deals.map((deal) => (
                        <div key={deal.id} className="bg-white p-8 group hover:bg-gray-50/80 transition-all duration-300">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center font-black text-gray-900 text-xl border border-gray-100 shadow-sm group-hover:bg-white group-hover:scale-110 transition-transform">
                                        {deal.airlineCode}
                                    </div>
                                    <div>
                                        <h5 className="text-lg font-black text-gray-900 leading-tight">{deal.dealName}</h5>
                                        <p className="text-sm font-bold text-gray-400">{deal.airline}</p>
                                    </div>
                                </div>
                                <Badge className={`rounded-full px-4 py-1 border-none font-bold text-[10px] uppercase tracking-widest ${deal.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {deal.status}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100/50">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                        <MapPin className="h-3 w-3" /> Applicability
                                    </p>
                                    <p className="text-sm font-black text-gray-900">{deal.route}</p>
                                </div>
                                <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                                    <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                        <Tag className="h-3 w-3" /> Special Benefit
                                    </p>
                                    <p className="text-sm font-black text-primary uppercase leading-tight">{deal.discount}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                        {deal.dealType === 'Corporate' ? <Briefcase className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                                        {deal.dealType}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                        <Calendar className="h-4 w-4" />
                                        Expiry: {new Date(deal.validUntil).toLocaleDateString()}
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="h-10 rounded-xl font-bold text-gray-900 group/btn bg-gray-100/50 hover:bg-gray-100">
                                    View Rules <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
