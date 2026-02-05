import React from 'react';
import {
    Plus,
    Search,
    TicketPercent,
    Calendar,
    Users,
    Copy,
    CheckCircle2,
    XCircle,
    Clock,
    Zap,
    Tag,
    ArrowRight,
    MousePointer2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface Coupon {
    id: string;
    code: string;
    discount: string;
    type: 'Percentage' | 'Fixed';
    minAmount: string;
    usageLimit: number;
    currentUsage: number;
    expiry: string;
    status: 'Active' | 'Expired' | 'Scheduled';
}

export function DiscountCoupons() {
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const coupons: Coupon[] = [
        { id: '1', code: 'WANDER2024', discount: '10', type: 'Percentage', minAmount: '500', usageLimit: 1000, currentUsage: 450, expiry: '2024-12-31', status: 'Active' },
        { id: '2', code: 'DXBFIRST', discount: '50', type: 'Fixed', minAmount: '200', usageLimit: 500, currentUsage: 498, expiry: '2024-06-30', status: 'Active' },
        { id: '3', code: 'RAMADAN24', discount: '15', type: 'Percentage', minAmount: '1000', usageLimit: 200, currentUsage: 200, expiry: '2024-04-10', status: 'Expired' },
        { id: '4', code: 'SUMMERFLY', discount: '5', type: 'Percentage', minAmount: '0', usageLimit: 5000, currentUsage: 0, expiry: '2024-09-01', status: 'Scheduled' },
    ];

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success(`Code ${code} copied to clipboard`);
    };

    return (
        <div className="space-y-8">
            {/* Search and Action */}
            <div className="flex justify-between items-center">
                <div className="relative w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search coupons by code or campaign..." className="pl-10 h-11 rounded-xl border-gray-200" />
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="rounded-xl h-11 bg-gray-900 hover:bg-primary font-bold px-6 shadow-lg shadow-gray-200">
                    <Plus className="h-4 w-4 mr-2" /> Create Campaign
                </Button>
            </div>

            {/* Coupon Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map((coupon) => (
                    <Card key={coupon.id} className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white group hover:-translate-y-1 transition-all duration-300">
                        <div className={`h-3 ${coupon.status === 'Active' ? 'bg-green-500' : coupon.status === 'Scheduled' ? 'bg-blue-500' : 'bg-red-400'}`} />
                        <CardContent className="p-6 space-y-6">
                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${coupon.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <TicketPercent className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-900">{coupon.code}</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{coupon.status}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 hover:bg-gray-100" onClick={() => copyCode(coupon.code)}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Discount Details */}
                            <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-100/50">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Discount</p>
                                    <p className="text-2xl font-black text-gray-900 leading-none mt-1">
                                        {coupon.type === 'Fixed' ? '$' : ''}{coupon.discount}{coupon.type === 'Percentage' ? '%' : ''}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Min. Spend</p>
                                    <p className="text-lg font-black text-gray-900 leading-none mt-1">${coupon.minAmount}</p>
                                </div>
                            </div>

                            {/* Usage Stats */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Users className="h-3 w-3" /> {coupon.currentUsage} Redeemed
                                    </div>
                                    <span>{Math.round((coupon.currentUsage / coupon.usageLimit) * 100)}% Used</span>
                                </div>
                                <Progress value={(coupon.currentUsage / coupon.usageLimit) * 100} className={`h-2 rounded-full ${coupon.status === 'Active' ? 'bg-green-50' : 'bg-gray-100'}`} />
                                <p className="text-[10px] font-bold text-gray-400 text-center">Limit: {coupon.usageLimit.toLocaleString()} redemptions</p>
                            </div>

                            {/* Footer */}
                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>Expires: {new Date(coupon.expiry).toLocaleDateString()}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 rounded-lg font-bold text-primary group/btn hover:bg-primary/5">
                                    Analytics <ArrowRight className="h-3 w-3 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Create New Card */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="border-4 border-dashed border-gray-100 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-4 group transition-all duration-300 hover:border-primary/20 hover:bg-primary/5" > <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-primary transition-all shadow-inner">
                        <Plus className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-black text-gray-900">New Coupon Hub</p>
                        <p className="text-xs text-gray-400 font-medium">Create a new marketing campaign</p>
                    </div>
                </button>
            </div>

            {/* Placeholder for Schedule View */}
            <Card className="border-none shadow-lg rounded-3xl bg-gray-900 text-white p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Zap className="h-32 w-32" />
                </div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative">
                    <div className="space-y-2">
                        <Badge className="bg-primary/20 text-primary border-none font-bold px-3 py-1">Strategy Insight</Badge>
                        <h3 className="text-2xl font-black">Ready for the Holiday Season?</h3>
                        <p className="text-gray-400 text-sm max-w-md">Our data shows coupons with "percentage" discounts have a 24% higher conversion rate for last-minute hotel bookings.</p>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" className="rounded-xl border-white/20 text-white hover:bg-white/10 font-bold h-12 px-6">View Historical Data</Button>
                        <Button className="rounded-xl bg-primary text-white font-bold h-12 px-8 shadow-xl shadow-primary/20 border-none">Draft Strategy</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
