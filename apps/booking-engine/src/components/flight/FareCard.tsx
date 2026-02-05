import React from 'react';
import { Info, ShieldCheck, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface FareCardProps {
  amount: number;
  currency: string;
  onSelect?: () => void;
  isLoading?: boolean;
}

export function FareCard({ amount, currency, onSelect, isLoading }: FareCardProps) {
  const tax = Math.round(amount * 0.15);
  const baseFare = amount - tax;

  return (
    <div className="bg-[#111827] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6] opacity-10 rounded-full blur-3xl -translate-y-12 translate-x-12 group-hover:opacity-20 transition-opacity" />

      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#8B5CF6] mb-8 flex items-center gap-2">
        <CreditCard size={14} /> Fare Summary
      </h3>

      <div className="space-y-6 mb-10 pb-10 border-b border-white/10">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Base Fare</span>
          <span className="text-sm font-black tabular-nums">{formatCurrency(baseFare, currency)}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Taxes & Fees</span>
            <Info size={12} className="text-gray-600 cursor-help hover:text-gray-400 transition-colors" />
          </div>
          <span className="text-sm font-black tabular-nums">{formatCurrency(tax, currency)}</span>
        </div>
        <div className="pt-6 flex justify-between items-center border-t border-white/5">
          <span className="text-sm font-black uppercase tracking-widest">Grand Total</span>
          <span className="text-3xl font-black text-[#8B5CF6] tabular-nums">{formatCurrency(amount, currency)}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4 p-5 bg-white/5 rounded-[1.5rem] border border-white/10 group-hover:bg-white/10 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest">Elite Protection</p>
            <p className="text-[9px] text-gray-500 font-bold">Price locked for next 15 minutes</p>
          </div>
        </div>

        <button
          onClick={onSelect}
          disabled={isLoading}
          className="w-full h-16 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-900/40 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Confirm Selection'
          )}
        </button>

        <p className="text-center text-[9px] text-gray-600 font-bold uppercase tracking-widest">
          Secure checkout with 256-bit encryption
        </p>
      </div>
    </div>
  );
}
