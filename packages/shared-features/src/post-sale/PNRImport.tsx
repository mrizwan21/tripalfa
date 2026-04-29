import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, XCircle } from 'lucide-react';

interface PNRImportProps {
  onImport: (pnr: string) => void;
}

export default function PNRImport({ onImport }: PNRImportProps) {
  const [pnr, setPnr] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleImport = () => {
    if (pnr.trim()) {
      onImport(pnr);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } else {
      setStatus('error');
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={18} className="text-slate-600" />
        <h3 className="text-sm font-semibold text-pure-black">PNR Import</h3>
      </div>
      <div className="space-y-3">
        <input
          type="text"
          value={pnr}
          onChange={(e) => {
            setPnr(e.target.value);
            setStatus('idle');
          }}
          placeholder="Enter PNR code"
          className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-black"
        />
        <button
          onClick={handleImport}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Upload size={16} />
          Import PNR
        </button>
        {status === 'success' && (
          <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-bold">
            <CheckCircle2 size={14} />
            PNR imported successfully
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-600 text-[10px] font-bold">
            <XCircle size={14} />
            Please enter a valid PNR
          </div>
        )}
      </div>
    </div>
  );
}