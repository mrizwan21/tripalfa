import { useState, useEffect, useMemo } from 'react';
import { ShieldCheck, X, Lock, ShieldAlert } from 'lucide-react';
import { apiManager, cn } from '../../index';

interface MPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
  amount?: number;
  currency?: string;
}

export function MPinModal({ isOpen, onClose, onSuccess, title = "Authorize Transaction", description = "Please enter your 4-digit M-Pin to sign this execution on the hub ledger.", amount, currency }: MPinModalProps) {
 const [pin, setPin] = useState(['', '', '', '']);
 const [isVerifying, setIsVerifying] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const inputRefs = useMemo(() => [
 { current: null as HTMLInputElement | null },
 { current: null as HTMLInputElement | null },
 { current: null as HTMLInputElement | null },
 { current: null as HTMLInputElement | null },
 
 ], []);

 useEffect(() => {
 if (isOpen) {
 setPin(['', '', '', '']);
 setError(null);
 setTimeout(() => inputRefs[0].current?.focus(), 100);
 }
 }, [isOpen, inputRefs]);

 if (!isOpen) return null;

 const handleChange = (index: number, value: string) => {
 if (!/^\d*$/.test(value)) return;
 
 const newPin = [...pin];
 newPin[index] = value.slice(-1);
 setPin(newPin);
 setError(null);

 if (value && index < 3) {
 inputRefs[index + 1].current?.focus();
 }
 };

 const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
 if (e.key === 'Backspace' && !pin[index] && index > 0) {
 inputRefs[index - 1].current?.focus();
 }
 };

 const handleVerify = async () => {
 const fullPin = pin.join('');
 if (fullPin.length !== 4) return;

 setIsVerifying(true);
 setError(null);
 
 try {
 const result = await apiManager.verifyMPin(fullPin);
 if (result.success) {
 onSuccess();
 onClose();
 } else {
 setError('Invalid M-Pin branch identity. Please try again.');
 setPin(['', '', '', '']);
 inputRefs[0].current?.focus();
 }
 } catch {
 setError('Internal security branch timeout. Please try again.');
 } finally {
 setIsVerifying(false);
 }
 };

 // Auto-verify when 4th digit is entered
 if (pin.every(digit => digit !== '') && !isVerifying && !error) {
 handleVerify();
 }

 return (
 <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[300] flex items-center justify-center p-6 animate-fade-in">
 <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale relative border border-white/20">
 <button 
 onClick={onClose}
 className="absolute top-8 right-8 text-pure-black/20 hover:text-red-500 transition-colors"
 >
 <X size={20} />
 </button>

 <div className="p-10 space-y-10 text-center">
 <div className="flex justify-center">
 <div className="w-20 h-20 bg-apple-blue shadow-lg text-white rounded-xl flex items-center justify-center text-pure-black shadow-sm relative">
 <Lock size={32} />
 <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-navy/5 text-green-600">
 <ShieldCheck size={16} />
 </div>
 </div>
 </div>

 <div className="space-y-3">
 <h2 className="text-xl font-semibold text-pure-black tracking-tight">{title}</h2>
 <p className="text-[10px] font-medium text-pure-black/40 leading-relaxed px-6">
 {description}
 </p>
 </div>

 {amount !== undefined && (
 <div className="p-4 bg-light-gray rounded-xl border border-navy/5">
 <p className="text-[9px] font-semibold text-pure-black/30 tracking-tight mb-1">Authorization Value</p>
 <p className="text-xl font-semibold text-pure-black">{currency} {amount.toLocaleString()}</p>
 </div>
 )}

 <div className="flex justify-center gap-3 py-4">
 {pin.map((digit, i) => (
 <input
 key={i}
 ref={inputRefs[i]}
 type="password"
 maxLength={1}
 value={digit}
 onChange={(e) => handleChange(i, e.target.value)}
 onKeyDown={(e) => handleKeyDown(i, e)}
 disabled={isVerifying}
 className={cn(
"w-12 h-16 bg-light-gray border-2 rounded-xl text-2xl font-semibold text-center text-pure-black outline-none transition-all",
 error ?"border-red-200 bg-red-50":"border-navy/5 focus:border-apple-blue focus:bg-white focus:shadow-sm/20"
 )}
 />
 ))}
 </div>

 {error && (
 <div className="flex items-center gap-3 text-red-500 justify-center animate-shake">
 <ShieldAlert size={14} />
 <span className="text-[9px] font-semibold">{error}</span>
 </div>
 )}

 <div className="pt-4 border-t border-navy/5">
 <div className="flex items-center justify-center gap-3">
 <div className={cn("w-2 h-2 rounded-full", isVerifying ?"bg-apple-blue animate-pulse":"bg-green-500")} />
 <span className="text-[9px] font-semibold text-pure-black/30">
 {isVerifying ?"Synchronizing Security Branch...":"Secure HUB-SABA Encrypted"}
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
