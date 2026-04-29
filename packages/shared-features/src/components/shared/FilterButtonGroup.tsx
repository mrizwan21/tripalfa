import { cn } from '../../index';

export function FilterButtonGroup({ options, activeOption, onOptionSelect, renderLabel }: { options: string[], activeOption: string, onOptionSelect: (option: string) => void, renderLabel?: (option: string) => React.ReactNode }) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
 <button 
 key={o}
 onClick={() => onOptionSelect(o)}
 className={cn(
 "px-6 py-2 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-2",
 activeOption === o 
 ? "bg-white text-apple-blue shadow-sm" 
 : "text-black/50 hover:text-black"
 )}
 >
 {renderLabel ? renderLabel(o) : o}
 </button>
 ))}
 </div>
 );
}
