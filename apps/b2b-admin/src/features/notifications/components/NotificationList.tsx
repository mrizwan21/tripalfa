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
    Mail,
    MessageSquare,
    Smartphone,
    Bell,
    MoreVertical,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const MOCK_DATA = [
    {
        id: '1',
        title: 'Booking Confirmation',
        recipient: 'john@example.com',
        channel: 'EMAIL',
        segment: 'B2C',
        status: 'DELIVERED',
        priority: 'HIGH',
        sentAt: '2024-03-28T10:30:00Z',
    },
    {
        id: '2',
        title: 'Wallet Low Balance Alert',
        recipient: 'agency_top_travel',
        channel: 'SYSTEM',
        segment: 'B2B',
        status: 'SENT',
        priority: 'URGENT',
        sentAt: '2024-03-28T09:15:00Z',
    },
    {
        id: '3',
        title: 'Exclusive Weekend Deals',
        recipient: 'Bulk Segment (Silver)',
        channel: 'WHATSAPP',
        segment: 'B2C',
        status: 'FAILED',
        priority: 'NORMAL',
        sentAt: '2024-03-27T18:45:00Z',
        error: 'Rate limit exceeded'
    },
    {
        id: '4',
        title: 'Password Change Attempt',
        recipient: '+971 50 *** ****',
        channel: 'SMS',
        segment: 'B2C',
        status: 'DELIVERED',
        priority: 'URGENT',
        sentAt: '2024-03-27T14:20:00Z',
    },
];

const channelIcons: Record<string, any> = {
    EMAIL: Mail,
    SMS: Smartphone,
    WHATSAPP: MessageSquare,
    SYSTEM: Bell,
};

export function NotificationList() {
    return (
        <div className="bg-white dark:bg-secondary-950 rounded-3xl shadow-xl shadow-secondary-100/50 border border-secondary-100 dark:border-secondary-800 overflow-hidden">
            <Table>
                <TableHeader className="bg-secondary-50/50 dark:bg-secondary-900/50">
                    <TableRow className="border-secondary-100 dark:border-secondary-800">
                        <TableHead className="py-5 pl-8 text-xs font-black uppercase tracking-widest text-secondary-500">Notification</TableHead>
                        <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-secondary-500 text-center">Target</TableHead>
                        <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-secondary-500 text-center">Status</TableHead>
                        <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-secondary-500">Sent Time</TableHead>
                        <TableHead className="py-5 pr-8 text-right text-xs font-black uppercase tracking-widest text-secondary-500">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {MOCK_DATA.map((log) => {
                        const Icon = channelIcons[log.channel] || Bell;

                        return (
                            <TableRow key={log.id} className="group border-secondary-50 dark:border-secondary-800/50 hover:bg-secondary-50/50 dark:hover:bg-secondary-800/20 transition-colors">
                                <TableCell className="py-6 pl-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 shrink-0 rounded-2xl bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center text-secondary-600 dark:text-secondary-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                            <Icon size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-secondary-900 dark:text-white leading-tight">{log.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black uppercase tracking-tighter text-secondary-400">{log.channel}</span>
                                                <span className="h-1 w-1 rounded-full bg-secondary-200" />
                                                <span className="text-[10px] font-bold text-secondary-500">{log.recipient}</span>
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className={`rounded-xl px-3 py-0.5 font-bold border-none ${log.segment === 'B2B' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20'
                                        }`}>
                                        {log.segment}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1.5">
                                            {log.status === 'DELIVERED' && <CheckCircle2 size={14} className="text-emerald-500" />}
                                            {log.status === 'SENT' && <Clock size={14} className="text-blue-500" />}
                                            {log.status === 'FAILED' && <AlertCircle size={14} className="text-rose-500" />}
                                            <span className={`text-[10px] font-black tracking-widest ${log.status === 'DELIVERED' ? 'text-emerald-600' :
                                                    log.status === 'SENT' ? 'text-blue-600' : 'text-rose-600'
                                                }`}>
                                                {log.status}
                                            </span>
                                        </div>
                                        {log.error && <span className="text-[8px] text-rose-400 font-bold mt-1 uppercase tracking-tighter">{log.error}</span>}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="text-xs font-bold text-secondary-900 dark:text-white">
                                        {new Date(log.sentAt).toLocaleDateString()}
                                    </p>
                                    <p className="text-[10px] text-secondary-400 font-medium">
                                        {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
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
                                                View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-xl gap-3 py-2.5 font-bold text-secondary-700 dark:text-secondary-300">
                                                Resend
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-xl gap-3 py-2.5 font-bold text-rose-600 dark:text-rose-400">
                                                Delete Log
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
