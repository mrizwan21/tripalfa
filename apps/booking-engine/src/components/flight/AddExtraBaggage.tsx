import React from 'react';
import { Luggage, Minus, Plus } from 'lucide-react';
import { formatCurrency } from '@tripalfa/ui-components';

interface AddExtraBaggageProps {
  count: number;
  onChange: (newCount: number) => void;
  pricePerBag?: number;
}

export function AddExtraBaggage({ count, onChange, pricePerBag = 50 }: AddExtraBaggageProps) {
  return (
    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden group hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-500">
      <div className="p-10 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform duration-500">
            <Luggage size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Extra Baggage</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Enhance your check-in allowance</p>
          </div>
        </div>
      </div>
      <div className="p-10 flex flex-col md:flex-row items-center justify-between bg-gray-50/30 gap-6">
        <div className="space-y-1 text-center md:text-left">
          <p className="text-base font-black text-gray-900">23kg Additional Checked Bag</p>
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{formatCurrency(pricePerBag)} per unit</span>
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Max 3 per passenger</span>
          </div>
        </div>

        <div className="flex items-center gap-6 bg-white p-3 rounded-[1.5rem] border border-gray-100 shadow-sm">
          <button
            onClick={() => onChange(Math.max(0, count - 1))}
            disabled={count === 0}
            className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all hover:bg-rose-50 disabled:opacity-30 active:scale-90"
          >
            <Minus size={18} />
          </button>

          <div className="flex flex-col items-center w-12">
            <span className="text-xl font-black text-gray-900 tabular-nums">{count}</span>
            <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">Bags</span>
          </div>

          <button
            onClick={() => onChange(Math.min(3, count + 1))}
            disabled={count >= 3}
            className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#152467] transition-all hover:bg-purple-50 disabled:opacity-30 active:scale-90"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {count > 0 && (
        <div className="px-10 py-4 bg-[#152467] text-white flex items-center justify-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Added to Selection: {formatCurrency(count * pricePerBag)}</span>
        </div>
      )}
    </div>
  );
}
