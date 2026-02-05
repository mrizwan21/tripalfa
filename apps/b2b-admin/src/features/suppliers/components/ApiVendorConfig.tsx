import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
    Globe,
    Settings2,
    ShieldAlert,
    CheckCircle2,
    Zap,
    ArrowRight,
    Shield,
    Key,
    Terminal,
    Plus,
    Activity
} from 'lucide-react';

const MOCK_VENDORS = [
    {
        id: '1',
        name: 'Amadeus Enterprise',
        type: 'GDS',
        status: 'ACTIVE',
        healthStatus: 'HEALTHY',
        lastHealthCheck: '2024-03-28T11:15:00Z',
        endpoint: 'https://api.amadeus.com/v2',
        auth: 'OAUTH2'
    },
    {
        id: '2',
        name: 'Duffel Aviation',
        type: 'AGGREGATOR',
        status: 'ACTIVE',
        healthStatus: 'HEALTHY',
        lastHealthCheck: '2024-03-28T11:22:00Z',
        endpoint: 'https://api.duffel.com',
        auth: 'BEARER'
    },
    {
        id: '3',
        name: 'LiteAPI Global',
        type: 'DIRECT',
        status: 'ACTIVE',
        healthStatus: 'DEGRADED',
        lastHealthCheck: '2024-03-28T11:20:00Z',
        endpoint: 'https://lite.api.travel/v1',
        auth: 'API_KEY'
    }
];

interface ApiVendorConfigProps {
    onAdd?: () => void;
}

export function ApiVendorConfig({ onAdd }: ApiVendorConfigProps) {
    const [vendors, setVendors] = useState<any[]>(MOCK_VENDORS);
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        const fetchVendors = async () => {
            try {
                const response = await fetch('/api/v1/admin/api-vendors');
                if (response.ok) {
                    const data = await response.json();
                    const liveVendors = data.map((v: any) => ({
                        id: v.id,
                        name: v.name,
                        type: 'API',
                        status: 'ACTIVE',
                        healthStatus: 'HEALTHY',
                        lastHealthCheck: new Date().toISOString(),
                        endpoint: v.baseUrl,
                        auth: v.authType.toUpperCase()
                    }));
                    setVendors([...MOCK_VENDORS, ...liveVendors]);
                }
            } catch (error) {
                console.error('Failed to fetch vendors:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchVendors();
    }, []);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {vendors.map((vendor) => (
                <Card key={vendor.id} className="rounded-[2.5rem] border-secondary-100 dark:border-secondary-800 shadow-xl shadow-secondary-100/30 overflow-hidden group hover:shadow-2xl transition-all">
                    <CardHeader className="p-8 pb-0 flex flex-row items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-[1.25rem] bg-secondary-900 flex items-center justify-center text-white shadow-lg shrink-0">
                                <Globe size={28} />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tight">{vendor.name}</CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="rounded-lg text-[9px] font-black uppercase tracking-widest border-secondary-200">
                                        {vendor.type}
                                    </Badge>
                                    <span className="text-[10px] font-bold text-secondary-400">Auth: {vendor.auth}</span>
                                </div>
                            </div>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${vendor.healthStatus === 'HEALTHY' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                            <Activity size={12} className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">{vendor.healthStatus}</span>
                        </div>
                    </CardHeader>

                    <CardContent className="p-8 pt-6 space-y-6">
                        <div className="bg-secondary-50/50 dark:bg-secondary-900/50 p-6 rounded-3xl border border-secondary-100 dark:border-secondary-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Terminal size={14} className="text-secondary-400" />
                                    <span className="text-[10px] font-black text-secondary-500 uppercase tracking-widest italic">Base Endpoint</span>
                                </div>
                                <Button variant="ghost" size="sm" className="h-6 text-[9px] font-black hover:bg-white text-primary uppercase tracking-widest">
                                    Copy URL
                                </Button>
                            </div>
                            <code className="block text-xs font-mono font-bold text-secondary-700 dark:text-secondary-300 break-all select-all">
                                {vendor.endpoint}
                            </code>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" className="h-12 rounded-2xl border-secondary-100 dark:border-secondary-800 font-bold gap-2 hover:bg-secondary-50 transition-all">
                                <Key size={16} />
                                Manage Credentials
                            </Button>
                            <Button variant="outline" className="h-12 rounded-2xl border-secondary-100 dark:border-secondary-800 font-bold gap-2 hover:bg-secondary-50 transition-all">
                                <Settings2 size={16} />
                                Endpoint Settings
                            </Button>
                        </div>
                    </CardContent>

                    <div className="p-4 bg-secondary-50 dark:bg-secondary-900 flex justify-between items-center border-t border-secondary-100 dark:border-secondary-800">
                        <span className="text-[9px] font-bold text-secondary-400 uppercase tracking-widest pl-4">Last Check: {new Date(vendor.lastHealthCheck).toLocaleTimeString()}</span>
                        <Button size="sm" className="rounded-xl h-8 bg-white dark:bg-secondary-800 shadow-sm border border-secondary-200 dark:border-secondary-700 font-black text-[9px] uppercase tracking-widest text-secondary-600 hover:text-primary transition-colors">
                            Test Connection
                            <ArrowRight size={10} className="ml-2" />
                        </Button>
                    </div>
                </Card>
            ))}

            {/* Empty state or Add Vendor card */}
            <Card
                onClick={onAdd}
                className="rounded-[2.5rem] border-dash border-2 border-secondary-200 dark:border-secondary-800 bg-transparent flex flex-col items-center justify-center p-8 min-h-[300px] group cursor-pointer hover:border-primary-500/50 hover:bg-slate-50/30 transition-all"
            >
                <div className="h-16 w-16 bg-white dark:bg-secondary-900 rounded-full flex items-center justify-center text-secondary-300 group-hover:text-primary group-hover:scale-110 shadow-sm transition-all">
                    <Plus size={32} />
                </div>
                <h3 className="mt-4 font-black text-secondary-400 group-hover:text-secondary-900 dark:group-hover:text-white transition-colors">Add API Vendor</h3>
                <p className="text-[10px] font-bold text-secondary-400 mt-1 uppercase tracking-widest">New GDS or API Provider</p>
            </Card>
        </div>
    );
}
