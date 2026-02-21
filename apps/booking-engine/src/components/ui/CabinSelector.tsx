import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown } from 'lucide-react';

export function CabinSelector() {
    const [selected, setSelected] = useState('Economy');
    const [open, setOpen] = useState(false);

    const options = ['First', 'Premium Business', 'Business', 'Premium Economy', 'Economy'];

    return (
        <div>
            {/* Hidden select for E2E testing */}
            <select data-testid="flight-class" className="hidden" value={selected} onChange={(e) => setSelected(e.target.value)}>
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
            <Popover.Root open={open} onOpenChange={setOpen} modal={true}>
            <Popover.Trigger asChild>
                <button className="flex items-center gap-2 bg-transparent text-white font-medium hover:bg-white/10 px-3 py-1.5 rounded transition-colors group">
                    <span>{selected}</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content className="w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-[100] animate-in fade-in-0 zoom-in-95" sideOffset={8} align="end" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <h3 className="font-bold text-lg mb-4 text-gray-900">Cabin Class</h3>
                    <div className="space-y-2">
                        {options.map((opt) => (
                            <div
                                key={opt}
                                className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-blue-50 group"
                                onClick={() => { setSelected(opt); setOpen(false); }}
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center border-gray-300 group-hover:border-[#FFD700] ${selected === opt ? 'bg-[#FFD700] border-[#FFD700]' : 'bg-white'}`}>
                                    {selected === opt && <Check size={12} className="text-black" strokeWidth={3} />}
                                </div>
                                <span className="text-gray-700 font-medium">{opt}</span>
                            </div>
                        ))}
                    </div>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
        </div>
    );
}
