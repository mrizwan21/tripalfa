import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Company } from '../types';

const companySchema = z.object({
    name: z.string().min(2, "Company name required"),
    legalName: z.string().min(2, "Legal name required"),
    registrationNumber: z.string().min(1, "Registration number required"),
    taxId: z.string().optional(),
    email: z.string().email("Invalid email"),
    phone: z.string().min(5, "Phone required"),
    website: z.string().url("Must be valid URL").optional().or(z.literal('')),
    address: z.string().min(5, "Address required"),
    city: z.string().min(2, "City required"),
    country: z.string().min(2, "Country required"),
    tier: z.enum(['standard', 'premium', 'enterprise']),
    status: z.enum(['active', 'inactive', 'pending']),
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: CompanyFormValues) => void;
    initialData?: Company | null;
    isLoading?: boolean;
}

export function CompanyDialog({ open, onOpenChange, onSubmit, initialData, isLoading }: CompanyDialogProps) {
    const form = useForm<CompanyFormValues>({
        resolver: zodResolver(companySchema),
        defaultValues: {
            name: '',
            legalName: '',
            registrationNumber: '',
            taxId: '',
            email: '',
            phone: '',
            website: '',
            address: '',
            city: '',
            country: '',
            tier: 'standard',
            status: 'pending',
        },
    });

    React.useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    name: initialData.name,
                    legalName: initialData.legalName,
                    registrationNumber: initialData.registrationNumber,
                    taxId: initialData.taxId || '',
                    email: initialData.email,
                    phone: initialData.phone,
                    website: initialData.website || '',
                    address: initialData.address,
                    city: initialData.city,
                    country: initialData.country,
                    tier: initialData.tier,
                    status: initialData.status,
                });
            } else {
                form.reset({
                    name: '',
                    legalName: '',
                    registrationNumber: '',
                    taxId: '',
                    email: '',
                    phone: '',
                    website: '',
                    address: '',
                    city: '',
                    country: '',
                    tier: 'standard',
                    status: 'pending',
                });
            }
        }
    }, [open, initialData, form]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl rounded-3xl bg-white/95 backdrop-blur-xl border-white/20 p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-extrabold text-gray-900">
                        {initialData ? 'Edit Company' : 'Add New Company'}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        {/* Company Info */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-900 border-b pb-2">Company Information</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-gray-700">Company Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="TravelPro Inc" {...field} className="h-11 border-gray-200 bg-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="legalName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-gray-700">Legal Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="TravelPro International Inc." {...field} className="h-11 border-gray-200 bg-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="registrationNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-gray-700">Registration Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="REG-2024-001" {...field} className="h-11 border-gray-200 bg-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="taxId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-gray-700">Tax ID (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="TAX-12345" {...field} className="h-11 border-gray-200 bg-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-900 border-b pb-2">Contact Information</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-gray-700">Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="contact@company.com" {...field} className="h-11 border-gray-200 bg-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-gray-700">Phone</FormLabel>
                                            <FormControl>
                                                <Input placeholder="+1-555-0123" {...field} className="h-11 border-gray-200 bg-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="website"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel className="font-bold text-gray-700">Website (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://company.com" {...field} className="h-11 border-gray-200 bg-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-900 border-b pb-2">Address</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem className="col-span-3">
                                            <FormLabel className="font-bold text-gray-700">Street Address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="123 Business Ave" {...field} className="h-11 border-gray-200 bg-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-gray-700">City</FormLabel>
                                            <FormControl>
                                                <Input placeholder="New York" {...field} className="h-11 border-gray-200 bg-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="country"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-gray-700">Country</FormLabel>
                                            <FormControl>
                                                <Input placeholder="USA" {...field} className="h-11 border-gray-200 bg-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="tier"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-gray-700">Tier</FormLabel>
                                            <FormControl>
                                                <select
                                                    {...field}
                                                    className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                >
                                                    <option value="standard">Standard</option>
                                                    <option value="premium">Premium</option>
                                                    <option value="enterprise">Enterprise</option>
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
                                            <FormLabel className="font-bold text-gray-700">Status</FormLabel>
                                            <FormControl>
                                                <select
                                                    {...field}
                                                    className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="active">Active</option>
                                                    <option value="inactive">Inactive</option>
                                                </select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 sm:justify-between pt-4 border-t border-gray-100">
                            <Button type="button" variant="ghost" className="rounded-xl font-bold h-12" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="rounded-xl font-extrabold px-8 h-12 bg-gray-900 hover:bg-primary transition-all shadow-xl"
                            >
                                {isLoading ? 'Saving...' : 'Save Company'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
