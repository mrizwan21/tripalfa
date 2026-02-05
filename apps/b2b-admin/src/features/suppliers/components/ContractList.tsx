import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
    ShieldCheck,
    Calendar,
    DollarSign,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    MoreVertical
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const MOCK_CONTRACTS = [
    {
        id: '1',
        supplier: 'Amadeus GDS',
        ref: 'CT-AMD-2024-01',
        type: 'PREFERRED',
        status: 'ACTIVE',
        creditLimit: 500000,
        currency: 'USD',
        startDate: '2024-01-01',
        endDate: '2025-12-31'
    },
    {
        id: '2',
        supplier: 'Duffel API',
        ref: 'API-DUF-982',
        type: 'NET_RATE',
        status: 'ACTIVE',
        creditLimit: 0,
        currency: 'USD',
        startDate: '2023-06-15',
        endDate: '2024-06-14'
    },
    {
        id: '3',
        supplier: 'Local Express Dubai',
        ref: 'LCL-DXB-0013',
        type: 'STANDARD',
        status: 'EXPIRED',
        creditLimit: 10000,
        currency: 'AED',
        startDate: '2023-01-01',
        endDate: '2023-12-31'
    }
];

export function ContractList() {
    return (
        <div className="bg-white dark:bg-secondary-950 rounded-3xl shadow-xl shadow-secondary-100/50 border border-secondary-100 dark:border-secondary-800 overflow-hidden">
            <Table>
                <TableHeader className="bg-secondary-50/50 dark:bg-secondary-900/50">
                    <TableRow className="border-secondary-100 dark:border-secondary-800">
                        <TableHead className="py-5 pl-8 text-xs font-black uppercase tracking-widest text-secondary-500">Contract Ref / Partner</TableHead>
                        <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-secondary-500">Type</TableHead>
                        <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-secondary-500 text-center">Credit Limit</TableHead>
                        <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-secondary-500">Validity Period</TableHead>
                        <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-secondary-500 text-center">Status</TableHead>
                        <TableHead className="py-5 pr-8 text-right text-xs font-black uppercase tracking-widest text-secondary-500">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {MOCK_CONTRACTS.map((c) => (
                        <TableRow key={c.id} className="group border-secondary-50 dark:border-secondary-800/50 hover:bg-secondary-50/50 dark:hover:bg-secondary-800/20 transition-colors">
                            <TableCell className="py-6 pl-8">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 shrink-0 rounded-2xl bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center text-secondary-600 dark:text-secondary-400">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-secondary-900 dark:text-white leading-tight">{c.ref}</p>
                                        <p className="text-[10px] font-bold text-secondary-500 mt-1 uppercase tracking-tighter">{c.supplier}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="rounded-xl px-3 py-0.5 font-bold bg-secondary-50 text-secondary-700 border-none">
                                    {c.type}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-center text-sm font-black text-secondary-900 dark:text-white">
                                {c.creditLimit > 0 ? (
                                    <span className="flex items-center justify-center gap-1">
                                        <DollarSign size={14} className="text-emerald-600" />
                                        {c.creditLimit.toLocaleString()} {c.currency}
                                    </span>
                                ) : (
                                    <span className="text-secondary-400 font-bold uppercase tracking-widest text-[10px]">Pre-paid Only</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2 text-xs font-bold text-secondary-700 dark:text-secondary-300">
                                    <Calendar size={14} className="text-secondary-400" />
                                    {new Date(c.startDate).toLocaleDateString()} — {new Date(c.endDate).toLocaleDateString()}
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="flex justify-center">
                                    <Badge variant="outline" className={`rounded-xl px-3 py-0.5 font-bold border-none ${c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20' :
                                            c.status === 'EXPIRED' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20' :
                                                'bg-secondary-100 text-secondary-500'
                                        }`}>
                                        {c.status}
                                    </Badge>
                                </div>
                            </TableCell>
                            <TableCell className="pr-8 text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white dark:hover:bg-secondary-800 shadow-none">
                                            <MoreVertical size={16} className="text-secondary-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-2xl p-2 w-48 shadow-2xl border-secondary-100 dark:border-secondary-800">
                                        <DropdownMenuItem className="rounded-xl gap-3 py-2.5 font-bold text-secondary-700 dark:text-secondary-300">
                                            Download PDF
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="rounded-xl gap-3 py-2.5 font-bold text-secondary-700 dark:text-secondary-300">
                                            Renew Contract
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="rounded-xl gap-3 py-2.5 font-bold text-rose-600 dark:text-rose-400">
                                            Terminate
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
