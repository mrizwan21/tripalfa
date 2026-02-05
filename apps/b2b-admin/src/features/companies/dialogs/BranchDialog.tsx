import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import MapboxAddressPicker, { Address } from '@/components/MapboxAddressPicker';
import { Branch } from '../types';

const branchSchema = z.object({
    name: z.string().min(2, "Branch name required"),
    code: z.string().min(2, "Branch code required"),
    iataCode: z.string().optional(),
    officeId: z.string().optional(),
    phone: z.string().min(5, "Phone required"),
    email: z.string().email("Invalid email"),
    status: z.enum(['active', 'inactive']),
});

type BranchFormValues = z.infer<typeof branchSchema>;

interface BranchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: BranchFormValues & { address?: Address }) => void;
    initialData?: Branch | null;
    isLoading?: boolean;
}

export function BranchDialog({ open, onOpenChange, onSubmit, initialData, isLoading }: BranchDialogProps) {
    const [selectedAddress, setSelectedAddress] = React.useState<Address | undefined>();

    const form = useForm<BranchFormValues>({
        resolver: zodResolver(branchSchema),
        defaultValues: {
            name: '',
            code: '',
            iataCode: '',
            officeId: '',
            phone: '',
            email: '',
            status: 'active',
        },
    });

    React.useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    name: initialData.name,
                    code: initialData.code,
                    iataCode: initialData.iataCode || '',
                    officeId: initialData.officeId || '',
                    phone: initialData.phone,
                    email: initialData.email,
                    status: initialData.status,
                });
                setSelectedAddress(initialData.address);
            } else {
                form.reset({
                    name: '',
                    code: '',
                    iataCode: '',
                    officeId: '',
                    phone: '',
                    email: '',
                    status: 'active',
                });
                setSelectedAddress(undefined);
            }
        }
    }, [open, initialData, form]);

    const handleSubmit = (values: BranchFormValues) => {
        onSubmit({ ...values, address: selectedAddress });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl rounded-3xl bg-white/95 backdrop-blur-xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-extrabold text-gray-900">
                        {initialData ? 'Edit Branch' : 'Add New Branch'}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Branch Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Dubai Main Office" {...field} className="h-11 border-gray-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Branch Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="DXB-001" {...field} className="h-11 border-gray-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* IATA & Office ID */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="iataCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">IATA Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="DXB01" {...field} className="h-11 border-gray-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="officeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Office ID</FormLabel>
                                        <FormControl>
                                            <Input placeholder="OFF-DXB-001" {...field} className="h-11 border-gray-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Contact */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+971-4-555-1234" {...field} className="h-11 border-gray-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="branch@company.com" {...field} className="h-11 border-gray-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Status */}
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Status</FormLabel>
                                    <FormControl>
                                        <select
                                            {...field}
                                            className="flex h-11 w-full items-center rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Address with Mapbox */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Office Address</label>
                            <MapboxAddressPicker
                                value={selectedAddress}
                                onChange={setSelectedAddress}
                                placeholder="Search for branch address..."
                            />
                        </div>

                        <DialogFooter className="gap-2 pt-4 border-t border-gray-100">
                            <Button type="button" variant="ghost" className="rounded-xl font-bold h-11" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="rounded-xl font-extrabold px-8 h-11 bg-gray-900 hover:bg-primary shadow-xl"
                            >
                                {isLoading ? 'Saving...' : 'Save Branch'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
