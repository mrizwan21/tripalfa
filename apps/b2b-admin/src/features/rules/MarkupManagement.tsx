import React from 'react';
import {
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Filter,
    Plane,
    Building2,
    Globe,
    CheckCircle2,
    XCircle,
    TrendingUp,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface MarkupRule {
    id: string;
    name: string;
    targetId?: string;
    targetType: 'GLOBAL' | 'COMPANY' | 'BRANCH' | 'SUBAGENT';
    serviceType: 'FLIGHT' | 'HOTEL' | 'PACKAGE' | 'ALL';
    markupValue: string;
    markupType: 'FIXED' | 'PERCENTAGE';
    status: 'ACTIVE' | 'INACTIVE';
    updatedAt: string;
}

export function MarkupManagement() {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [rules, setRules] = React.useState<MarkupRule[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const [formData, setFormData] = React.useState({
        name: '',
        serviceType: 'FLIGHT',
        targetType: 'GLOBAL',
        markupType: 'PERCENTAGE',
        markupValue: ''
    });

    const fetchRules = async () => {
        try {
            const response = await fetch('http://localhost:3002/pricing-rules');
            const data = await response.json();
            setRules(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch rules:', error);
            toast.error('Failed to load markup rules');
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchRules();
    }, []);

    const handleCreateRule = async () => {
        try {
            const response = await fetch('http://localhost:3002/pricing-rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    status: 'ACTIVE',
                    priority: 1
                })
            });

            if (response.ok) {
                toast.success('Markup rule established successfully');
                setIsModalOpen(false);
                fetchRules();
            } else {
                throw new Error('Failed to create rule');
            }
        } catch (error) {
            toast.error('Failed to create markup rule');
        }
    };

    return (
        <div className="space-y-6">
            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search markup rules..."
                        className="pl-10 h-11 rounded-xl border-gray-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Button variant="outline" className="rounded-xl h-11 border-gray-200">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                    <Button onClick={() => setIsModalOpen(true)} className="rounded-xl h-11 bg-gray-900 hover:bg-primary font-bold">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Markup
                    </Button>
                </div>
            </div>

            {/* Rules Table */}
            <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="py-4 pl-6 font-bold text-gray-900">Rule Name</TableHead>
                            <TableHead className="py-4 font-bold text-gray-900">Target Level</TableHead>
                            <TableHead className="py-4 font-bold text-gray-900">Service</TableHead>
                            <TableHead className="py-4 font-bold text-gray-900">Value</TableHead>
                            <TableHead className="py-4 font-bold text-gray-900">Status</TableHead>
                            <TableHead className="py-4 font-bold text-gray-900">Updated</TableHead>
                            <TableHead className="py-4 pr-6 text-right font-bold text-gray-900">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rules.filter(rule =>
                            rule.name.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((rule) => (
                            <TableRow key={rule.id} className="hover:bg-gray-50/50 transition-colors">
                                <TableCell className="pl-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <TrendingUp className="h-5 w-5" />
                                        </div>
                                        <span className="font-bold text-gray-900">{rule.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {rule.targetType === 'GLOBAL' ? <Globe className="h-4 w-4 text-indigo-500" /> : <Building2 className="h-4 w-4 text-gray-400" />}
                                        <span className="text-sm font-medium">{rule.targetType}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className="bg-gray-100 text-gray-700 border-none font-bold">
                                        {rule.serviceType}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-lg font-black text-gray-900">
                                            {rule.markupType === 'FIXED' ? '$' : ''}{rule.markupValue}{rule.markupType === 'PERCENTAGE' ? '%' : ''}
                                        </span>
                                        <Badge variant="outline" className="text-[10px] uppercase font-black px-1.5 py-0 border-gray-200">
                                            {rule.markupType}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {rule.status === 'ACTIVE' ? (
                                        <div className="flex items-center gap-1.5 text-green-600 font-bold text-sm">
                                            <CheckCircle2 className="h-4 w-4" /> Active
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-gray-400 font-bold text-sm">
                                            <XCircle className="h-4 w-4" /> Inactive
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm text-gray-500 font-medium">
                                    {new Date(rule.updatedAt || Date.now()).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="pr-6 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-gray-100">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl p-2 w-40">
                                            <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
                                                <Edit className="h-4 w-4" /> Edit Rule
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer text-red-600 focus:text-red-600">
                                                <Trash2 className="h-4 w-4" /> Delete Rule
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Add Markup Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
                    <div className="bg-gray-900 p-6 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black flex items-center gap-3">
                                <TrendingUp className="h-6 w-6 text-primary" />
                                Configure New Pricing Rule
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="p-8 bg-white space-y-8">
                        {/* Rule Identity */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <div className="h-1 w-4 bg-primary rounded-full" />
                                Basic Identity
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Rule Name</label>
                                    <Input
                                        placeholder="e.g. Summer Special 2024"
                                        className="h-12 rounded-xl border-gray-200"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Service Type</label>
                                    <select
                                        className="flex h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold outline-none"
                                        value={formData.serviceType}
                                        onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                                    >
                                        <option value="FLIGHT">Flights</option>
                                        <option value="HOTEL">Hotels</option>
                                        <option value="PACKAGE">Packages</option>
                                        <option value="ALL">All Services</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Target & Value */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <div className="h-1 w-4 bg-primary rounded-full" />
                                Mapping & Pricing
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Target Mapping</label>
                                    <select
                                        className="flex h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold outline-none"
                                        value={formData.targetType}
                                        onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                                    >
                                        <option value="GLOBAL">Global (All Partners)</option>
                                        <option value="COMPANY">Specific Company</option>
                                        <option value="BRANCH">Specific Branch</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Markup Type</label>
                                        <select
                                            className="flex h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold outline-none"
                                            value={formData.markupType}
                                            onChange={(e) => setFormData({ ...formData, markupType: e.target.value })}
                                        >
                                            <option value="PERCENTAGE">Percentage</option>
                                            <option value="FIXED">Fixed Amount</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Value</label>
                                        <Input
                                            type="number"
                                            placeholder="5.0"
                                            className="h-12 rounded-xl border-gray-200 font-black text-lg"
                                            value={formData.markupValue}
                                            onChange={(e) => setFormData({ ...formData, markupValue: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Advanced Filters */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <div className="h-1 w-4 bg-primary rounded-full" />
                                Advanced Criteria (Optional)
                            </h4>
                            <div className="bg-gray-50 rounded-2xl p-4 space-y-4 border border-gray-100">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-500">Apply only for</p>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge className="bg-white text-gray-700 border border-gray-200 px-3 py-1 rounded-lg">Emirates (EK)</Badge>
                                            <Badge className="bg-white text-gray-700 border border-gray-200 px-3 py-1 rounded-lg">Qatar (QR)</Badge>
                                            <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-primary hover:bg-white">+ Add Airline</Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-500">Trip Types</p>
                                        <div className="flex gap-2">
                                            <Badge className="bg-gray-900 text-white px-3 py-1 rounded-lg">One Way</Badge>
                                            <Badge className="bg-gray-900 text-white px-3 py-1 rounded-lg">Round Trip</Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-4 gap-3">
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl h-12 px-6 font-bold hover:bg-gray-100 transition-colors">
                                Discard Change
                            </Button>
                            <Button
                                onClick={handleCreateRule}
                                className="rounded-xl h-12 px-10 bg-gray-900 hover:bg-primary font-bold text-white shadow-xl shadow-gray-200 group"
                            >
                                Establish Rule
                                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
