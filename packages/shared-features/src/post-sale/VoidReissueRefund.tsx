import React from 'react';
import { CreditCard, RefreshCcw, Ban } from 'lucide-react';

interface VoidReissueRefundProps {
  onAction: (type: 'void' | 'reissue' | 'refund') => void;
}

export default function VoidReissueRefund({ onAction }: VoidReissueRefundProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <h3 className="text-sm font-semibold text-pure-black mb-4">Post-Sale Actions</h3>
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => onAction('void')}
          className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 hover:border-red-200 hover:bg-red-50 transition-colors"
        >
          <Ban size={20} className="text-red-600" />
          <span className="text-[10px] font-bold text-red-600 uppercase">Void</span>
        </button>
        <button
          onClick={() => onAction('reissue')}
          className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50 transition-colors"
        >
          <RefreshCcw size={20} className="text-blue-600" />
          <span className="text-[10px] font-bold text-blue-600 uppercase">Reissue</span>
        </button>
        <button
          onClick={() => onAction('refund')}
          className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 transition-colors"
        >
          <CreditCard size={20} className="text-emerald-600" />
          <span className="text-[10px] font-bold text-emerald-600 uppercase">Refund</span>
        </button>
      </div>
    </div>
  );
}