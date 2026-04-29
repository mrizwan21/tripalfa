import React from 'react';
import { type LucideIcon, Database } from 'lucide-react';

interface NodalPageHeaderProps {
 icon?: LucideIcon;
 title: string;
 highlightedTitle?: string;
 description?: string;
 nodeName?: string;
 tenantName?: string;
 actions?: React.ReactNode;
 tabs?: React.ReactNode;
 subtitle?: string;
 badge?: React.ReactNode;
 isLoading?: boolean;
}

export function NodalPageHeader({
 icon: Icon = Database,
 title,
 highlightedTitle,
 description,
 nodeName,
 tenantName,
 actions,
 tabs,
 subtitle,
 badge,
 isLoading = false
}: NodalPageHeaderProps) {
 return (
 <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-10">
 <div className="space-y-4">
 {nodeName && (
 <div className="flex items-center gap-3">
 <div className="w-1.5 h-1.5 rounded-full bg-apple-blue animate-pulse" />
 <span className="text-[10px] font-semibold text-pure-black/30 tracking-tight">
 {nodeName}
 </span>
 </div>
 )}
 <h1 className="text-4xl lg:text-5xl font-semibold text-pure-black leading-none flex items-center gap-5">
 <div className="w-14 h-14 bg-pure-black text-apple-blue rounded-xl flex items-center justify-center shadow-sm">
 <Icon size={28} />
 </div>
 {title} {highlightedTitle && <span className="text-apple-blue">{highlightedTitle}</span>}
 </h1>
 {description && (
 <p className="text-sm text-pure-black/40 max-w-2xl">{description}</p>
 )}
 <div className="flex items-center gap-3">
 {tenantName && (
 <span className="text-[10px] font-semibold text-pure-black/40 bg-light-gray px-3 py-1.5 rounded-xl border border-navy/5">
 {tenantName}
 </span>
 )}
 {badge}
 <span className="text-nano font-semibold text-apple-blue flex items-center gap-1.5 tracking-tight">
 <div className="w-1 h-1 rounded-full bg-apple-blue shadow-sm" /> 
 {isLoading ? 'Loading...' : 'Live'}
 </span>
 {subtitle && (
 <span className="text-nano font-semibold text-black/30 ml-2 tracking-tight">{subtitle}</span>
 )}
 </div>
 </div>
 <div className="flex items-center gap-6 w-full lg:w-auto">
 {tabs && <div className="flex items-center gap-4">{tabs}</div>}
 <div className="flex items-center gap-4">{actions}</div>
 </div>
 </div>
 );
}