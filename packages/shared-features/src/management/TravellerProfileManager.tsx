import React from 'react';
import { User, Mail, Phone, Edit2 } from 'lucide-react';

interface TravellerProfileManagerProps {
  traveller: {
    id: string;
    name: string;
    email: string;
    phone: string;
    tier: string;
  };
}

export default function TravellerProfileManager({ traveller }: TravellerProfileManagerProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
            <User size={32} className="text-slate-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-pure-black">{traveller.name}</h3>
            <p className="text-sm text-pure-black/50">{traveller.tier} Member</p>
          </div>
        </div>
        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <Edit2 size={18} className="text-slate-600" />
        </button>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <Mail size={18} className="text-slate-400" />
          <div>
            <p className="text-[10px] font-bold text-pure-black/40 uppercase tracking-tight">Email</p>
            <p className="text-sm text-pure-black">{traveller.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Phone size={18} className="text-slate-400" />
          <div>
            <p className="text-[10px] font-bold text-pure-black/40 uppercase tracking-tight">Phone</p>
            <p className="text-sm text-pure-black">{traveller.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
}