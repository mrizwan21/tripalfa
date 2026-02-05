import React from 'react';
import {
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    Download,
    Calendar,
    FileText,
    Building2,
    RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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

interface LedgerEntry {
    id: string;
    date: string;
    reference: string;
    description: string;
    entity: string;
    type: 'Credit' | 'Debit';
    amount: number;
    balanceAfter: number;
    status: 'Completed' | 'Pending' | 'Failed';
}

export function TransactionLedger() {
    const transactions: LedgerEntry[] = [
        { id: 'TRX-99821', date: '2024-03-24 14:30', reference: 'BK-10293', description: 'Flight Booking Payment - Emirates', entity: 'TravelPro Int.', type: 'Debit', amount: 450.00, balanceAfter: 124550.50, status: 'Completed' },
        { id: 'TRX-99820', date: '2024-03-24 12:15', reference: 'DEP-8821', description: 'Bank Transfer Deposit', entity: 'TravelPro Int.', type: 'Credit', amount: 5000.00, balanceAfter: 125000.50, status: 'Completed' },
        { id: 'TRX-99819', date: '2024-03-23 09:45', reference: 'RF-2210', description: 'Refund - Hotel Cancellation', entity: 'Dubai Main Branch', type: 'Credit', amount: 120.00, balanceAfter: 45200.00, status: 'Completed' },
        { id: 'TRX-99818', date: '2024-03-23 08:00', reference: 'FEE-0012', description: 'Monthly Platform Fee', entity: 'Al Rayan Travels', type: 'Debit', amount: 50.00, balanceAfter: 120.00, status: 'Completed' },
    ];

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card className="border-none shadow-sm rounded-2xl p-4 bg-gray-50/50 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search ref or description..." className="pl-10 h-10 rounded-xl border-gray-200 bg-white" />
                    </div>
                    <Button variant="outline" className="rounded-xl h-10 border-gray-200 bg-white font-bold text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" /> Date Range
                    </Button>
                    <Button variant="outline" className="rounded-xl h-10 border-gray-200 bg-white font-bold text-gray-600">
                        <Building2 className="h-4 w-4 mr-2" /> Entity
                    </Button>
                    <Button variant="outline" className="rounded-xl h-10 border-gray-200 bg-white font-bold text-gray-600">
                        <Filter className="h-4 w-4 mr-2" /> Type
                    </Button>
                </div>
                <Button variant="ghost" className="rounded-xl h-10 font-bold text-primary hover:bg-primary/5">
                    <Download className="h-4 w-4 mr-2" /> Export CSV
                </Button>
            </Card>

            {/* Ledger Table */}
            <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-white">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="py-4 pl-6 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Transaction Details</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Entity</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Reference</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest text-right">Amount</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest text-right">Balance After</TableHead>
                            <TableHead className="py-4 pr-6 text-right font-bold text-gray-500 uppercase text-[10px] tracking-widest">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((trx) => (
                            <TableRow key={trx.id} className="hover:bg-gray-50/50 transition-colors">
                                <TableCell className="pl-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${trx.type === 'Credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {trx.type === 'Credit' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{trx.description}</p>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">
                                                <Calendar className="h-3 w-3" /> {trx.date}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="rounded-lg border-gray-100 bg-gray-50 text-gray-600 font-bold">
                                        {trx.entity}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 font-mono text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg w-fit">
                                        <FileText className="h-3 w-3" /> {trx.reference}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className={`font-black text-lg ${trx.type === 'Credit' ? 'text-emerald-600' : 'text-gray-900'}`}>
                                        {trx.type === 'Credit' ? '+' : '-'}${trx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="font-bold text-gray-500 text-sm">
                                        ${trx.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </TableCell>
                                <TableCell className="pr-6 text-right">
                                    <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold rounded-lg uppercase text-[10px] tracking-wider px-2 py-1">
                                        {trx.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Pagination Placeholder */}
            <div className="flex justify-center">
                <Button variant="ghost" size="sm" className="font-bold text-gray-400 hover:text-gray-900">
                    <RefreshCcw className="h-3 w-3 mr-2" /> Load More Transactions
                </Button>
            </div>
        </div>
    );
}
