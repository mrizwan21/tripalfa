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
    Building2,
    Globe,
    MoreVertical,
    Star,
    ShieldCheck,
    Zap,
    ChevronRight,
    ExternalLink
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const MOCK_SUPPLIERS = [
    {
        id: '1',
        code: 'AMD',
        name: 'Amadeus GDS',
        type: 'GDS',
        category: 'MULTI_SERVICE',
        status: 'ACTIVE',
        isPreferred: true,
        priority: 1,
        services: ['Flights', 'Hotels', 'Cars'],
        health: 'HEALTHY'
    },
    {
        id: '2',
        code: 'DUF',
        name: 'Duffel API',
        type: 'DIRECT_API',
        category: 'AIRLINE',
        status: 'ACTIVE',
        isPreferred: true,
        priority: 2,
        services: ['Flights'],
        health: 'HEALTHY'
    },
    {
        id: '3',
        code: 'LAPI',
        name: 'LiteAPI Hotels',
        type: 'DIRECT_API',
        category: 'HOTEL',
        status: 'ACTIVE',
        isPreferred: false,
        priority: 3,
        services: ['Hotels'],
        health: 'DEGRADED'
    },
    {
        id: '4',
        code: 'LX-DXB',
        name: 'Local Express Dubai',
        type: 'LOCAL',
        category: 'TRANSFER',
        status: 'INACTIVE',
        isPreferred: false,
        priority: 10,
        services: ['Transfers'],
        health: 'OFFLINE'
    }
];

export function SupplierList() {
    const [suppliers, setSuppliers] = React.useState<any[]>(MOCK_SUPPLIERS);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const response = await fetch('/api/v1/admin/suppliers');
                if (response.ok) {
                    const data = await response.json();
                    // Merge live data with mock data for visual completeness
                    const liveSuppliers = data.map((s: any) => ({
                        id: s.id,
                        code: s.code,
                        name: s.name,
                        type: s.category === 'GDS' ? 'GDS' : 'DIRECT_API',
                        category: s.category,
                        status: s.isActive ? 'ACTIVE' : 'INACTIVE',
                        isPreferred: s.settings?.preferred || false,
                        priority: s.settings?.priority || 5,
                        services: s.category === 'HOTEL' ? ['Hotels'] : ['Flights'],
                        health: 'HEALTHY'
                    }));
                    setSuppliers([...MOCK_SUPPLIERS, ...liveSuppliers]);
                }
            } catch (error) {
                console.error('Failed to fetch suppliers:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuppliers();
    }, []);

    return (
        <div className="bg-white dark:bg-secondary-950 rounded-3xl shadow-xl shadow-secondary-100/50 border border-secondary-100 dark:border-secondary-800 overflow-hidden">
            <Table>
                <TableHeader className="bg-secondary-50/50 dark:bg-secondary-900/50">
                    <TableRow className="border-secondary-100 dark:border-secondary-800">
                        <TableHead className="py-5 pl-8 text-xs font-black uppercase tracking-widest text-secondary-500">Supplier</TableHead>
                        <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-secondary-500">Type/Category</TableHead>
                        <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-secondary-500">Services</TableHead>
                        <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-secondary-500 text-center">Health</TableHead>
                        <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-secondary-500 text-center">Status</TableHead>
                        <TableHead className="py-5 pr-8 text-right text-xs font-black uppercase tracking-widest text-secondary-500">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {suppliers.map((s) => (
                        <TableRow key={s.id} className="group border-secondary-50 dark:border-secondary-800/50 hover:bg-secondary-50/50 dark:hover:bg-secondary-800/20 transition-colors">
                            <TableCell className="py-6 pl-8">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 shrink-0 rounded-2xl bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center text-secondary-600 dark:text-secondary-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-secondary-900 dark:text-white leading-tight">{s.name}</p>
                                            {s.isPreferred && <Star size={12} className="fill-amber-400 text-amber-400" />}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black uppercase tracking-tighter text-secondary-400">{s.code}</span>
                                            <span className="h-1 w-1 rounded-full bg-secondary-200" />
                                            <span className="text-[10px] font-bold text-secondary-500">Priority {s.priority}</span>
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-secondary-700 dark:text-secondary-300">{s.type.replace('_', ' ')}</span>
                                    <span className="text-[10px] font-medium text-secondary-500 uppercase tracking-tight">{s.category.replace('_', ' ')}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {s.services.map(service => (
                                        <Badge key={service} variant="secondary" className="rounded-lg text-[9px] font-bold py-0 h-4 bg-secondary-100 border-none">
                                            {service}
                                        </Badge>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="flex justify-center">
                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${s.health === 'HEALTHY' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' :
                                        s.health === 'DEGRADED' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' :
                                            'bg-rose-50 text-rose-600 dark:bg-rose-900/20'
                                        }`}>
                                        <Zap size={10} className={s.health === 'HEALTHY' ? 'fill-current' : ''} />
                                        <span className="text-[9px] font-black uppercase tracking-tight">{s.health}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <Badge variant="outline" className={`rounded-xl px-3 py-0.5 font-bold border-none ${s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20' : 'bg-secondary-100 text-secondary-500'
                                    }`}>
                                    {s.status}
                                </Badge>
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
                                            Edit Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="rounded-xl gap-3 py-2.5 font-bold text-secondary-700 dark:text-secondary-300">
                                            Configuration
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="rounded-xl gap-3 py-2.5 font-bold text-secondary-700 dark:text-secondary-300">
                                            View Performance
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="rounded-xl gap-3 py-2.5 font-bold text-rose-600 dark:text-rose-400">
                                            Deactivate
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
