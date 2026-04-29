import { useState } from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';

interface BookingActionsProps {
 primaryLabel: string;
 secondaryLabel: string;
 onPrimary: () => void;
 onSecondary: () => void;
 isIssuing: boolean;
 issuanceStep: number;
 issuanceSteps: string[];
 stepLabels: string[];
 centerIcon: React.ReactNode;
 transactionPrefix: string;
}

export function BookingActions({
 primaryLabel,
 secondaryLabel,
 onPrimary,
 onSecondary,
 isIssuing,
 issuanceStep,
 issuanceSteps,
 stepLabels,
 centerIcon,
 transactionPrefix
}: BookingActionsProps) {
 const [txId] = useState(() => Math.floor(Math.random() * 10000000));

 return (
 <>
 <div className="flex gap-16 mb-40 animate-fade">
 <button 
 className="btn btn-navy py-16 px-48 font-semibold shadow-xl hover:bg-apple-blue-dark transition-all disabled:opacity-50"
 onClick={onPrimary}
 disabled={isIssuing}
 >
 {primaryLabel}
 </button>
 <button 
 className="btn btn-outline py-16 px-48 font-semibold disabled:opacity-50"
 onClick={onSecondary}
 disabled={isIssuing}
 >
 {secondaryLabel}
 </button>
 </div>

 {isIssuing && (
 <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-24">
 <div className="card max-w-450 w-full p-48 text-center shadow-2xl border-apple-blue-light/20 relative overflow-hidden bg-white rounded-xl transform scale-110">
 <div className="absolute top-0 left-0 w-full h-6 bg-light-navy/20">
 <div 
 className="bg-apple-blue h-full transition-all duration-1000 ease-in-out"
 style={{ width: `${((issuanceStep + 1) / issuanceSteps.length) * 100}%` }}
 ></div>
 </div>
 
 <div className="flex flex-col items-center gap-32">
 <div className="relative">
 <div className="w-120 h-120 rounded-full border-4 border-apple-blue-light/20 border-t-gold animate-spin-slow"></div>
 <div className="absolute inset-0 flex items-center justify-center text-pure-black scale-125 transition-all">
 {issuanceStep === issuanceSteps.length - 1 ? <CheckCircle2 size={40} className="text-green animate-bounce"/> : centerIcon}
 </div>
 </div>

 <div>
 <h2 className="text-xl font-semibold text-pure-black mb-12 animate-pulse">
 {issuanceSteps[issuanceStep]}
 </h2>
 <div className="flex items-center justify-center gap-8">
 <span className="text-xxxxs text-muted font-semibold px-8 py-2 bg-light-navy/5 rounded border border-apple-blue-light/10">
 System Lock: {transactionPrefix}-{txId}
 </span>
 </div>
 </div>

 <div className="flex flex-col gap-12 w-full text-left mt-8">
 {stepLabels.map((label, idx) => (
 <div 
 key={label}
 className={`flex items-center justify-between p-16 rounded-xl border transition-all duration-500 ${
 issuanceStep >= idx ? 'bg-green/5 border-green/20 text-green shadow-inner' : 'bg-light-navy/5 border-transparent text-muted opacity-40'
 } ${issuanceStep === idx ? 'ring-2 ring-gold/20 scale-[1.02]' : ''}`}
 >
 <div className="flex items-center gap-12">
 <div className={`w-8 h-8 rounded-full ${issuanceStep >= idx ? 'bg-green animate-pulse' : 'bg-muted'}`}></div>
 <span className="text-xxxxs font-semibold">{label}</span>
 </div>
 {issuanceStep > idx ? <CheckCircle2 size={16} /> : (issuanceStep === idx ? <Clock size={16} className="animate-spin-slow"/> : <div className="w-16 h-16 rounded-full border border-muted opacity-30"></div>)}
 </div>
 ))}
 </div>

 <p className="text-[10px] font-semibold text-muted tracking-tight opacity-40 mt-16 leading-relaxed">
 Financial settlement is executing on the <br/>GDS Global Branch infrastructure. <br/> Do not close this terminal.
 </p>
 </div>
 
 <div className="absolute -bottom-20 -right-20 opacity-5 rotate-12 scale-150">
 {centerIcon}
 </div>
 </div>
 </div>
 )}
 </>
 );
}
