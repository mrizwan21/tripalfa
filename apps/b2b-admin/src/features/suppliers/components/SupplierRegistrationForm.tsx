import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/Select';
import {
    Building2,
    ShieldCheck,
    Globe,
    Zap,
    Info,
    CreditCard,
    Briefcase
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface SupplierRegistrationFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SupplierRegistrationForm({ open, onOpenChange }: SupplierRegistrationFormProps) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        category: 'GDS',
        vendorId: '1',
        currency: 'USD',
        paymentTerms: 'NET',
        isPreferred: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/v1/admin/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    code: formData.code,
                    category: formData.category,
                    vendorId: formData.vendorId, // In a real app, this would be a real ID
                    settings: {
                        preferred: formData.isPreferred,
                        currency: formData.currency,
                        paymentTerms: formData.paymentTerms
                    }
                })
            });

            if (response.ok) {
                onOpenChange(false);
                setStep(1);
                // In a real app, we'd trigger a list refresh here
            }
        } catch (error) {
            console.error('Failed to onboard supplier:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl rounded-[3rem] bg-white/95 backdrop-blur-2xl border-secondary-100 dark:border-secondary-800 dark:bg-secondary-950/95 p-0 overflow-hidden shadow-2xl">
                <div className="bg-secondary-950 dark:bg-black px-10 py-12 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary-600 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-20" />

                    <div className="relative z-10 flex justify-between items-center">
                        <DialogHeader>
                            <DialogTitle className="text-4xl font-black tracking-tighter flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary-600 flex items-center justify-center">
                                    <Building2 size={28} className="text-white" />
                                </div>
                                Supplier Onboarding
                            </DialogTitle>
                            <DialogDescription className="text-secondary-400 font-bold text-lg mt-3 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                                Step {step} of 3: {step === 1 ? 'Core Identification' : step === 2 ? 'Technical & API mapping' : 'Financials & Terms'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex gap-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`h-1.5 w-8 rounded-full transition-all duration-500 ${step >= i ? 'bg-primary-500' : 'bg-secondary-800'}`} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-10 min-h-[460px]">
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-5 duration-500">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-secondary-500 flex items-center gap-2">
                                        <Info size={14} className="text-primary-600" />
                                        Supplier Legal Name
                                    </Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Amadeus IT Group"
                                        className="h-14 rounded-2xl border-secondary-100 dark:border-secondary-800 font-black bg-secondary-50/30 px-6 text-secondary-900"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-secondary-500">Unique Provider Code</Label>
                                    <Input
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="e.g. AMD-HQ"
                                        className="h-14 rounded-2xl border-secondary-100 dark:border-secondary-800 font-black bg-secondary-50/30 px-6 uppercase tracking-widest"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-secondary-500 flex items-center gap-2">
                                        <Briefcase size={14} className="text-primary-600" />
                                        Category
                                    </Label>
                                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                                        <SelectTrigger className="h-14 rounded-2xl border-secondary-100 dark:border-secondary-800 font-black bg-secondary-50/30">
                                            <SelectValue placeholder="Select primary service" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl shadow-2xl border-secondary-100">
                                            <SelectItem value="GDS" className="rounded-xl py-3 font-bold">Multi-Service GDS</SelectItem>
                                            <SelectItem value="HOTEL" className="rounded-xl py-3 font-bold">Hotel Aggregator</SelectItem>
                                            <SelectItem value="AIRLINE" className="rounded-xl py-3 font-bold">Direct Airline API</SelectItem>
                                            <SelectItem value="LOCAL" className="rounded-xl py-3 font-bold">Local Ground Handler</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3 text-center self-center">
                                    <div className="flex items-center justify-center gap-4 bg-secondary-50 dark:bg-secondary-900 p-4 rounded-2xl border border-secondary-100 dark:border-secondary-800">
                                        <div className="flex flex-col items-center">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-secondary-400 mb-2">Preferred Partner?</Label>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => setFormData({ ...formData, isPreferred: true })}
                                                    className={`h-8 w-16 rounded-xl text-[9px] font-black uppercase tracking-widest ${formData.isPreferred ? 'bg-white shadow-sm border border-secondary-200' : 'text-secondary-400'}`}
                                                >
                                                    Yes
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => setFormData({ ...formData, isPreferred: false })}
                                                    className={`h-8 w-16 rounded-xl text-[9px] font-black uppercase tracking-widest ${!formData.isPreferred ? 'bg-white shadow-sm border border-secondary-200' : 'text-secondary-400'}`}
                                                >
                                                    No
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-5 duration-500">
                            <div className="bg-primary-50/50 dark:bg-primary-900/10 rounded-3xl p-8 border border-primary-100 dark:border-primary-900/30 flex items-start gap-6">
                                <div className="h-14 w-14 shrink-0 rounded-[1.25rem] bg-white dark:bg-secondary-900 flex items-center justify-center text-primary-600 shadow-xl shadow-primary-600/5">
                                    <Globe size={28} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-primary-900 dark:text-primary-100 italic">API Mapping</h4>
                                    <p className="text-sm font-bold text-primary-700/70 dark:text-primary-400/70 mt-1 leading-relaxed">
                                        Link this supplier to an existing API Vendor configuration or create a new technical endpoint.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-secondary-500">Associated API Vendor</Label>
                                <Select value={formData.vendorId} onValueChange={(v) => setFormData({ ...formData, vendorId: v })}>
                                    <SelectTrigger className="h-16 rounded-[1.5rem] border-secondary-200 font-black bg-white shadow-sm">
                                        <SelectValue placeholder="Choose technical integration..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="1" className="py-4">Amadeus Enterprise GDS (Healthy)</SelectItem>
                                        <SelectItem value="2" className="py-4">Duffel Aviation Hub (Healthy)</SelectItem>
                                        <SelectItem value="CREATE" className="py-4 text-primary font-black">+ Set up New Technical Vendor</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-5 duration-500">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-secondary-500 flex items-center gap-2">
                                        <CreditCard size={14} className="text-primary-600" />
                                        Default Operational Currency
                                    </Label>
                                    <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                                        <SelectTrigger className="h-14 rounded-2xl font-black">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">US Dollar (USD)</SelectItem>
                                            <SelectItem value="EUR">Euro (EUR)</SelectItem>
                                            <SelectItem value="AED">UAE Dirham (AED)</SelectItem>
                                            <SelectItem value="SAR">Saudi Riyal (SAR)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-secondary-500">Payment Terms</Label>
                                    <Select value={formData.paymentTerms} onValueChange={(v) => setFormData({ ...formData, paymentTerms: v })}>
                                        <SelectTrigger className="h-14 rounded-2xl font-black">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NET">Net Rate</SelectItem>
                                            <SelectItem value="PREPAID">Prepaid / Wallet</SelectItem>
                                            <SelectItem value="CREDIT">Credit Limit (Monthly Settlement)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="bg-secondary-50/80 rounded-3xl p-8 border border-secondary-100 flex items-center gap-6">
                                <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-500 border border-secondary-100">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-secondary-900 uppercase tracking-widest">Compliance Check</h4>
                                    <p className="text-[10px] font-bold text-secondary-500 mt-1 uppercase tracking-tight">Onboarding this supplier will automatically generate a draft contract for matching categories.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-10 bg-secondary-50/50 dark:bg-secondary-900/50 flex-col sm:flex-row gap-4 border-t border-secondary-100 dark:border-secondary-800">
                    <Button
                        variant="ghost"
                        disabled={isSubmitting}
                        onClick={() => step > 1 ? setStep(s => s - 1) : onOpenChange(false)}
                        className="rounded-2xl font-black h-14 bg-white dark:bg-secondary-800 border-secondary-100 dark:border-secondary-700 px-8 active:scale-95"
                    >
                        {step === 1 ? 'Cancel' : 'Previous Step'}
                    </Button>
                    <Button
                        disabled={isSubmitting}
                        onClick={() => step < 3 ? setStep(s => s + 1) : handleSubmit()}
                        className="flex-1 rounded-[1.5rem] font-black h-14 bg-primary-600 hover:bg-primary-700 text-white shadow-2xl shadow-primary-600/20 active:scale-95"
                    >
                        {isSubmitting ? 'Onboarding...' : (step < 3 ? 'Continue to Next Step' : 'Finish Onboarding')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
