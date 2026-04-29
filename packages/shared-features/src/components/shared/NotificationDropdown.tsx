import { useState, useRef } from 'react';
import { Bell, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn, AppNotification } from '../../index';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { getNotificationIcon } from '../../utils/notificationIcons';

export function NotificationDropdown() {
 const { notifications, markNotificationAsRead, clearNotifications } = useApp();
 const [isOpen, setIsOpen] = useState(false);
 const dropdownRef = useRef<HTMLDivElement>(null);

 const unreadCount = notifications.filter(n => !n.isRead).length;

 useOnClickOutside(dropdownRef, () => setIsOpen(false));

 const getIcon = (type: AppNotification['type']) => getNotificationIcon(type);

 return (
 <div className="relative" ref={dropdownRef}>
 <button 
 onClick={() => setIsOpen(!isOpen)}
 className="p-3 relative rounded-full hover:bg-black/5 transition-colors focus:outline-none"
 >
 <Bell size={20} className="text-pure-black/70" />
 {unreadCount > 0 && (
 <span className="absolute top-1.5 right-2 w-3.5 h-3.5 bg-apple-blue rounded-full border-2 border-white flex items-center justify-center text-[7px] font-bold text-white shadow-sm">
 {unreadCount > 9 ? '9+' : unreadCount}
 </span>
 )}
 </button>

 {isOpen && (
 <div className="absolute right-0 mt-3 w-96 bg-white rounded-xl shadow-apple border border-black/5 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
 <div className="px-6 py-5 bg-filter-bg border-b border-black/5 flex items-center justify-between">
 <h3 className="text-nano font-bold text-near-black tracking-tight flex items-center gap-2">
 <ShieldCheck size={14} className="text-apple-blue" /> Control Branch Sync
 </h3>
 <div className="flex gap-4 items-center">
 <span className="text-nano font-bold text-black/30">{unreadCount} Unread</span>
 {notifications.length > 0 && (
 <button onClick={clearNotifications} className="text-nano font-bold text-black/40 hover:text-near-black tracking-tight">
 Purge
 </button>
 )}
 </div>
 </div>

 <div className="max-h-[400px] overflow-y-auto no-scrollbar">
 {notifications.length === 0 ? (
 <div className="p-10 text-center flex flex-col items-center">
 <Bell size={24} className="text-pure-black/10 mb-3" />
 <p className="text-[11px] font-bold text-pure-black/30 tracking-tight">No Active Telemetry</p>
 </div>
 ) : (
 <div className="divide-y divide-navy/5">
 {notifications.map((notif) => (
 <div 
 key={notif.id} 
 className={cn(
 "p-5 hover:bg-light-gray transition-colors group cursor-pointer relative",
 !notif.isRead && "bg-apple-blue/5"
 )}
 onClick={() => {
 markNotificationAsRead(notif.id);
 if (notif.link) {
 // Navigate if routing is implemented or window.location
 }
 }}
 >
 {!notif.isRead && (
 <div className="absolute left-0 top-0 bottom-0 w-1 bg-apple-blue" />
 )}
 <div className="flex gap-4">
 <div className="pt-0.5">
 {getIcon(notif.type)}
 </div>
 <div className="flex-1">
 <div className="flex items-start justify-between gap-4 mb-1">
 <h4 className={cn("text-xs font-bold font-text tracking-tight", !notif.isRead ? "text-pure-black" : "text-pure-black/70")}>
 {notif.title}
 </h4>
 <span className="text-[9px] font-bold text-pure-black/20 tracking-tight whitespace-nowrap">
 {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </span>
 </div>
 <p className={cn("text-[11px] font-medium leading-relaxed", !notif.isRead ? "text-pure-black/60" : "text-pure-black/40")}>
 {notif.message}
 </p>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 
 <div className="p-4 border-t border-navy/5 bg-light-gray/50 text-center">
 <button className="text-[10px] font-bold text-pure-black/30 hover:text-apple-blue tracking-tight transition-colors">
 Access Master Ledger
 </button>
 </div>
 </div>
 )}
 </div>
 );
}
