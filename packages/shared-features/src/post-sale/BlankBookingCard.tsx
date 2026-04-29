import React from 'react';
import { Plus, FileText } from 'lucide-react';

interface BlankBookingCardProps {
  onCreate?: () => void;
  onBack?: () => void;
}

export default function BlankBookingCard({ onCreate, onBack }: BlankBookingCardProps) {
  const handleCreate = onCreate ?? onBack ?? (() => {});
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="p-4 rounded-full bg-slate-100">
          <FileText size={24} className="text-slate-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-pure-black">Create Blank Booking</h3>
          <p className="text-[10px] text-pure-black/40 mt-1">Start a new booking from scratch</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus size={16} />
          Create Booking
        </button>
      </div>
    </div>
  );
}