import React from 'react';
import { X, CheckCircle2, Clock, XCircle, AlertCircle, Info, Calendar, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { NotificationItem } from '../lib/notification-types';
import { cn } from '../lib/utils';

interface NotificationDetailsPopupProps {
    isOpen: boolean;
    onClose: () => void;
    notification: NotificationItem | null;
}

export function NotificationDetailsPopup({ isOpen, onClose, notification }: NotificationDetailsPopupProps) {
    if (!isOpen || !notification) return null;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return <CheckCircle2 size={24} className="text-emerald-600" />;
            case 'PENDING': return <Clock size={24} className="text-amber-600" />;
            case 'REJECTED': return <XCircle size={24} className="text-rose-600" />;
            default: return <Info size={24} className="text-primary" />;
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />
            <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20">

                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-sm border border-slate-100 transition-transform hover:rotate-12">
                            {getStatusIcon(notification.status)}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Details View</p>
                            <h2 className="text-xl font-black text-slate-900 leading-tight">{notification.title}</h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-900 active:scale-90"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Status Banner */}
                    <div className={cn(
                        "p-6 rounded-[1.5rem] border flex items-start gap-4 transition-all hover:translate-y-[-2px]",
                        notification.status === 'CONFIRMED' ? "bg-emerald-50 border-emerald-100/50 text-emerald-900" :
                            notification.status === 'PENDING' ? "bg-amber-50 border-amber-100/50 text-amber-900" :
                                notification.status === 'REJECTED' ? "bg-rose-50 border-rose-100/50 text-rose-900" :
                                    "bg-primary/5 border-primary/10 text-primary-900"
                    )}>
                        <div className="mt-1">
                            <Shield size={20} className="shrink-0" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Status: {notification.status}</p>
                            <p className="text-sm font-bold leading-relaxed">
                                {notification.status === 'REJECTED'
                                    ? notification.remarks || 'This request was rejected by the supplier. Please verify details and try again.'
                                    : notification.description}
                            </p>
                        </div>
                    </div>

                    {/* Request Details Grid */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
                            Information
                            <span className="flex-1 h-px bg-slate-100" />
                        </h3>

                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <Calendar size={10} /> Date
                                </p>
                                <p className="text-slate-900 font-black text-sm">{format(new Date(notification.when), 'MMM d, yyyy h:mm a')}</p>
                            </div>

                            {notification.passengerName && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Passenger</p>
                                    <p className="text-slate-900 font-black text-sm">{notification.passengerName}</p>
                                </div>
                            )}

                            {notification.segment && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Product</p>
                                    <p className="text-slate-900 font-black text-sm">{notification.segment}</p>
                                </div>
                            )}

                            {notification.price !== undefined && notification.price > 0 && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Amount</p>
                                    <p className="text-primary font-black text-sm">{notification.currency} {notification.price}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Simple Timeline */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
                            Activity
                            <span className="flex-1 h-px bg-slate-100" />
                        </h3>
                        <div className="space-y-6 pl-4 border-l-2 border-slate-100 ml-1">
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-slate-200 border-2 border-white ring-4 ring-slate-50"></div>
                                <p className="text-xs font-black text-slate-900">Request Initiated</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{notification.when}</p>
                            </div>
                            {notification.status !== 'PENDING' && (
                                <div className="relative">
                                    <div className={cn(
                                        "absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border-2 border-white ring-4 ring-white shadow-sm",
                                        notification.status === 'REJECTED' ? 'bg-rose-500' : 'bg-emerald-500'
                                    )}></div>
                                    <p className="text-xs font-black text-slate-900">Current Status: {notification.status}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Supplier Processed • Just now</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                    <button className="flex-1 h-12 rounded-2xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95">
                        Download Receipt
                    </button>
                    <button className="flex-1 h-12 rounded-2xl bg-primary text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95">
                        Contact Support
                    </button>
                </div>
            </div>
        </div>
    );
}
