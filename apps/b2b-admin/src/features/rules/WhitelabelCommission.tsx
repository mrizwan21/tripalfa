import React from 'react';
import {
    Plus,
    Search,
    MoreVertical,
    HandCoins,
    Users,
    Calendar,
    ArrowUpRight,
    BarChart3,
    Wallet,
    Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CommissionRule {
    id: string;
    partnerName: string;
    partnerType: 'Whitelabel' | 'Subagent';
    commissionRate: string;
    settlementPeriod: 'Weekly' | 'Monthly' | 'Instant';
    totalEarnings: string;
    status: 'Active' | 'Paused';
}

export function WhitelabelCommission() {
    const [searchQuery, setSearchQuery] = React.useState('');

    const rules: CommissionRule[] = [
        { id: '1', partnerName: 'Global Travel Hub', partnerType: 'Whitelabel', commissionRate: '4.5%', settlementPeriod: 'Monthly', totalEarnings: '12,450', status: 'Active' },
        { id: '2', partnerName: 'Dubai Holiday Experts', partnerType: 'Subagent', commissionRate: '3.0%', settlementPeriod: 'Weekly', totalEarnings: '4,120', status: 'Active' },
        { id: '3', partnerName: 'Elite Vacations', partnerType: 'Whitelabel', commissionRate: '5.0%', settlementPeriod: 'Monthly', totalEarnings: '8,900', status: 'Paused' },
        { id: '4', partnerName: 'Budget Fly Agency', partnerType: 'Subagent', commissionRate: '2.5%', settlementPeriod: 'Instant', totalEarnings: '1,200', status: 'Active' },
    ];

    return (
        <div className="space-y-6">
            {/* Commission Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-700 to-indigo-900 text-white rounded-3xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <HandCoins className="h-32 w-32" />
                    </div>
                    <CardContent className="p-8 space-y-4">
                        <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-indigo-200 uppercase tracking-widest">Total Payouts (MTD)</p>
                            <h3 className="text-4xl font-black mt-1">$26,670</h3>
                        </div>
                        <div className="flex items-center gap-2 text-indigo-300 text-sm font-bold">
                            <ArrowUpRight className="h-4 w-4" />
                            <span>+18.5% from last month</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white rounded-3xl p-8 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Users className="h-6 w-6" />
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 border-none font-bold">42 Active Partners</Badge>
                    </div>
                    <div className="mt-6">
                        <p className="text-xs font-bold text-gray-500 uppercase">Avg. Commission Rate</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">3.8%</h3>
                    </div>
                </Card>

                <Card className="border-none shadow-xl bg-white rounded-3xl p-8 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-orange-600 font-bold hover:bg-orange-50">Settlement Hub</Button>
                    </div>
                    <div className="mt-6">
                        <p className="text-xs font-bold text-gray-500 uppercase">Pending Settlement</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">$4,120</h3>
                    </div>
                </Card>
            </div>

            {/* Rules & List */}
            <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-white">
                <CardHeader className="p-6 border-b border-gray-50 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <HandCoins className="h-5 w-5 text-indigo-600" />
                        Commission Configurations
                    </CardTitle>
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search partners..."
                                className="pl-10 h-10 w-64 rounded-xl border-gray-100"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button className="rounded-xl h-10 bg-gray-900 hover:bg-primary font-bold">
                            <Plus className="h-4 w-4 mr-2" /> Configure Partner
                        </Button>
                    </div>
                </CardHeader>
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="py-4 pl-6 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Partner Entities</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Partner Type</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Commission Rate</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Settlement</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Total Earned</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Status</TableHead>
                            <TableHead className="py-4 pr-6 text-right font-bold text-gray-500 uppercase text-[10px] tracking-widest">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rules.map((rule) => (
                            <TableRow key={rule.id} className="hover:bg-gray-50/50 transition-colors group">
                                <TableCell className="pl-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm">
                                            {rule.partnerName[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{rule.partnerName}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">ID: PART-{rule.id}024</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`rounded-lg font-bold border-none ${rule.partnerType === 'Whitelabel' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {rule.partnerType}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className="text-lg font-black text-gray-900">{rule.commissionRate}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 text-gray-600 font-bold text-sm">
                                        <Calendar className="h-4 w-4 text-gray-400" /> {rule.settlementPeriod}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm font-black text-gray-900">${rule.totalEarnings}</span>
                                </TableCell>
                                <TableCell>
                                    <Badge className={`rounded-xl border-none font-bold ${rule.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {rule.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="pr-6 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl p-2 w-48 shadow-xl border-gray-100">
                                            <DropdownMenuItem className="rounded-xl gap-3 py-2.5 font-bold cursor-pointer">
                                                <Settings2 className="h-4 w-4 text-indigo-600" /> Adjust Rates
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-xl gap-3 py-2.5 font-bold cursor-pointer">
                                                <Wallet className="h-4 w-4 text-indigo-600" /> Payment History
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
