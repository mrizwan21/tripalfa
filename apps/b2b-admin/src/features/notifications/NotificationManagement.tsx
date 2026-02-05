import React, { useState } from 'react';
import {
    Bell,
    Send,
    History,
    Plus,
    Filter,
    Search,
    CheckCircle2,
    AlertCircle,
    Clock,
    TrendingUp,
    Inbox,
    Mail,
    MessageSquare,
    Smartphone
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { NotificationList } from './components/NotificationList';
import { ComposeNotification } from './components/ComposeNotification';
import AdminNotifications from '@/components/notifications/AdminNotifications';

export function NotificationManagement() {
    const [activeTab, setActiveTab] = useState('history');
    const [isComposeOpen, setIsComposeOpen] = useState(false);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-secondary-900 tracking-tight dark:text-white">Communication Hub</h1>
                    <p className="text-secondary-500 mt-2 font-medium">Manage alerts and notifications across B2B and B2C platforms.</p>
                </div>
                <Button
                    onClick={() => setIsComposeOpen(true)}
                    className="h-12 bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 rounded-2xl shadow-lg shadow-primary-600/20 transition-all active:scale-95" > <Plus className="mr-2 h-5 w-5" />
                    New Notification
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Sent Today', value: '1,240', icon: Send, color: 'blue', trend: '+12%' },
                    { label: 'Delivery Rate', value: '98.5%', icon: CheckCircle2, color: 'emerald', trend: '+0.2%' },
                    { label: 'Read/Open Rate', value: '42%', icon: Inbox, color: 'indigo', trend: '-2%' },
                    { label: 'Failures', value: '14', icon: AlertCircle, color: 'rose', trend: 'Stable' },
                ].map((stat) => (
                    <Card key={stat.label} className="border-none shadow-xl shadow-secondary-100/50 bg-white dark:bg-secondary-900 dark:shadow-none overflow-hidden group hover:shadow-2xl transition-all">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">{stat.label}</p>
                                <h3 className="text-2xl font-black text-secondary-900 dark:text-white mt-1">{stat.value}</h3>
                                <p className={`text-[10px] font-bold mt-1 ${stat.trend.startsWith('+') ? 'text-emerald-500' : stat.trend === 'Stable' ? 'text-secondary-400' : 'text-rose-500'}`}>
                                    {stat.trend} this week
                                </p>
                            </div>
                            <div className={`h-12 w-12 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 dark:bg-${stat.color}-900/20 dark:text-${stat.color}-400 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Admin recent notifications widget */}
            <div className="mt-6">
                <AdminNotifications />
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                    <TabsList className="bg-white/80 dark:bg-secondary-900/80 backdrop-blur-xl rounded-2xl p-1.5 shadow-xl border border-secondary-100 dark:border-secondary-800 flex gap-1">
                        <TabsTrigger
                            value="history"
                            className="rounded-xl flex items-center gap-2 px-6 py-2.5 font-bold data-[state=active]:bg-secondary-900 data-[state=active]:text-white dark:data-[state=active]:bg-primary-600"
                        >
                            <History size={16} />
                            Sent History
                        </TabsTrigger>
                        <TabsTrigger
                            value="templates"
                            className="rounded-xl flex items-center gap-2 px-6 py-2.5 font-bold data-[state=active]:bg-secondary-900 data-[state=active]:text-white dark:data-[state=active]:bg-primary-600"
                        >
                            <Bell size={16} />
                            Templates
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                            <Input
                                placeholder="Search logs..."
                                className="pl-10 h-11 bg-white dark:bg-secondary-900 border-secondary-100 dark:border-secondary-800 rounded-xl focus:ring-primary-500/20"
                            />
                        </div>
                        <Button variant="outline" className="h-11 rounded-xl border-secondary-100 dark:border-secondary-800 font-bold gap-2">
                            <Filter size={16} />
                            Filters
                        </Button>
                    </div>
                </div>

                <TabsContent value="history" className="focus-visible:outline-none">
                    <NotificationList />
                </TabsContent>

                <TabsContent value="templates" className="focus-visible:outline-none">
                    <div className="flex flex-center justify-center p-20 text-center">
                        <div className="max-w-md">
                            <div className="h-16 w-16 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-6 text-secondary-400">
                                <Inbox size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">Template Gallery</h3>
                            <p className="text-secondary-500">Coming soon: Standardize your platform communications with reusable templates for flights, hotels, and system alerts.</p>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Compose Modal */}
            <ComposeNotification
                open={isComposeOpen}
                onOpenChange={setIsComposeOpen}
            />
        </div>
    );
}
