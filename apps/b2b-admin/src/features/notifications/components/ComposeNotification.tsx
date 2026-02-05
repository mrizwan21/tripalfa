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
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/Select';
import {
    Bell,
    Send,
    Target,
    Layers,
    Mail,
    MessageSquare,
    Smartphone,
    Info
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface ComposeNotificationProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ComposeNotification({ open, onOpenChange }: ComposeNotificationProps) {
    const [channel, setChannel] = useState('SYSTEM');
    const [target, setTarget] = useState('ALL');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl rounded-[2.5rem] bg-white/95 backdrop-blur-2xl border-secondary-100 dark:border-secondary-800 dark:bg-secondary-950/95 p-0 overflow-hidden shadow-2xl">
                <div className="bg-secondary-900 dark:bg-black px-8 py-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 opacity-20" />

                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-primary-600 flex items-center justify-center">
                                <Send size={24} className="text-white" />
                            </div>
                            Compose Broadcast
                        </DialogTitle>
                        <DialogDescription className="text-secondary-400 font-medium text-lg mt-2">
                            Send targeted alerts to agents and customers across the platform.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-8">
                    {/* Targeting and Channel */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-secondary-500 flex items-center gap-2">
                                <Target size={14} className="text-primary-600" />
                                Targeting Segment
                            </Label>
                            <Select value={target} onValueChange={setTarget}>
                                <SelectTrigger className="h-14 rounded-2xl border-secondary-100 dark:border-secondary-800 font-bold bg-secondary-50/30">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl shadow-2xl border-secondary-100 p-2">
                                    <SelectItem value="ALL" className="rounded-xl py-3 font-bold">All Platform Users</SelectItem>
                                    <SelectItem value="B2B" className="rounded-xl py-3 font-bold">B2B Agents Only</SelectItem>
                                    <SelectItem value="B2C" className="rounded-xl py-3 font-bold">B2C Customers Only</SelectItem>
                                    <SelectItem value="SPECIFIC" className="rounded-xl py-3 font-bold">Specific ID / Group</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-secondary-500 flex items-center gap-2">
                                <Layers size={14} className="text-primary-600" />
                                Delivery Channel
                            </Label>
                            <div className="flex bg-secondary-50/50 dark:bg-secondary-900/50 p-1.5 rounded-2xl border border-secondary-100 dark:border-secondary-800">
                                {[
                                    { id: 'SYSTEM', icon: Bell },
                                    { id: 'EMAIL', icon: Mail },
                                    { id: 'SMS', icon: Smartphone },
                                    { id: 'WHATSAPP', icon: MessageSquare },
                                ].map((ch) => (
                                    <button
                                        key={ch.id}
                                        onClick={() => setChannel(ch.id)}
                                        className={`flex-1 flex items-center justify-center p-2.5 rounded-xl transition-all ${channel === ch.id
                                                ? 'bg-white dark:bg-secondary-800 text-primary-600 shadow-sm'
                                                : 'text-secondary-400 hover:text-secondary-600'
                                            }`}
                                    >
                                        <ch.icon size={20} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label htmlFor="subject" className="text-xs font-black uppercase tracking-widest text-secondary-500">
                                Subject / Title
                            </Label>
                            <Input
                                id="subject"
                                placeholder="e.g. System Maintenance Scheduled"
                                className="h-14 rounded-2xl border-secondary-100 dark:border-secondary-800 font-bold bg-secondary-50/20 px-6"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="body" className="text-xs font-black uppercase tracking-widest text-secondary-500">
                                Message Content
                            </Label>
                            <Textarea
                                id="body"
                                placeholder="Type your message here..."
                                className="min-h-[160px] rounded-[2rem] border-secondary-100 dark:border-secondary-800 font-medium bg-secondary-50/20 p-6 focus:ring-primary-500/20"
                                rows={6}
                            />
                        </div>
                    </div>

                    {/* Meta/Priority */}
                    <div className="bg-primary-50/50 dark:bg-primary-900/10 rounded-3xl p-6 border border-primary-100 dark:border-primary-900/30 flex items-start gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-2xl bg-white dark:bg-secondary-900 flex items-center justify-center text-primary-600 shadow-sm">
                            <Info size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-primary-900 dark:text-primary-100">Delivery Information</h4>
                            <p className="text-xs font-bold text-primary-700/70 dark:text-primary-400/70 mt-1 leading-relaxed">
                                This message will be sent to approximately <span className="text-primary-900 font-black">4,250</span> recipients.
                                Estimated delivery time is within <span className="text-primary-900 font-black">5 minutes</span>.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 bg-secondary-50/50 dark:bg-secondary-900/50 flex-col sm:flex-row gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="rounded-2xl font-bold h-14 bg-white dark:bg-secondary-800 border-secondary-100 dark:border-secondary-700 active:scale-95"
                    >
                        Save as Draft
                    </Button>
                    <Button className="flex-1 rounded-2xl font-black h-14 bg-primary-600 hover:bg-primary-700 text-white shadow-xl shadow-primary-600/20 active:scale-95">
                        Send Notification
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
