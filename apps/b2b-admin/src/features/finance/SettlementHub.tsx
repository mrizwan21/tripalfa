import React from 'react';
import {
    Building2,
    Search,
    MoreVertical,
    TrendingUp,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    ShieldAlert,
    AlertCircle,
    Landmark,
    Wallet
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

interface Settlement {
    id: string;
    partner: string;
    type: 'Commission' | 'Refund';
    amount: number;
    period: string;
    bankAccount: string;
    status: 'Processing' | 'Pending' | 'Flagged';
}

export function SettlementHub() {
    const settlements: Settlement[] = [
        { id: 'SET-1029', partner: 'TravelPro International', type: 'Commission', amount: 4250.00, period: 'Mar 1-15, 2024', bankAccount: '**** 8821 (HSBC)', status: 'Processing' },
        { id: 'SET-1030', partner: 'Dubai Main Branch', type: 'Refund', amount: 1200.00, period: 'Immediate', bankAccount: '**** 1102 (ENBD)', status: 'Pending' },
        { id: 'SET-1031', partner: 'Al Rayan Travels', type: 'Commission', amount: 850.50, period: 'Feb 1-28, 2024', bankAccount: '**** 0029 (ADCB)', status: 'Flagged' },
    ];

    return (
        <div className="space-y-6">
            {/* Payout Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 border-none shadow-xl rounded-[2.5rem] bg-gradient-to-br from-indigo-900 to-indigo-800 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                        <Landmark className="h-48 w-48" />
                    </div>
                    <div className="relative space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                <Wallet className="h-5 w-5 text-indigo-200" />
                            </div>
                            <h2 className="text-2xl font-black">Next Payout Batch</h2>
                        </div>
                        <div className="flex items-end gap-4">
                            <h1 className="text-5xl font-black">$42,100.50</h1>
                            <span className="text-indigo-300 font-bold mb-2">Scheuled for Fri, 28th Mar</span>
                        </div>
                        <div className="w-full bg-indigo-950/50 rounded-full h-3 max-w-md">
                            <div className="bg-emerald-400 h-3 rounded-full w-[75%]" />
                        </div>
                        <p className="text-sm font-medium text-indigo-200">Processing 75% complete. 12 partners awaiting bank verification.</p>
                    </div>
                </Card>

                <Card className="border-none shadow-lg rounded-[2.5rem] bg-white p-8 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                        <div className="h-10 w-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-black text-gray-900">Action Required</h4>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Risk Management</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                            <p className="text-sm font-bold text-gray-800">Flagged Transaction #SET-1031</p>
                            <p className="text-xs text-rose-600 mt-1 font-medium">Suspicious volume spike detected.</p>
                            <Button size="sm" variant="ghost" className="mt-2 h-8 w-full bg-white text-rose-600 hover:bg-rose-100 font-bold rounded-lg border border-rose-200">Review Case</Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* List */}
            <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-white">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Settlement Queue
                    </h4>
                    <Button className="rounded-xl h-10 bg-gray-900 font-bold hover:bg-primary">
                        Trigger Batch Payout
                    </Button>
                </div>
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="py-4 pl-6 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Partner Entity</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Type</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Payout Period</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Bank Details</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest text-right">Net Amount</TableHead>
                            <TableHead className="py-4 pr-6 text-right font-bold text-gray-500 uppercase text-[10px] tracking-widest">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {settlements.map((s) => (
                            <TableRow key={s.id} className="hover:bg-gray-50/50 transition-colors">
                                <TableCell className="pl-6 py-4">
                                    <span className="font-bold text-gray-900">{s.partner}</span>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`rounded-lg border-none font-bold ${s.type === 'Commission' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                                        {s.type}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm font-medium text-gray-600">{s.period}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                                        <Landmark className="h-4 w-4" /> {s.bankAccount}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="font-black text-gray-900 text-lg">${s.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </TableCell>
                                <TableCell className="pr-6 text-right">
                                    {s.status === 'Processing' && <Badge className="bg-blue-100 text-blue-700 font-bold border-none rounded-lg px-2"><RefreshCcw className="h-3 w-3 mr-1 animate-spin" /> Processing</Badge>}
                                    {s.status === 'Pending' && <Badge className="bg-gray-100 text-gray-600 font-bold border-none rounded-lg px-2"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>}
                                    {s.status === 'Flagged' && <Badge className="bg-rose-100 text-rose-700 font-bold border-none rounded-lg px-2"><AlertCircle className="h-3 w-3 mr-1" /> Flagged</Badge>}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
// Helper icon for spin
function RefreshCcw(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg> }
