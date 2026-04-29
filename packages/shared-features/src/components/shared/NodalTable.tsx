import React from 'react';
import { cn } from '../../index';

export function NodalTable({ 
  headers, 
  children, 
  isLoading, 
  isEmpty, 
  emptyState, 
  className, 
  headerClassName,
  loadingMessage = 'Processing...'
}: { 
  headers: React.ReactNode[], 
  children: React.ReactNode, 
  isLoading?: boolean, 
  isEmpty?: boolean, 
  emptyState?: React.ReactNode, 
  className?: string, 
  headerClassName?: string,
  loadingMessage?: string
}) {
 return (
 <div className={cn("bg-white rounded-xl border border-black/5 shadow-apple overflow-hidden min-h-[400px] relative", className)}>
 {isLoading && (
 <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-[20px] z-10 transition-all">
 <div className="flex flex-col items-center gap-4">
 <div className="w-12 h-12 border-4 border-black/5 border-t-apple-blue rounded-full animate-spin"/>
 <p className="text-[12px] font-semibold text-black/30 tracking-tight">{loadingMessage}</p>
 </div>
 </div>
 )}

 <table className="w-full text-left border-collapse">
 <thead>
 <tr className={cn("bg-filter-bg border-b border-black/5", headerClassName)}>
 {headers.map((header, i) => (
 <th 
 key={i} 
 className={cn(
"px-6 py-5 text-[12px] font-semibold text-black/50 tracking-tight",
 i === 0 &&"px-8"
 )}
 >
 {header}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-black/5">
 {children}
 </tbody>
 </table>

 {!isLoading && isEmpty && emptyState && (
 <div className="p-20 text-center space-y-4">
 {emptyState}
 </div>
 )}
 </div>
 );
}
