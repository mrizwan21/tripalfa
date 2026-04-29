import { useState } from 'react';
import { X, Landmark, CheckCircle2, Loader2, ArrowRight, ArrowLeft, ShieldCheck, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '../../index';
import { apiManager } from '../../services/apiManager';
import type { WalletClient } from '../../types';

type OpenBankingStep = 'bank' | 'permissions' | 'redirect' | 'success';

interface OpenBankingConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: WalletClient;
  onSuccess?: () => void;
}

const BAHRAIN_BANKS = [
 { code: 'AUB', name: 'Ahli United Bank', shortName: 'AUB', color: 'bg-blue-800' },
 { code: 'BBK', name: 'Bank of Bahrain and Kuwait', shortName: 'BBK', color: 'bg-green-700' },
 { code: 'NBB', name: 'National Bank of Bahrain', shortName: 'NBB', color: 'bg-red-700' },
 { code: 'ITH', name: 'Ithmaar Bank', shortName: 'ITHMAAR', color: 'bg-amber-700' },
 { code: 'ALS', name: 'Al Salam Bank', shortName: 'AL SALAM', color: 'bg-teal-700' },
 { code: 'KCB', name: 'Khaleeji Commercial Bank', shortName: 'KCB', color: 'bg-purple-700' },
 { code: 'BISB', name: 'Bahrain Islamic Bank', shortName: 'BISB', color: 'bg-emerald-700' },
 { code: 'GIB', name: 'Gulf International Bank', shortName: 'GIB', color: 'bg-slate-700' },
];

const DEFAULT_PERMISSIONS = [
 { id: 'ReadBalances', label: 'Read Account Balances', required: true, description: 'View real-time balance across linked accounts' },
 { id: 'ReadTransactions', label: 'Read Transactions', required: false, description: 'Access transaction history for auto-reconciliation' },
 { id: 'CreatePayments', label: 'Initiate Payments', required: false, description: 'Enable direct bank top-ups and withdrawals' },
 { id: 'AutoTopUp', label: 'Auto Top-Up', required: false, description: 'Automatically top-up wallet when balance falls below threshold' },
];

