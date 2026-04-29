import { X, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '../../index';

type StatusAlertProps = {
  success?: string;
  error?: string;
  onDismiss?: () => void;
  className?: string;
  variant?: 'compact' | 'spacious';
};

export function StatusAlert({ success, error, onDismiss, className, variant = 'compact' }: StatusAlertProps) {
 const message = success || error;
 if (!message) return null;

 const isSuccess = !!success;

 if (variant === 'spacious') {
 return (
 <div className={cn(
 "p-6 rounded-[12px] border flex items-center gap-5 animate-slide-up shadow-sm",
 isSuccess ? "bg-apple-blue/5 border-apple-blue/20" : "bg-black/5 border-black/10",
 className
 )}>
 <div className={cn(
 "w-10 h-10 rounded-[12px] flex items-center justify-center text-white",
 isSuccess ? "bg-apple-blue shadow-sm" : "bg-black/80"
 )}>
 {isSuccess ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
 </div>
 <div className="flex-1">
 <p className={cn("text-[14px] font-text font-semibold mb-0.5", isSuccess ? "text-apple-blue" : "text-black")}>
 {isSuccess ? 'Success' : 'Error'}
 </p>
 <span className={cn("text-[14px] font-text", isSuccess ? "text-green-800" : "text-red-800")}>{message}</span>
 </div>
 {onDismiss && (
 <button onClick={onDismiss} className="text-black/30 hover:text-black transition-colors">
 <X size={20} />
 </button>
 )}
 </div>
 );
 }

 return (
 <div className={cn(
 "p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-4 text-green-800 animate-slide-up shadow-sm",
 !isSuccess && "bg-red-50 border-red-200 text-red-800",
 className
 )}>
 {isSuccess ? <ShieldCheck size={20} className="text-apple-blue" /> : <AlertTriangle size={20} className="text-white" />}
 <span className="text-[14px] font-text font-medium flex-1">{message}</span>
 {onDismiss && (
 <button onClick={onDismiss} className={isSuccess ? "text-green-500 hover:text-green-800" : "text-red-500 hover:text-red-800"}>
 <X size={18} />
 </button>
 )}
 </div>
 );
}
