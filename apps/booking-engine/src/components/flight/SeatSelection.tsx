import React, { useState } from 'react';
import { Armchair, CheckCircle2, Info } from 'lucide-react';

interface Seat {
  id: string;
  type: 'standard' | 'extra' | 'occupied';
  price: number;
}

export function SeatSelection() {
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);

  const rows = ['A', 'B', 'C', '', 'D', 'E', 'F'];
  const seatMatrix = Array.from({ length: 15 }, (_, r) =>
    rows.map((col, c) => col ? ({
      id: `${r + 1}${col}`,
      type: (r < 3) ? 'extra' : (Math.random() > 0.3 ? 'standard' : 'occupied') as any,
      price: (r < 3) ? 45 : 15
    } as Seat) : null)
  );

  return (
    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
      <div className="p-10 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-[#8B5CF6]">
            <Armchair size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Seat Selection</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Select your preferred spot in the cabin</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-100" />
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Standard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-100" />
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Extra Legroom</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Occupied</span>
          </div>
        </div>
      </div>

      <div className="p-10 bg-gray-50/50">
        <div className="max-w-md mx-auto bg-white rounded-[2.5rem] p-10 shadow-inner border border-gray-100 relative">
          {/* Cockpit Indicator */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-100 rounded-t-full flex items-center justify-center">
            <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Flight Deck</span>
          </div>

          <div className="space-y-4">
            {seatMatrix.map((row, rIdx) => (
              <div key={rIdx} className="flex justify-between items-center gap-2">
                <div className="w-4 text-[10px] font-black text-gray-300">{rIdx + 1}</div>
                <div className="flex-1 flex justify-between gap-1">
                  {row.map((seat, sIdx) => {
                    if (!seat) return <div key={sIdx} className="w-6" />; // Aisle

                    const isSelected = selectedSeat === seat.id;
                    const isOccupied = seat.type === 'occupied';

                    return (
                      <button
                        key={sIdx}
                        disabled={isOccupied}
                        onClick={() => setSelectedSeat(isSelected ? null : seat.id)}
                        className={`w-8 h-9 rounded-lg flex items-center justify-center transition-all relative ${isOccupied ? 'bg-gray-100 text-gray-300 cursor-not-allowed' :
                            isSelected ? 'bg-[#8B5CF6] text-white shadow-lg shadow-purple-200 scale-110 z-10' :
                              seat.type === 'extra' ? 'bg-purple-50 text-purple-400 hover:bg-purple-100' :
                                'bg-gray-50 text-gray-400 hover:bg-gray-100'
                          }`}
                      >
                        {isSelected ? <CheckCircle2 size={12} /> : <div className="w-1 h-1 rounded-full bg-current opacity-20" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-10 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-gray-50 rounded-2xl">
            <Info size={20} className="text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-black text-gray-900 leading-tight">Emergency Exit Rows</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Passengers must meet safety requirements</p>
          </div>
        </div>

        {selectedSeat ? (
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Selected Seat</p>
              <p className="text-xl font-black text-[#8B5CF6] tracking-tighter">{selectedSeat}</p>
            </div>
            <button className="h-14 px-8 bg-[#8B5CF6] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7C3AED] transition-all active:scale-95 shadow-lg shadow-purple-100">
              Confirm Seat
            </button>
          </div>
        ) : (
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Please select a seat to continue</p>
        )}
      </div>
    </div>
  );
}