export default function OpenBankingConsentModal({ isOpen, onClose, client, onSuccess }: OpenBankingConsentModalProps) {
 const [step, setStep] = useState<OpenBankingStep>('bank');
 const [selectedBank, setSelectedBank] = useState('');
 const [permissions, setPermissions] = useState<string[]>(['ReadBalances']);
 const [isRedirecting, setIsRedirecting] = useState(false);
 const [consentUrl, setConsentUrl] = useState('');
 const [consentId, setConsentId] = useState('');

 const bank = BAHRAIN_BANKS.find(b => b.code === selectedBank);

 const togglePermission = (id: string, required: boolean) => {
 if (required) return;
 setPermissions(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
 };

 const handleInitiateConsent = async () => {
 if (!client || !selectedBank) return;
 setIsRedirecting(true);
 try {
 const result = await apiManager.initOpenBankingLink(client.id, selectedBank);
 setConsentUrl(result.consentUrl);
 setConsentId(result.consentId);
 setStep('redirect');
 } catch {
 setConsentUrl(`https://openbanking.${selectedBank.toLowerCase()}.bh/consent`);
 setConsentId(`ob-${Date.now()}`);
 setStep('redirect');
 } finally {
 setIsRedirecting(false);
 }
 };

 const handleSimulateConsent = () => {
 // Simulate user completing consent flow in bank's portal
 setStep('success');
 onSuccess?.();
 };

 const handleClose = () => {
 setStep('bank');
 setSelectedBank('');
 setPermissions(['ReadBalances']);
 setConsentUrl('');
 setConsentId('');
 onClose();
 };

 if (!isOpen || !client) return null;

 return (
 <div className="fixed inset-0 bg-pure-black/80 backdrop-blur-xl flex items-center justify-center z-[200] p-6 animate-in fade-in duration-300">
 <div className="bg-white rounded-xl p-10 max-w-lg w-full shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden">
 <div className="absolute top-0 left-0 w-full h-1.5 bg-apple-blue" />

 {/* Header */}
 <div className="flex justify-between items-start mb-8 relative z-10">
 <div className="space-y-2">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 bg-pure-black rounded-xl flex items-center justify-center text-apple-blue shadow-sm">
 <Landmark size={18} />
 </div>
 <h3 className="text-lg font-semibold text-pure-black">Link Bank Account</h3>
 </div>
 <p className="text-[10px] font-semibold text-pure-black/30 tracking-tight">
 {client.clientName} · OpenBanking Consent
 </p>
 </div>
 <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-light-gray transition-colors text-pure-black/20 hover:text-pure-black">
 <X size={20} />
 </button>
 </div>

 {/* CBB Compliance note */}
 <div className="flex items-center gap-3 mb-6 p-4 bg-apple-blue/5 border border-apple-blue/20 rounded-xl relative z-10">
 <ShieldCheck size={16} className="text-apple-blue shrink-0" />
 <p className="text-[9px] font-semibold text-pure-black/50 leading-relaxed">
 Powered by Bahrain OpenBanking framework. Compliant with CBB Open Finance Regulation 2024. Consent is revocable at any time.
 </p>
 </div>

 <div className="relative z-10">
 {/* Step 1: Select Bank */}
 {step === 'bank' && (
 <div className="space-y-4">
 <p className="text-[10px] font-semibold text-pure-black/40 tracking-tight mb-3">SELECT PARTICIPATING BANK</p>
 <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
 {BAHRAIN_BANKS.map(b => (
 <button
 key={b.code}
 onClick={() => setSelectedBank(b.code)}
 className={cn(
 'p-4 rounded-xl border-2 text-left transition-all group',
 selectedBank === b.code ? 'border-apple-blue bg-apple-blue/5' : 'border-black/5 hover:border-navy/20 hover:bg-light-gray'
 )}
 >
 <div className={cn('w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-white text-[8px] font-bold tracking-tight', b.color)}>
 {b.shortName}
 </div>
 <p className="text-[11px] font-semibold text-pure-black leading-tight">{b.name}</p>
 {selectedBank === b.code && <CheckCircle2 size={12} className="text-apple-blue mt-1" />}
 </button>
 ))}
 </div>
 <button
 onClick={() => selectedBank && setStep('permissions')}
 disabled={!selectedBank}
 className="w-full bg-pure-black text-apple-blue py-4 rounded-xl text-[11px] font-semibold tracking-tight flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-20 active:scale-95"
 >
 Set Permissions <ArrowRight size={14} />
 </button>
 </div>
 )}

 {/* Step 2: Permissions */}
 {step === 'permissions' && bank && (
 <div className="space-y-4">
 <div className="flex items-center gap-3 mb-4">
 <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white text-[8px] font-bold', bank.color)}>
 {bank.shortName}
 </div>
 <div>
 <p className="text-[13px] font-semibold text-pure-black">{bank.name}</p>
 <p className="text-[10px] font-semibold text-pure-black/30">Select access permissions</p>
 </div>
 </div>
 <div className="space-y-3">
 {DEFAULT_PERMISSIONS.map(perm => {
 const isEnabled = permissions.includes(perm.id);
 return (
 <div
 key={perm.id}
 onClick={() => togglePermission(perm.id, perm.required)}
 className={cn(
 'flex items-start gap-4 p-4 rounded-xl border transition-all',
 perm.required ? 'bg-apple-blue/5 border-apple-blue/20 cursor-default' :
 isEnabled ? 'bg-light-gray border-slate-200 cursor-pointer hover:border-apple-blue/30' :
 'border-black/5 cursor-pointer hover:bg-light-gray'
 )}
 >
 <div className="shrink-0 mt-0.5">
 {isEnabled
 ? <ToggleRight size={20} className="text-apple-blue" />
 : <ToggleLeft size={20} className="text-pure-black/20" />}
 </div>
 <div>
 <p className="text-[11px] font-semibold text-pure-black flex items-center gap-2">
 {perm.label}
 {perm.required && <span className="text-[8px] bg-apple-blue text-white px-2 py-0.5 rounded-full">REQUIRED</span>}
 </p>
 <p className="text-[9px] font-semibold text-pure-black/30 mt-0.5">{perm.description}</p>
 </div>
 </div>
 );
 })}
 </div>
 <div className="flex gap-3 pt-2">
 <button onClick={() => setStep('bank')} className="flex-1 py-4 border border-slate-200 rounded-xl text-[11px] font-semibold text-pure-black/40 hover:text-pure-black flex items-center justify-center gap-2 transition-all">
 <ArrowLeft size={14} /> Back
 </button>
 <button
 onClick={handleInitiateConsent}
 disabled={isRedirecting}
 className="flex-[2] bg-pure-black text-apple-blue py-4 rounded-xl text-[11px] font-semibold tracking-tight flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50 active:scale-95"
 >
 {isRedirecting ? <><Loader2 size={14} className="animate-spin" /> Initiating...</> : <>Initiate Consent <ArrowRight size={14} /></>}
 </button>
 </div>
 </div>
 )}

 {/* Step 3: Redirect Simulation */}
 {step === 'redirect' && bank && (
 <div className="space-y-5">
 <div className="p-6 bg-light-gray border border-slate-200 rounded-xl space-y-4">
 <div className="flex items-center gap-3">
 <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white text-[8px] font-bold', bank.color)}>
 {bank.shortName}
 </div>
 <div>
 <p className="text-[12px] font-semibold text-pure-black">{bank.name} Consent Portal</p>
 <p className="text-[9px] font-semibold text-pure-black/30 truncate">{consentUrl}</p>
 </div>
 </div>
 <div className="h-px bg-slate-200" />
 <p className="text-[10px] font-semibold text-pure-black/50 leading-relaxed">
 In production, the user is redirected to {bank.name}'s secure consent portal to authenticate and approve the requested permissions. After approval, they are redirected back here automatically.
 </p>
 <a
 href={consentUrl}
 target="_blank"
 rel="noreferrer"
 className="flex items-center gap-2 text-[10px] font-semibold text-apple-blue hover:underline"
 >
 <ExternalLink size={12} /> Open {bank.name} Consent Portal (Demo)
 </a>
 </div>
 <p className="text-[10px] font-semibold text-pure-black/30 text-center">Consent ID: <span className="font-mono">{consentId}</span></p>
 <button
 onClick={handleSimulateConsent}
 className="w-full bg-pure-black text-apple-blue py-4 rounded-xl text-[11px] font-semibold tracking-tight flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95"
 >
 <CheckCircle2 size={14} /> Simulate Consent Approved
 </button>
 </div>
 )}

 {/* Success */}
 {step === 'success' && bank && (
 <div className="flex flex-col items-center gap-6 py-4">
 <div className="w-20 h-20 bg-apple-blue/10 border-4 border-apple-blue/20 rounded-full flex items-center justify-center">
 <CheckCircle2 size={40} className="text-apple-blue" />
 </div>
 <div className="text-center space-y-2">
 <h4 className="text-lg font-semibold text-pure-black">Bank Account Linked</h4>
 <p className="text-[10px] font-semibold text-pure-black/30 tracking-tight">{bank.name} · {permissions.length} permissions granted</p>
 </div>
 <div className="w-full p-4 bg-light-gray rounded-xl space-y-2">
 <p className="text-[9px] font-semibold text-pure-black/40">GRANTED PERMISSIONS</p>
 {permissions.map(p => {
 const perm = DEFAULT_PERMISSIONS.find(d => d.id === p);
 return perm ? (
 <div key={p} className="flex items-center gap-2">
 <CheckCircle2 size={12} className="text-apple-blue" />
 <span className="text-[10px] font-semibold text-pure-black">{perm.label}</span>
 </div>
 ) : null;
 })}
 </div>
 <button onClick={handleClose} className="w-full bg-pure-black text-apple-blue py-4 rounded-xl text-[11px] font-semibold tracking-tight hover:bg-black transition-all active:scale-95">
 Done
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
