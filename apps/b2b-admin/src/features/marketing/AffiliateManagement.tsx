import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Users, DollarSign, TrendingUp, MoreVertical, Search, CheckCircle2, UserPlus, Mail, Link as LinkIcon, Edit, Trash2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';

const affiliateSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    commissionRate: z.coerce.number().min(0).max(100),
    referralCode: z.string().min(3, "Code must be at least 3 characters"),
    status: z.enum(['active', 'pending', 'inactive']),
});

type AffiliateFormValues = z.infer<typeof affiliateSchema>;

const AffiliateManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const companyId = 'comp1';
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingAffiliate, setEditingAffiliate] = React.useState<any>(null);
    const [searchTerm, setSearchTerm] = React.useState('');

    const { data: affiliates, isLoading } = useQuery(['affiliates', companyId], async () => {
        // const { data } = await axios.get(`/api/marketing/affiliates?companyId=${companyId}`);
        // return data;
        return [
            { id: '1', name: 'John Doe', email: 'john@example.com', commissionRate: 10, referralCode: 'JOHN10', status: 'active', earnings: 1250.50, referrals: 45 },
            { id: '2', name: 'Jane Smith', email: 'jane@travelblog.com', commissionRate: 15, referralCode: 'JANE15', status: 'active', earnings: 3400.00, referrals: 120 },
            { id: '3', name: 'Mike Wilson', email: 'mike@influencer.com', commissionRate: 8, referralCode: 'MIKE8', status: 'inactive', earnings: 0, referrals: 0 },
        ];
    });

    const form = useForm<AffiliateFormValues>({
        resolver: zodResolver(affiliateSchema),
        defaultValues: {
            name: '',
            email: '',
            commissionRate: 10,
            referralCode: '',
            status: 'active',
        },
    });

    React.useEffect(() => {
        if (editingAffiliate) {
            form.reset(editingAffiliate);
        } else {
            form.reset({
                name: '',
                email: '',
                commissionRate: 10,
                referralCode: '',
                status: 'active',
            });
        }
    }, [editingAffiliate, form]);

    const mutation = useMutation(
        async (values: AffiliateFormValues) => {
            // return editingAffiliate?.id 
            //   ? axios.put(`/api/marketing/affiliates/${editingAffiliate.id}`, { ...values, companyId })
            //   : axios.post('/api/marketing/affiliates', { ...values, companyId });
            await new Promise(resolve => setTimeout(resolve, 800));
            return values;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['affiliates', companyId]);
                setIsModalOpen(false);
                toast.success(editingAffiliate ? "Affiliate updated" : "Affiliate added");
            },
            onError: () => {
                toast.error("Failed to save affiliate");
            },
        }
    );

    const filteredAffiliates = affiliates?.filter((a: any) =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.referralCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900">Affiliate Program</h2>
                    <p className="text-gray-500 mt-2 font-medium">Manage partners who promote your brand.</p>
                </div>
                <Button
                    onClick={() => { setEditingAffiliate(null); setIsModalOpen(true); }}
                    className="h-12 bg-gray-900 hover:bg-primary transition-all px-6 rounded-2xl font-bold shadow-lg"
                >
                    <UserPlus className="mr-2 h-5 w-5" />
                    Add Affiliate
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-lg bg-white rounded-3xl overflow-hidden">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Total Partners</p>
                            <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{affiliates?.length || 0}</h3>
                            <p className="text-green-600 text-sm font-bold mt-1 flex items-center"><TrendingUp className="h-3 w-3 mr-1" /> +12% this month</p>
                        </div>
                        <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Users className="h-7 w-7" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-lg bg-white rounded-3xl overflow-hidden">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Total Earnings</p>
                            <h3 className="text-3xl font-extrabold text-gray-900 mt-1">$4,650.50</h3>
                            <p className="text-green-600 text-sm font-bold mt-1 flex items-center"><TrendingUp className="h-3 w-3 mr-1" /> +8.5% this month</p>
                        </div>
                        <div className="h-14 w-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
                            <DollarSign className="h-7 w-7" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-lg bg-white rounded-3xl overflow-hidden">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Avg. Commission</p>
                            <h3 className="text-3xl font-extrabold text-gray-900 mt-1">11.5%</h3>
                            <p className="text-gray-400 text-sm font-bold mt-1">Stable</p>
                        </div>
                        <div className="h-14 w-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <TrendingUp className="h-7 w-7" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                            placeholder="Search affiliates..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-xl"
                        />
                    </div>
                </div>
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="font-bold text-gray-900 py-4 pl-6">Affiliate</TableHead>
                            <TableHead className="font-bold text-gray-900 py-4">Status</TableHead>
                            <TableHead className="font-bold text-gray-900 py-4">Commission</TableHead>
                            <TableHead className="font-bold text-gray-900 py-4">Referrals</TableHead>
                            <TableHead className="font-bold text-gray-900 py-4">Earnings</TableHead>
                            <TableHead className="font-bold text-gray-900 py-4 pr-6 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center text-gray-500">Loading...</TableCell>
                            </TableRow>
                        ) : filteredAffiliates?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center text-gray-500">No affiliates found matching your search.</TableCell>
                            </TableRow>
                        ) : (
                            filteredAffiliates?.map((affiliate: any) => (
                                <TableRow key={affiliate.id} className="hover:bg-gray-50/80 transition-colors">
                                    <TableCell className="pl-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                                {affiliate.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{affiliate.name}</p>
                                                <p className="text-xs text-gray-500">{affiliate.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`
                      ${affiliate.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                      ${affiliate.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                      ${affiliate.status === 'inactive' ? 'bg-red-100 text-red-700' : ''}
                      border-none font-bold px-2.5 py-0.5 shadow-sm capitalize
                    `}>
                                            {affiliate.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{affiliate.commissionRate}%</TableCell>
                                    <TableCell className="font-medium">{affiliate.referrals}</TableCell>
                                    <TableCell className="font-bold text-green-600">${affiliate.earnings.toFixed(2)}</TableCell>
                                    <TableCell className="pr-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary rounded-lg" onClick={() => { setEditingAffiliate(affiliate); setIsModalOpen(true); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 rounded-lg">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-xl rounded-3xl bg-white/95 backdrop-blur-xl border-white/20 p-8 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-extrabold text-gray-900">
                            {editingAffiliate ? 'Edit Affiliate' : 'Add New Affiliate'}
                        </DialogTitle>
                        <CardDescription className="text-base font-medium">Configure partnership details.</CardDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel className="font-bold text-gray-700">Full Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} className="h-11 border-gray-200 focus:ring-primary/20 bg-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel className="font-bold text-gray-700">Email Address</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                    <Input placeholder="john@example.com" {...field} className="h-11 pl-10 border-gray-200 focus:ring-primary/20 bg-white" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="referralCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-gray-700">Referral Code</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <LinkIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                    <Input placeholder="JOHN10" {...field} className="h-11 pl-10 uppercase border-gray-200 focus:ring-primary/20 bg-white" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="commissionRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-gray-700">Commission Rate (%)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="10" {...field} className="h-11 border-gray-200 focus:ring-primary/20 bg-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel className="font-bold text-gray-700">Account Status</FormLabel>
                                            <FormControl>
                                                <div className="flex gap-4">
                                                    {['active', 'pending', 'inactive'].map((status) => (
                                                        <div
                                                            key={status}
                                                            className={`
                                 flex-1 p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-center capitalize font-bold text-sm
                                 ${field.value === status
                                                                    ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                                                                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}
                               `}
                                                            onClick={() => field.onChange(status)}
                                                        >
                                                            {status}
                                                        </div>
                                                    ))}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0 sm:justify-between pt-4 border-t border-gray-100">
                                <Button type="button" variant="ghost" className="rounded-xl font-bold h-12" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button
                                    type="submit"
                                    disabled={mutation.isLoading}
                                    className="rounded-xl font-extrabold px-8 h-12 bg-gray-900 hover:bg-primary transition-all shadow-xl"
                                >
                                    {mutation.isLoading ? 'Saving...' : 'Save Affiliate'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AffiliateManagement;
