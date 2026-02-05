import React, { useState } from 'react';
import {
    Settings,
    Globe,
    Shield,
    Bell,
    Palette,
    Smartphone,
    Mail,
    Lock,
    Languages,
    Coins,
    Map,
    Database,
    History,
    Save,
    CheckCircle2,
    Monitor,
    Layout,
    Type
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import { useParams, useNavigate } from 'react-router-dom';

export function SettingsManagementPage() {
    const { tab } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = React.useState(tab || 'general');

    React.useEffect(() => {
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [tab]);

    const handleTabChange = (val: string) => {
        setActiveTab(val);
        navigate(`/settings/${val}`);
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 animate-in fade-in duration-700">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-5">
                        <div className="h-16 w-16 rounded-[2rem] bg-gray-900 text-white flex items-center justify-center shadow-2xl shadow-gray-400 rotate-3 transition-transform hover:rotate-0 duration-500">
                            <Settings className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">System Intelligence</h1>
                            <p className="text-gray-500 font-medium">B2B Core Architecture & Governance Configuration</p>
                        </div>
                    </div>
                    <Button className="h-14 px-10 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/20 hover:-translate-y-1 transition-all">
                        <Save className="h-5 w-5 mr-3" />
                        Deploy Changes
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Nav */}
                    <div className="space-y-3">
                        {[
                            { id: 'general', label: 'Global Strategy', icon: Globe, desc: 'Languages & Currencies' },
                            { id: 'security', label: 'Security Command', icon: Shield, desc: 'Firewall & Access' },
                            { id: 'branding', label: 'Visual Identity', icon: Palette, desc: 'Themes & Assets' },
                            { id: 'notifications', label: 'Alert Gateway', icon: Bell, desc: 'Email & SMS Routing' },
                            { id: 'advanced', label: 'Engine Config', icon: Database, desc: 'API & Performance' }
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleTabChange(item.id)}
                                className={`w-full flex items-center gap-4 p-5 rounded-[2rem] transition-all duration-300 group ${activeTab === item.id
                                    ? 'bg-gray-900 text-white shadow-2xl shadow-gray-300 translate-x-3'
                                    : 'bg-white text-gray-400 hover:bg-white hover:shadow-xl hover:text-gray-900'
                                    }`}
                            >
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${activeTab === item.id ? 'bg-white/10 text-primary' : 'bg-gray-50 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'
                                    }`}>
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-sm uppercase tracking-widest leading-none mb-1">{item.label}</p>
                                    <p className={`text-[10px] font-bold ${activeTab === item.id ? 'text-indigo-200' : 'text-gray-400'}`}>{item.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3 space-y-8 animate-in slide-in-from-right-10 duration-700">
                        {activeTab === 'general' && (
                            <div className="space-y-8">
                                <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                                        <Globe className="h-64 w-64" />
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900 mb-8 border-b border-gray-50 pb-6 flex items-center gap-3">
                                        <Languages className="h-8 w-8 text-primary" />
                                        Regional Strategy
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Default Locale</Label>
                                                <select className="w-full h-14 bg-gray-50 border-none rounded-2xl px-5 font-bold text-gray-900 focus:ring-1 focus:ring-primary/20 outline-none">
                                                    <option>English (United States)</option>
                                                    <option>English (United Kingdom)</option>
                                                    <option>Arabic (UAE)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Primary Currency</Label>
                                                <select className="w-full h-14 bg-gray-50 border-none rounded-2xl px-5 font-bold text-gray-900 focus:ring-1 focus:ring-primary/20 outline-none">
                                                    <option>USD - United States Dollar</option>
                                                    <option>AED - UAE Dirham</option>
                                                    <option>EUR - Euro</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="bg-primary/5 rounded-[2.5rem] p-8 border border-primary/10">
                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Currency Auto-Sync</h4>
                                            <div className="flex items-center justify-between mb-6">
                                                <span className="text-sm font-bold text-gray-600">Enable real-time exchange rate updates</span>
                                                <Switch checked={true} />
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-medium leading-relaxed italic">The system uses OpenExchangeRates API for mid-market rate fetching every 60 minutes.</p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10">
                                    <h2 className="text-3xl font-black text-gray-900 mb-8 border-b border-gray-50 pb-6 flex items-center gap-3">
                                        <Map className="h-8 w-8 text-indigo-500" />
                                        Operational Markets
                                    </h2>
                                    <div className="flex flex-wrap gap-3">
                                        {['United Arab Emirates', 'Saudi Arabia', 'United Kingdom', 'USA', 'India', 'Qatar'].map((country) => (
                                            <Badge key={country} className="bg-gray-50 text-gray-900 border border-gray-100 hover:bg-primary/5 hover:border-primary/20 transition-all px-6 py-2.5 rounded-2xl font-black text-xs cursor-pointer">
                                                {country}
                                                <CheckCircle2 className="h-3 w-3 ml-2 text-emerald-500" />
                                            </Badge>
                                        ))}
                                        <Button variant="ghost" className="rounded-2xl border-2 border-dashed border-gray-100 px-6 font-bold text-gray-400 hover:text-primary">
                                            + Add Market
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'branding' && (
                            <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10 overflow-hidden">
                                <h2 className="text-3xl font-black text-gray-900 mb-8 border-b border-gray-50 pb-6 flex items-center gap-3">
                                    <Palette className="h-8 w-8 text-rose-500" />
                                    Portal Aesthetics
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <Label className="text-xs font-black uppercase text-gray-400 tracking-widest">Global Brand Colors</Label>
                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="h-14 w-14 rounded-2xl bg-primary shadow-lg shadow-primary/20 cursor-pointer border-4 border-white ring-1 ring-gray-100" />
                                                    <span className="text-[10px] font-black text-gray-500">Primary</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="h-14 w-14 rounded-2xl bg-gray-900 shadow-lg shadow-gray-200 cursor-pointer border-4 border-white ring-1 ring-gray-100" />
                                                    <span className="text-[10px] font-black text-gray-500">Neutral</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="h-14 w-14 rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-200 cursor-pointer border-4 border-white ring-1 ring-gray-100" />
                                                    <span className="text-[10px] font-black text-gray-500">Success</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-6 border-t border-gray-50">
                                            <Label className="text-xs font-black uppercase text-gray-400 tracking-widest">Portal Typography</Label>
                                            <div className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <Type className="h-6 w-6 text-gray-400" />
                                                    <div>
                                                        <p className="font-black text-gray-900">Inter Dynamic</p>
                                                        <p className="text-[10px] font-bold text-gray-500">Default Web Safe Font Stack</p>
                                                    </div>
                                                </div>
                                                <Button variant="outline" className="rounded-xl font-bold bg-white h-10 px-6">Change</Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <Label className="text-xs font-black uppercase text-gray-400 tracking-widest">Logo Configuration</Label>
                                        <div className="aspect-video rounded-[3rem] bg-gray-50 border-4 border-dashed border-gray-100 flex flex-col items-center justify-center p-10 hover:bg-white hover:border-primary/20 group transition-all cursor-pointer">
                                            <div className="h-16 w-16 rounded-full bg-white shadow-xl flex items-center justify-center text-gray-300 group-hover:text-primary transition-colors">
                                                <Monitor className="h-8 w-8" />
                                            </div>
                                            <p className="text-sm font-black text-gray-400 mt-4">Drop Logo Here</p>
                                            <p className="text-[10px] font-bold text-gray-300">SVG preferred (Horizontal layout)</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SettingsManagementPage;
