import React from 'react';
import {
    Building2,
    Search,
    MoreVertical,
    TrendingUp,
    ArrowUpRight,
    Target,
    Award,
    CircleDollarSign,
    ChevronRight,
    ShieldCheck,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';

interface SupplierComm {
    id: string;
    name: string;
    type: 'GDS' | 'NDC' | 'Aggregator' | 'Direct';
    baseComm: string;
    plbRate: string;
    targetAchieved: number;
    earnings: string;
}

export function SupplierCommission() {
    const [searchQuery, setSearchQuery] = React.useState('');

    const suppliers: SupplierComm[] = [
        { id: '1', name: 'Amadeus', type: 'GDS', baseComm: '1.5%', plbRate: '0.5%', targetAchieved: 85, earnings: '42,400' },
        { id: '2', name: 'Emirates Direct', type: 'NDC', baseComm: '2.0%', plbRate: '1.0%', targetAchieved: 92, earnings: '18,200' },
        { id: '3', name: 'Hotelbeds', type: 'Aggregator', baseComm: '12.0%', plbRate: '2.0%', targetAchieved: 60, earnings: '85,400' },
        { id: '4', name: 'Saber', type: 'GDS', baseComm: '1.2%', plbRate: '0.4%', targetAchieved: 45, earnings: '12,100' },
    ];

    return (
        <div className="space-y-6">
            {/* Target Tracking */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-xl rounded-3xl p-6 bg-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-6">
                        <Target className="h-16 w-16 text-indigo-50 opacity-50" />
                    </div>
                    <div className="space-y-6 relative">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-xl font-black text-gray-900">Quarterly PLB Target</h4>
                                <p className="text-sm text-gray-500 font-medium">Achieve $1.2M volume for Amadeus override</p>
                            </div>
                            <Badge className="bg-indigo-600 text-white rounded-lg px-3 py-1 font-bold">Q1 2024</Badge>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold">
                                <span className="text-indigo-600">$845,000 Reach</span>
                                <span className="text-gray-400">$1,200,000 Target</span>
                            </div>
                            <Progress value={70} className="h-3 rounded-full bg-indigo-50" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 pb-2">
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Payout</p>
                                <p className="text-xl font-black text-gray-900 mt-1">$12,400</p>
                            </div>
                            <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Estimated Bonus</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-xl font-black text-indigo-600 mt-1">$4,200</p>
                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 gap-4">
                    {suppliers.slice(0, 2).map(s => (
                        <Card key={s.id} className="border-none shadow-lg rounded-2xl p-5 bg-white flex items-center justify-between group hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-900 border border-gray-100 flex items-center justify-center font-black">
                                    {s.name[0]}
                                </div>
                                <div>
                                    <h5 className="font-black text-gray-900">{s.name} <span className="text-xs font-bold text-gray-400 ml-1">({s.type})</span></h5>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-[10px] font-black px-1.5 py-0 border-emerald-100 text-emerald-600 bg-emerald-50">
                                            COMM: {s.baseComm}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px] font-black px-1.5 py-0 border-indigo-100 text-indigo-600 bg-indigo-50">
                                            PLB: {s.plbRate}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">MTD Earnings</p>
                                <p className="text-xl font-black text-gray-900">${s.earnings}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Supplier List */}
            <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-white mt-8">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <h4 className="font-bold text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-gray-900" /> All Suppliers
                    </h4>
                    <div className="flex gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Search suppliers..." className="pl-10 h-10 w-64 rounded-xl border-gray-100" />
                        </div>
                        <Button className="rounded-xl h-10 bg-gray-900 hover:bg-primary font-bold">
                            <ShieldCheck className="h-4 w-4 mr-2" /> Verify Contracts
                        </Button>
                    </div>
                </div>
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="py-4 pl-6 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Supplier Partners</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Protocol</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Base Commission</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Performance Override</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Monthly Earnings</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Target Progress</TableHead>
                            <TableHead className="py-4 pr-6 text-right font-bold text-gray-500 uppercase text-[10px] tracking-widest">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {suppliers.map((s) => (
                            <TableRow key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                                <TableCell className="pl-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <p className="font-bold text-gray-900">{s.name}</p>
                                        {s.targetAchieved > 90 && <Award className="h-4 w-4 text-yellow-500" />}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="text-xs font-black text-gray-500">{s.type}</p>
                                </TableCell>
                                <TableCell>
                                    <span className="font-black text-gray-900">{s.baseComm}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 font-bold text-indigo-600">
                                        <TrendingUp className="h-4 w-4" /> {s.plbRate}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-black text-gray-900">${s.earnings}</span>
                                </TableCell>
                                <TableCell className="w-48">
                                    <div className="space-y-1.5 px-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                            <span>{s.targetAchieved}%</span>
                                            {s.targetAchieved < 50 && <AlertCircle className="h-3 w-3 text-orange-400" />}
                                        </div>
                                        <Progress value={s.targetAchieved} className={`h-1.5 rounded-full ${s.targetAchieved > 80 ? 'bg-emerald-50' : 'bg-gray-100'}`} />
                                    </div>
                                </TableCell>
                                <TableCell className="pr-6 text-right">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
