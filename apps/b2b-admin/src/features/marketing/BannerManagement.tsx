import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Image as ImageIcon, Calendar, MoreVertical, Loader2, MousePointerClick, Eye, TrendingUp, X, Upload, Lock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
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
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { useMarketingPermissions } from '@/hooks/useMarketingPermissions';
import { useAuth } from '@/contexts/AuthContext';

const bannerSchema = z.object({
    title: z.string().min(3, "Title is too short"),
    imageUrl: z.string().min(1, "Image is required"),
    targetUrl: z.string().url("Must be a valid URL"),
    startDate: z.string(),
    endDate: z.string(),
    status: z.enum(['active', 'scheduled', 'ended', 'draft']),
    position: z.enum(['home_hero', 'sidebar', 'footer', 'popup']),
});

type BannerFormValues = z.infer<typeof bannerSchema>;

const BannerManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const companyId = 'comp1';
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    type Banner = BannerFormValues & { id?: string; impressions?: number; clicks?: number };
    const [editingBanner, setEditingBanner] = React.useState<Banner | null>(null);
    
    // Marketing permissions
    const { 
        canViewBanners, 
        canCreateBanners, 
        canEditBanners, 
        canDeleteBanners,
        isLoading: permissionsLoading 
    } = useMarketingPermissions();

    const { data: banners, isLoading } = useQuery(['banners', companyId], async (): Promise<Banner[]> => {
        // const { data } = await axios.get(`/api/marketing/banners?companyId=${companyId}`);
        // return data;
        // Mock data for now
        return [
            { id: '1', title: 'Summer Sale 2026', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', targetUrl: '/promotions/summer', startDate: '2026-06-01', endDate: '2026-08-31', status: 'active', position: 'home_hero', impressions: 15420, clicks: 1240 },
            { id: '2', title: 'Winter Early Bird', imageUrl: 'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef', targetUrl: '/promotions/winter', startDate: '2026-09-01', endDate: '2026-11-30', status: 'scheduled', position: 'sidebar', impressions: 0, clicks: 0 },
        ] as Banner[];
    });

    const form = useForm<BannerFormValues>({
        resolver: zodResolver(bannerSchema),
        defaultValues: {
            title: '',
            imageUrl: '',
            targetUrl: '',
            startDate: '',
            endDate: '',
            status: 'draft',
            position: 'home_hero',
        },
    });

    const mapBannerToForm = (b?: Banner | null): BannerFormValues => ({
        title: b?.title ?? '',
        imageUrl: b?.imageUrl ?? '',
        targetUrl: b?.targetUrl ?? '',
        startDate: b?.startDate ?? '',
        endDate: b?.endDate ?? '',
        status: (b?.status ?? 'draft') as BannerFormValues['status'],
        position: (b?.position ?? 'home_hero') as BannerFormValues['position'],
    });

    React.useEffect(() => {
        form.reset(mapBannerToForm(editingBanner));
    }, [editingBanner, form]);

    const mutation = useMutation<BannerFormValues, unknown, BannerFormValues, unknown>(
        async (values: BannerFormValues) => {
            // return editingBanner?.id 
            //   ? axios.put(`/api/marketing/banners/${editingBanner.id}`, { ...values, companyId })
            //   : axios.post('/api/marketing/banners', { ...values, companyId });
            await new Promise<void>(resolve => setTimeout(() => resolve(), 1000)); // Mock delay
            return values;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['banners', companyId]);
                setIsModalOpen(false);
                toast.success(editingBanner ? "Banner updated" : "Banner created");
            },
            onError: () => toast.error("Failed to save banner"),
        }
    );

    const deleteMutation = useMutation(
        async (id: string) => {
            // await axios.delete(`/api/marketing/banners/${id}`);
            await new Promise(resolve => setTimeout(resolve, 500));
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['banners', companyId]);
                toast.success("Banner deleted");
            },
        }
    );

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Mock upload - in real app would upload to S3/Cloudinary and get URL
            const mockUrl = URL.createObjectURL(file);
            form.setValue('imageUrl', mockUrl);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'scheduled': return 'bg-blue-100 text-blue-700';
            case 'ended': return 'bg-gray-100 text-gray-500';
            default: return 'bg-yellow-100 text-yellow-700';
        }
    };

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900">Promotional Banners</h2>
                    <p className="text-gray-500 mt-2 font-medium">Manage visual campaigns across your portal.</p>
                </div>
                <Button
                    onClick={() => { setEditingBanner(null); setIsModalOpen(true); }}
                    className="h-12 bg-gray-900 hover:bg-primary transition-all px-6 rounded-2xl font-bold shadow-lg" > <Plus className="mr-2 h-5 w-5" />
                    Create Campaign
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {banners?.map((banner: Banner) => (
                    <Card key={banner.id} className="group border-none shadow-md hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden bg-white flex flex-col h-full">
                        <div className="relative h-48 overflow-hidden">
                            <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute top-4 right-4 flex gap-2">
                                <Badge className={`${getStatusColor(banner.status)} border-none font-bold px-3 py-1 shadow-sm uppercase text-xs backdrop-blur-md bg-opacity-90`}>
                                    {banner.status}
                                </Badge>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                                <div>
                                    <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">{banner.position.replace('_', ' ')}</p>
                                    <h3 className="text-xl font-bold text-white leading-tight">{banner.title}</h3>
                                </div>
                            </div>
                        </div>

                        <CardContent className="p-6 flex-1 flex flex-col">
                            <div className="grid grid-cols-3 gap-4 mb-6 pt-2">
                                <div className="text-center p-2 rounded-xl bg-gray-50">
                                    <div className="flex items-center justify-center text-gray-400 mb-1"><Eye className="h-4 w-4" /></div>
                                    <div className="font-bold text-gray-900 text-sm">{banner.impressions?.toLocaleString() || 0}</div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">Views</div>
                                </div>
                                <div className="text-center p-2 rounded-xl bg-gray-50">
                                    <div className="flex items-center justify-center text-gray-400 mb-1"><MousePointerClick className="h-4 w-4" /></div>
                                    <div className="font-bold text-gray-900 text-sm">{banner.clicks?.toLocaleString() || 0}</div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">Clicks</div>
                                </div>
                                <div className="text-center p-2 rounded-xl bg-gray-50">
                                    <div className="flex items-center justify-center text-gray-400 mb-1"><TrendingUp className="h-4 w-4" /></div>
                                                    <div className="font-bold text-green-600 text-sm">
                                                        {((banner.impressions ?? 0) > 0) ? (((banner.clicks ?? 0) / (banner.impressions ?? 1)) * 100).toFixed(1) : '0'}%
                                                    </div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">CTR</div>
                                </div>
                            </div>

                            <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                                <div className="text-xs font-medium text-gray-500 flex items-center">
                                    <Calendar className="h-3 w-3 mr-1.5" />
                                    {new Date(banner.startDate).toLocaleDateString()} - {new Date(banner.endDate).toLocaleDateString()}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100">
                                            <MoreVertical className="h-4 w-4 text-gray-500" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl border-gray-100 shadow-xl w-40">
                                        <DropdownMenuItem onClick={() => { setEditingBanner(banner); setIsModalOpen(true); }} className="font-medium cursor-pointer">
                                            Edit Banner
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => banner.id && deleteMutation.mutate(banner.id)} className="text-red-600 font-medium cursor-pointer focus:text-red-700 focus:bg-red-50">
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl rounded-3xl bg-white/95 backdrop-blur-xl border-white/20 p-0 shadow-2xl overflow-hidden">
                    <DialogHeader className="p-8 pb-0">
                        <DialogTitle className="text-2xl font-extrabold text-gray-900">
                            {editingBanner ? 'Edit Campaign' : 'New Campaign'}
                        </DialogTitle>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-0">
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel className="font-bold">Campaign Title</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Summer Sale 2026" {...field} className="h-12 bg-white" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="position"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold">Display Position</FormLabel>
                                                <FormControl>
                                                    <select
                                                        {...field}
                                                        className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <option value="home_hero">Home Hero Slider</option>
                                                        <option value="sidebar">Sidebar Ad</option>
                                                        <option value="footer">Footer Banner</option>
                                                        <option value="popup">Modal Popup</option>
                                                    </select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold">Status</FormLabel>
                                                <FormControl>
                                                    <select
                                                        {...field}
                                                        className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <option value="draft">Draft</option>
                                                        <option value="active">Active</option>
                                                        <option value="scheduled">Scheduled</option>
                                                        <option value="ended">Ended</option>
                                                    </select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="startDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold">Start Date</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} className="h-12 bg-white" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="endDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold">End Date</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} className="h-12 bg-white" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="targetUrl"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel className="font-bold">Target URL</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://..." {...field} className="h-12 bg-white" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="col-span-2">
                                        <FormLabel className="font-bold block mb-2">Banner Image</FormLabel>
                                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                                                onChange={handleImageUpload}
                                            />
                                            {form.watch('imageUrl') ? (
                                                <div className="relative h-40 w-full">
                                                    <img src={form.watch('imageUrl')} alt="Preview" className="h-full w-full object-contain rounded-lg" />
                                                    <div className="absolute inset-0 bg-black/40 items-center justify-center flex opacity-0 group-hover:opacity-100 transition-opacity rounded-lg z-10">
                                                        <p className="text-white font-bold">Change Image</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="py-4">
                                                    <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        <ImageIcon className="h-6 w-6" />
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-500">Click to upload or drag and drop</p>
                                                    <p className="text-xs text-gray-400 mt-1">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="font-bold">Cancel</Button>
                                <Button
                                    type="submit"
                                    disabled={mutation.isLoading}
                                    className="h-10 px-8 bg-gray-900 hover:bg-primary text-white font-bold rounded-xl shadow-lg hover:shadow-primary/30 transition-all"
                                >
                                    {mutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Save Campaign
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BannerManagement;
