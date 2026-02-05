import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Users, Calendar, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';

// We'll define a local interface for the dependent data we need
export interface DependentData {
    id?: string;
    firstName: string;
    lastName: string;
    relation: string;
    gender: 'MALE' | 'FEMALE' | 'NON_BINARY';
    dob: string;
    email?: string;
    passportNo?: string;
}

const dependentSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    relation: z.string().min(1, "Relation is required"),
    gender: z.enum(['MALE', 'FEMALE', 'NON_BINARY']),
    dob: z.string().min(1, "Date of birth is required"),
    email: z.string().email("Invalid email").optional().or(z.literal('')),
    passportNo: z.string().optional(),
});

interface DependentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: DependentData;
    onSave: (data: DependentData) => void;
}

export function DependentDialog({ open, onOpenChange, initialData, onSave }: DependentDialogProps) {
    const form = useForm<z.infer<typeof dependentSchema>>({
        resolver: zodResolver(dependentSchema),
        defaultValues: {
            firstName: initialData?.firstName || '',
            lastName: initialData?.lastName || '',
            relation: initialData?.relation || '',
            gender: initialData?.gender || 'MALE',
            dob: initialData?.dob || '',
            email: initialData?.email || '',
            passportNo: initialData?.passportNo || '',
        },
    });

    React.useEffect(() => {
        if (open) {
            form.reset({
                firstName: initialData?.firstName || '',
                lastName: initialData?.lastName || '',
                relation: initialData?.relation || '',
                gender: initialData?.gender || 'MALE',
                dob: initialData?.dob || '',
                email: initialData?.email || '',
                passportNo: initialData?.passportNo || '',
            });
        }
    }, [open, initialData, form]);

    const onSubmit = (values: z.infer<typeof dependentSchema>) => {
        onSave({ ...values, id: initialData?.id } as DependentData);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black flex items-center gap-2">
                        <Users className="h-6 w-6 text-pink-600" />
                        {initialData ? 'Edit Dependent' : 'Add Dependent'}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="firstName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">First Name *</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Jane" className="h-11 rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="lastName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Last Name *</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Doe" className="h-11 rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="relation" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Relation *</FormLabel>
                                    <FormControl>
                                        <select {...field} className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm">
                                            <option value="">Select relation</option>
                                            <option value="Spouse">Spouse</option>
                                            <option value="Child">Child</option>
                                            <option value="Parent">Parent</option>
                                            <option value="Sibling">Sibling</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="gender" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Gender *</FormLabel>
                                    <FormControl>
                                        <select {...field} className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm">
                                            <option value="MALE">Male</option>
                                            <option value="FEMALE">Female</option>
                                            <option value="NON_BINARY">Non Binary</option>
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="dob" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Date of Birth *</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} className="h-11 rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Email (Optional)</FormLabel>
                                    <FormControl>
                                        <Input type="email" {...field} placeholder="jane.doe@example.com" className="h-11 rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="passportNo" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-gray-700">Passport Number (Optional)</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Passport Number" className="h-11 rounded-xl" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Cancel</Button>
                            <Button type="submit" className="bg-gray-900 hover:bg-primary rounded-xl font-bold">
                                {initialData ? 'Update Dependent' : 'Add Dependent'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
