import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, FileText, Calendar } from 'lucide-react';
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
    FormDescription,
} from '@/components/ui/form';
import { UserDocument } from '../types';

const documentSchema = z.object({
    title: z.string().min(1, "Document title is required"),
    fileType: z.string().default('application/pdf'), // Simplified for now
    uploadDate: z.string().default(() => new Date().toISOString().split('T')[0]),
});

interface DocumentUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: Partial<UserDocument>) => void;
}

export function DocumentUploadDialog({ open, onOpenChange, onSave }: DocumentUploadDialogProps) {
    const form = useForm<z.infer<typeof documentSchema>>({
        resolver: zodResolver(documentSchema),
        defaultValues: {
            title: '',
            fileType: 'application/pdf',
        },
    });

    React.useEffect(() => {
        if (open) {
            form.reset({
                title: '',
                fileType: 'application/pdf',
            });
        }
    }, [open, form]);

    const onSubmit = (values: z.infer<typeof documentSchema>) => {
        // In a real app, we would handle the file upload here
        onSave({
            ...values,
            fileUrl: '#',
            id: `doc-${Date.now()}`
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black flex items-center gap-2">
                        <Upload className="h-6 w-6 text-blue-600" />
                        Upload Document
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-gray-700">Document Title *</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="e.g. Passport Copy" className="h-11 rounded-xl" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* File Upload Simulation */}
                        <div className="border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                            <Upload className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500 font-bold text-sm">Click to upload or drag and drop</p>
                            <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (max 5MB)</p>
                        </div>

                        <FormField control={form.control} name="fileType" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-gray-700">Document Type</FormLabel>
                                <FormControl>
                                    <select {...field} className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm">
                                        <option value="application/pdf">PDF Document</option>
                                        <option value="image/jpeg">JPEG Image</option>
                                        <option value="image/png">PNG Image</option>
                                    </select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Cancel</Button>
                            <Button type="submit" className="bg-gray-900 hover:bg-primary rounded-xl font-bold">
                                Upload
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
