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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Globe,
    Zap,
    Settings2,
    Link as LinkIcon,
    MapPin,
    Box,
    ShieldCheck,
    Terminal,
    Activity,
    Trash2,
    Plus
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/checkbox';

interface ApiOnboardingFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ApiOnboardingForm({ open, onOpenChange }: ApiOnboardingFormProps) {
    const [activeTab, setActiveTab] = useState('basic');
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        baseUrl: '',
        authType: 'bearer',
        apiKey: '••••••••••••••••',
        mappings: [
            { action: 'SEARCH', path: '/offers', method: 'POST' },
            { action: 'HOLD', path: '/orders', method: 'POST' },
            { action: 'CONFIRM', path: '/payments', method: 'POST' },
            { action: 'CANCEL', path: '/orders/{id}/cancel', method: 'DELETE' },
        ]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/v1/admin/api-vendors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    code: formData.code,
                    baseUrl: formData.baseUrl,
                    authType: formData.authType,
                    credentials: { key: formData.apiKey },
                    mappings: formData.mappings
                })
            });

            if (response.ok) {
                onOpenChange(false);
                setActiveTab('basic');
            }
        } catch (error) {
            console.error('Failed to save API vendor:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl rounded-[3rem] bg-white/95 backdrop-blur-2xl border-secondary-100 dark:border-secondary-800 dark:bg-secondary-950/95 p-0 overflow-hidden shadow-2xl flex flex-col h-[90vh]">
                {/* Visual Header */}
                <div className="bg-slate-950 px-10 py-10 text-white shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-3xl font-black tracking-tighter flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary-600 flex items-center justify-center">
                                    <Zap size={24} className="fill-current" />
                                </div>
                                API Vendor Onboarding
                            </DialogTitle>
                            <DialogDescription className="text-secondary-400 font-bold mt-2 uppercase tracking-widest text-[10px]">
                                Configure technical endpoints, security, and module-region mapping.
                            </DialogDescription>
                        </div>
                        <Badge className="bg-primary-600/20 text-primary-400 border-primary-600/30 rounded-full px-4 py-1 font-black text-[10px] uppercase">
                            Draft Status
                        </Badge>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
                        <TabsList className="bg-white/5 p-1 rounded-2xl border border-white/10 gap-1">
                            <TabsTrigger value="basic" className="rounded-xl font-bold py-2 px-6 data-[state=active]:bg-white data-[state=active]:text-black">
                                1. Connection
                            </TabsTrigger>
                            <TabsTrigger value="endpoints" className="rounded-xl font-bold py-2 px-6 data-[state=active]:bg-white data-[state=active]:text-black">
                                2. Endpoints & Mapping
                            </TabsTrigger>
                            <TabsTrigger value="scope" className="rounded-xl font-bold py-2 px-6 data-[state=active]:bg-white data-[state=active]:text-black">
                                3. Products & Regions
                            </TabsTrigger>
                            <TabsTrigger value="test" className="rounded-xl font-bold py-2 px-6 data-[state=active]:bg-white data-[state=active]:text-black">
                                4. Validation
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="flex-1 overflow-y-auto p-10 bg-secondary-50/30 dark:bg-transparent">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
                        {/* Tab 1: Basic Connection */}
                        <TabsContent value="basic" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-secondary-500">Vendor Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Duffel Air API"
                                        className="h-14 rounded-2xl border-secondary-100 font-black shadow-sm"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-secondary-500">System Code</Label>
                                    <Input
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="VND-DUF-01"
                                        className="h-14 rounded-2xl border-secondary-100 font-black shadow-sm uppercase tracking-widest"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-secondary-500">Base API Endpoint (Production)</Label>
                                <div className="flex gap-3">
                                    <Input
                                        value={formData.baseUrl}
                                        onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                                        placeholder="https://api.provider.com/v1"
                                        className="h-14 rounded-2xl border-secondary-100 font-black shadow-sm flex-1"
                                    />
                                    <Button variant="outline" className="h-14 w-14 rounded-2xl border-secondary-100 bg-white shadow-sm">
                                        <Globe size={20} />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-secondary-500">Auth Method</Label>
                                    <Select value={formData.authType} onValueChange={(v) => setFormData({ ...formData, authType: v })}>
                                        <SelectTrigger className="h-14 rounded-2xl font-black">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl">
                                            <SelectItem value="bearer" className="py-3">Bearer Token (OAuth2)</SelectItem>
                                            <SelectItem value="apikey" className="py-3">API Key (Header)</SelectItem>
                                            <SelectItem value="basic" className="py-3">Basic Auth (Base64)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-secondary-500">Access Token / Key</Label>
                                    <Input
                                        type="password"
                                        value={formData.apiKey}
                                        onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                                        className="h-14 rounded-2xl border-secondary-100 font-black shadow-sm"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab 2: Endpoint & Module Mapping */}
                        <TabsContent value="endpoints" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="rounded-3xl border border-secondary-100 bg-white p-2">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-secondary-50">
                                            <th className="p-5 text-[10px] font-black uppercase text-secondary-400">Module Action</th>
                                            <th className="p-5 text-[10px] font-black uppercase text-secondary-400">Endpoint Path</th>
                                            <th className="p-5 text-[10px] font-black uppercase text-secondary-400">Method</th>
                                            <th className="p-5 text-[10px] font-black uppercase text-secondary-400 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-secondary-50">
                                        {formData.mappings.map((ep, index) => (
                                            <tr key={ep.action} className="group">
                                                <td className="p-5 font-black text-secondary-900 text-sm">{ep.action}</td>
                                                <td className="p-5">
                                                    <Input
                                                        value={ep.path}
                                                        onChange={(e) => {
                                                            const newMappings = [...formData.mappings];
                                                            newMappings[index].path = e.target.value;
                                                            setFormData({ ...formData, mappings: newMappings });
                                                        }}
                                                        className="h-10 text-xs font-bold text-primary-700 bg-secondary-50 border-none"
                                                    />
                                                </td>
                                                <td className="p-5">
                                                    <Badge variant="outline" className="rounded-lg font-black text-[9px] uppercase tracking-widest border-secondary-200">
                                                        {ep.method}
                                                    </Badge>
                                                </td>
                                                <td className="p-5 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            const newMappings = formData.mappings.filter((_, i) => i !== index);
                                                            setFormData({ ...formData, mappings: newMappings });
                                                        }}
                                                        className="rounded-full h-8 w-8 text-secondary-300 hover:text-rose-500 hover:bg-rose-50"
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Button
                                onClick={() => {
                                    setFormData({ ...formData, mappings: [...formData.mappings, { action: 'CUSTOM', path: '/', method: 'POST' }] });
                                }}
                                className="w-full h-12 rounded-2xl bg-secondary-50 border border-secondary-100 text-secondary-600 font-black text-[10px] uppercase tracking-widest hover:bg-secondary-100 shadow-none" > <Plus size={16} className="mr-2" />
                                Add Custom Endpoint Mapping
                            </Button>
                        </TabsContent>

                        {/* Tab 3: Products & Regions Mapping */}
                        <TabsContent value="scope" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-2 gap-10">
                                {/* Products Grid */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                            <Box size={16} />
                                        </div>
                                        <h4 className="text-sm font-black text-secondary-900 uppercase tracking-widest">Supported Products</h4>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {['Flights - GDS', 'Flights - NDC', 'Hotels - B2B', 'Insurance (Ancillary)', 'Transfers & Ground'].map(product => (
                                            <div key={product} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-secondary-100 shadow-sm hover:border-primary-500/30 transition-all group">
                                                <span className="text-sm font-bold text-secondary-700">{product}</span>
                                                <Checkbox className="rounded-md h-5 w-5 data-[state=checked]:bg-primary-600 border-secondary-300" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Regions Grid */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <MapPin size={16} />
                                        </div>
                                        <h4 className="text-sm font-black text-secondary-900 uppercase tracking-widest">Operational Regions</h4>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {['Global (Worldwide)', 'GCC / Middle East', 'Europe (EEA)', 'Asia Pacific', 'North America'].map(region => (
                                            <div key={region} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-secondary-100 shadow-sm hover:border-primary-500/30 transition-all">
                                                <span className="text-sm font-bold text-secondary-700">{region}</span>
                                                <Checkbox className="rounded-md h-5 w-5 data-[state=checked]:bg-primary-600 border-secondary-300" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab 4: Validation & Simulation */}
                        <TabsContent value="test" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
                            <div className="bg-secondary-900 rounded-[2rem] p-8 text-white h-[300px] flex flex-col font-mono relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4">
                                    <Badge className="bg-emerald-500 text-white border-none">Simulating Connectivity...</Badge>
                                </div>
                                <div className="space-y-2 text-xs">
                                    <p className="text-emerald-400 font-bold">{`$ curl -X POST "${formData.baseUrl || '{BASE_URL}'}/offers' \\`}</p>
                                    <p className="text-secondary-400 pl-4">{` -H "Authorization: ${formData.authType === 'bearer' ? 'Bearer' : 'X-Api-Key'}: {TOKEN}' \\`}</p>
                                    <p className="text-secondary-400 pl-4">{` -d '{"origin": "LHR', "destination": "DXB"}'`}</p>
                                    <p className="mt-4 text-secondary-500 border-t border-white/10 pt-4 cursor-default">
                                        Waiting for connection test...
                                    </p>
                                </div>
                                <div className="mt-auto flex justify-between items-center text-[10px] text-secondary-500">
                                    <span>{formData.code || 'VND-NEW-01'}</span>
                                    <span>TRIPALFA-CORE-V1</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button className="flex-1 h-16 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
                                    Run Connectivity Test
                                </Button>
                                <Button variant="outline" className="h-16 rounded-[1.5rem] border-secondary-100 font-black text-xs uppercase tracking-widest px-8">
                                    Download Schema
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <DialogFooter className="p-10 shrink-0 bg-white border-t border-secondary-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="text-emerald-500" size={20} />
                        <span className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest">Technically Validated Configuration</span>
                    </div>
                    <div className="flex gap-4 w-full sm:w-auto">
                        <Button variant="ghost" disabled={isSubmitting} onClick={() => onOpenChange(false)} className="h-14 rounded-2xl font-black px-8">Cancel</Button>
                        <Button
                            disabled={isSubmitting}
                            onClick={handleSave}
                            className="h-14 rounded-2xl bg-secondary-900 text-white font-black px-12 shadow-xl active:scale-95 transition-all"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Configuration'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
