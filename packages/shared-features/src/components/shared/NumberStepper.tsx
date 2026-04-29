import { Minus, Plus } from 'lucide-react';
import { cn } from '../../index';

export function NumberStepper({ 
  label, 
  subtitle, 
  value, 
  onDecrement, 
  onIncrement, 
  min = 0, 
  max = 99 
}: { 
  label: string, 
  subtitle?: string, 
  value: number, 
  onDecrement: () => void, 
  onIncrement: () => void, 
  min?: number, 
  max?: number 
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex flex-col">
        <span className="text-[11px] font-bold text-near-black tracking-tight">{label}</span>
        {subtitle && <span className="text-[9px] font-medium text-near-black/30 tracking-tight">{subtitle}</span>}
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onDecrement}
          disabled={value <= min}
          className="w-8 h-8 rounded-lg border border-black/5 flex items-center justify-center text-near-black/40 hover:border-apple-blue hover:text-apple-blue disabled:opacity-20 transition-all bg-light-gray"
        >
          <Minus size={14} />
        </button>
        <span className="text-xs font-bold text-pure-black min-w-[20px] text-center tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={value >= max}
          className="w-8 h-8 rounded-lg border border-black/5 flex items-center justify-center text-near-black/40 hover:border-apple-blue hover:text-apple-blue disabled:opacity-20 transition-all bg-light-gray"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
