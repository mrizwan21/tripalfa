import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
 icon: LucideIcon;
 title: string;
 subtitle?: string;
 badge?: {
 text: string;
 className?: string;
 };
 actions?: React.ReactNode;
}

export default function PageHeader({ icon: Icon, title, subtitle, badge, actions }: PageHeaderProps) {
 return (
 <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-black/5 pb-10">
 <div className="space-y-4">
 <h1 className="text-4xl lg:text-[52px] font-display font-semibold text-pure-black leading-tight flex items-center gap-4">
 <div className="w-14 h-14 bg-light-gray text-pure-black rounded-xl flex items-center justify-center shadow-sm">
 <Icon size={28} />
 </div>
 {title}
 </h1>
 <div className="flex items-center gap-3">
 {subtitle && <span className="text-[14px] font-text text-black/50">{subtitle}</span>}
 {badge && (
 <span className={badge.className || "text-[12px] font-text font-medium text-green-700 flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200"}>
 {badge.text}
 </span>
 )}
 </div>
 </div>
 {actions && <div className="flex items-center gap-4 w-full lg:w-auto">{actions}</div>}
 </div>
 );
}