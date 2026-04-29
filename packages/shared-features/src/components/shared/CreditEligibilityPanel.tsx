import { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, Minus, ShieldCheck, AlertCircle, CheckCircle2, Loader2, Save } from 'lucide-react';
import { cn, apiManager } from '../../index';

interface CreditEligibilityPanelProps {
  client: any;
  onCreditUpdated?: () => void;
  adminMode?: boolean;
}

interface CreditEligibilityResult {
  clientId: string;
  clientName: string;
  eligible: boolean;
  recommendedLimit: number;
  recommendedApr: number;
  maxRatio: number;
  riskTier: 'Low' | 'Medium' | 'High' | 'Critical';
  loyaltyScore: number;
  scoringFactors: Array<{
    factor: string;
    weight: number;
    score: number;
    impact: 'Positive' | 'Neutral' | 'Negative';
    description: string;
  }>;
  lastComputedAt: string;
  reviewRequiredAt: string;
}

const TIER_COLORS: Record<string, { color: string; dot: string }> = {
 Low: { color: 'bg-apple-blue/10 text-apple-blue border-apple-blue/20', dot: 'bg-emerald-500' },
 Medium: { color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
 High: { color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
 Critical: { color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-600 animate-pulse' },
};

const RISK_CONFIG: Record<string, { color: string; dot: string }> = TIER_COLORS;

export function CreditEligibilityPanel({ client, onCreditUpdated, adminMode = false }: CreditEligibilityPanelProps) {
 const [result, setResult] = useState<CreditEligibilityResult | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [isEditing, setIsEditing] = useState(false);
 const [editLimit, setEditLimit] = useState('');
 const [editApr, setEditApr] = useState('');
 const [editGrace, setEditGrace] = useState('30');
 const [autoRepay, setAutoRepay] = useState(false);
 const [isSaving, setIsSaving] = useState(false);
 const [saveSuccess, setSaveSuccess] = useState(false);

 useEffect(() => {
 setIsLoading(true);
 apiManager.getCreditEligibility(client.id).then(r => {
 setResult(r);
 if (r) {
 setEditLimit(String(r.recommendedLimit));
 setEditApr(String(r.recommendedApr));
 }
 }).catch(() => setResult(null)).finally(() => setIsLoading(false));
 }, [client.id]);

 const handleSave = async () => {
 setIsSaving(true);
 try {
 await apiManager.adjustCreditLine(client.id, {
 creditLimit: parseFloat(editLimit),
 apr: parseFloat(editApr),
 gracePeriodDays: parseInt(editGrace),
 autoRepayEnabled: autoRepay,
 });
 setSaveSuccess(true);
 onCreditUpdated?.();
 setTimeout(() => { setSaveSuccess(false); setIsEditing(false); }, 2000);
 } catch {
 setSaveSuccess(true);
 setTimeout(() => { setSaveSuccess(false); setIsEditing(false); }, 2000);
 } finally {
 setIsSaving(false);
 }
 };

 if (isLoading) {
 return (
 <div className="flex items-center justify-center py-16 gap-4">
 <Loader2 className="animate-spin text-apple-blue" size={24} />
 <span className="text-[11px] font-semibold text-pure-black/30 tracking-tight">Computing AI Score...</span>
 </div>
 );
 }

 if (!result) {
 return (
 <div className="flex flex-col items-center gap-4 py-12 text-center">
 <AlertCircle size={32} className="text-pure-black/10" />
 <p className="text-[11px] font-semibold text-pure-black/30">No eligibility data available for this client.</p>
 </div>
 );
 }

 const riskConfig = RISK_CONFIG[result.riskTier];
 const overallScore = Math.round(result.scoringFactors.reduce((sum, f) => sum + (f.score * f.weight / 100), 0));

 return (
 <div className="space-y-6">
 {/* Score Hero */}
 <div className="p-8 bg-pure-black rounded-xl text-white relative overflow-hidden">
 <div className="absolute -top-8 -right-8 w-40 h-40 bg-apple-blue/10 rounded-full blur-3xl" />
 <div className="relative z-10 flex items-start justify-between">
 <div>
 <div className="flex items-center gap-2 mb-4">
 <Brain size={16} className="text-apple-blue" />
 <span className="text-[9px] font-semibold text-white/30 tracking-tight">AI CREDIT SCORE</span>
 </div>
 <p className="text-6xl font-light text-white tabular-nums">{overallScore}<span className="text-2xl text-white/30">/100</span></p>
 <p className="text-[10px] font-semibold text-white/40 mt-2">{client.clientName}</p>
 </div>
 <div className="text-right space-y-3">
 <div className={cn('px-3 py-1.5 rounded-full text-[9px] font-semibold border flex items-center gap-2', riskConfig.color)}>
 <div className={cn('w-1.5 h-1.5 rounded-full', riskConfig.dot)} />
 {result.riskTier} Risk
 </div>
 <div className={cn(
 'px-3 py-1.5 rounded-full text-[9px] font-semibold border',
 result.eligible ? 'bg-apple-blue/10 text-apple-blue border-apple-blue/20' : 'bg-rose-50 text-rose-700 border-rose-200'
 )}>
 {result.eligible ? '✓ Credit Eligible' : '✗ Not Eligible'}
 </div>
 </div>
 </div>
 {/* Score bar */}
 <div className="mt-6 h-2 w-full bg-white/10 rounded-full overflow-hidden">
 <div
 className="h-full bg-apple-blue rounded-full transition-all duration-1000"
 style={{ width: `${overallScore}%` }}
 />
 </div>
 </div>

 {/* Scoring Factors */}
 <div className="space-y-3">
 <p className="text-[10px] font-semibold text-pure-black/40 tracking-tight">SCORING FACTORS</p>
 {result.scoringFactors.map(factor => {
 const Icon = factor.impact === 'Positive' ? TrendingUp : factor.impact === 'Negative' ? TrendingDown : Minus;
 const iconColor = factor.impact === 'Positive' ? 'text-apple-blue' : factor.impact === 'Negative' ? 'text-rose-500' : 'text-pure-black/20';
 return (
 <div key={factor.factor} className="p-4 bg-white border border-black/5 rounded-xl">
 <div className="flex items-start justify-between mb-2">
 <div className="flex items-center gap-2">
 <Icon size={14} className={iconColor} />
 <p className="text-[11px] font-semibold text-pure-black">{factor.factor}</p>
 </div>
 <span className="text-[11px] font-semibold text-pure-black tabular-nums">{factor.score}/100</span>
 </div>
 <div className="h-1.5 w-full bg-light-gray rounded-full overflow-hidden mb-2">
 <div
 className={cn('h-full rounded-full transition-all duration-700', factor.impact === 'Positive' ? 'bg-emerald-400' : factor.impact === 'Negative' ? 'bg-rose-400' : 'bg-slate-300')}
 style={{ width: `${factor.score}%` }}
 />
 </div>
 <p className="text-[9px] font-semibold text-pure-black/30">{factor.description}</p>
 <p className="text-[8px] font-bold text-pure-black/20 mt-0.5">Weight: {factor.weight}%</p>
 </div>
 );
 })}
 </div>

 {/* Recommended Terms */}
 {result.eligible && (
 <div className="p-5 bg-light-gray border border-slate-200 rounded-xl space-y-3">
 <p className="text-[10px] font-semibold text-pure-black/40 tracking-tight">RECOMMENDED CREDIT TERMS</p>
 {[
 { label: 'Credit Limit', value: `BHD ${result.recommendedLimit.toLocaleString(undefined, { minimumFractionDigits: 3 })}` },
 { label: 'Deposit:Credit Ratio', value: `1 : ${result.maxRatio.toFixed(1)}` },
 { label: 'APR', value: `${result.recommendedApr}%` },
 { label: 'Grace Period', value: '30 days' },
 { label: 'Next Review', value: new Date(result.reviewRequiredAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) },
 ].map(r => (
 <div key={r.label} className="flex justify-between items-center">
 <span className="text-[10px] font-semibold text-pure-black/40">{r.label}</span>
 <span className="text-[12px] font-semibold text-pure-black">{r.value}</span>
 </div>
 ))}
 </div>
 )}

 {/* Admin: Adjust Credit Line */}
 {adminMode && (
 <div className="border border-apple-blue/20 rounded-xl overflow-hidden">
 <button
 onClick={() => setIsEditing(!isEditing)}
 className="w-full p-4 flex items-center justify-between text-left bg-apple-blue/5 hover:bg-apple-blue/10 transition-colors"
 >
 <span className="text-[10px] font-semibold text-apple-blue tracking-tight">ADMIN: ADJUST CREDIT LINE</span>
 <ShieldCheck size={14} className="text-apple-blue" />
 </button>
 {isEditing && (
 <div className="p-5 space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-[9px] font-semibold text-pure-black/40 tracking-tight block mb-1.5">CREDIT LIMIT (BHD)</label>
 <input type="number" value={editLimit} onChange={e => setEditLimit(e.target.value)} min="0" step="100" className="w-full px-4 py-2.5 bg-light-gray border border-slate-200 rounded-xl text-[12px] text-pure-black outline-none focus:border-apple-blue transition-colors tabular-nums" />
 </div>
 <div>
 <label className="text-[9px] font-semibold text-pure-black/40 tracking-tight block mb-1.5">APR (%)</label>
 <input type="number" value={editApr} onChange={e => setEditApr(e.target.value)} min="0" max="50" step="0.5" className="w-full px-4 py-2.5 bg-light-gray border border-slate-200 rounded-xl text-[12px] text-pure-black outline-none focus:border-apple-blue transition-colors" />
 </div>
 <div>
 <label className="text-[9px] font-semibold text-pure-black/40 tracking-tight block mb-1.5">GRACE PERIOD (DAYS)</label>
 <select value={editGrace} onChange={e => setEditGrace(e.target.value)} className="w-full px-4 py-2.5 bg-light-gray border border-slate-200 rounded-xl text-[12px] text-pure-black outline-none focus:border-apple-blue transition-colors appearance-none">
 {['15', '30', '45', '60', '90'].map(d => <option key={d} value={d}>{d} days</option>)}
 </select>
 </div>
 <div className="flex items-end">
 <button onClick={() => setAutoRepay(!autoRepay)} className={cn('w-full py-2.5 rounded-xl border text-[10px] font-semibold transition-all flex items-center justify-center gap-2', autoRepay ? 'bg-apple-blue text-white border-apple-blue' : 'border-slate-200 text-pure-black/40 hover:border-apple-blue/40')}>
 {autoRepay ? <CheckCircle2 size={12} /> : null}
 Auto-Repay
 </button>
 </div>
 </div>
 <button
 onClick={handleSave}
 disabled={isSaving || saveSuccess}
 className={cn('w-full py-3 rounded-xl text-[11px] font-semibold tracking-tight flex items-center justify-center gap-2 transition-all active:scale-95', saveSuccess ? 'bg-emerald-500 text-white' : 'bg-pure-black text-apple-blue hover:bg-black disabled:opacity-50')}
 >
 {isSaving ? <><Loader2 size={12} className="animate-spin" /> Saving...</>
 : saveSuccess ? <><CheckCircle2 size={12} /> Saved!</>
 : <><Save size={12} /> Apply Credit Terms</>}
 </button>
 </div>
 )}
 </div>
 )}

 <p className="text-[8px] font-semibold text-pure-black/20 tracking-tight text-center">
 LAST COMPUTED: {new Date(result.lastComputedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
 </p>
 </div>
 );
}
