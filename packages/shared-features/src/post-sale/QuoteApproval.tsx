import React, { useState } from 'react';
import { CheckCircle2, Clock, DollarSign, FileText } from 'lucide-react';

interface QuoteApprovalProps {
  onBack?: () => void;
  onApprove?: (quoteId: string) => void;
  onReject?: (quoteId: string) => void;
}

const MOCK_QUOTES = [
  { id: 'QT-0001', passenger: 'Ahmed Al-Rashidi', route: 'BAH → LHR → BAH', amount: 'BHD 340.00', status: 'Pending', expires: '2h 15m' },
  { id: 'QT-0002', passenger: 'Sara Mansour', route: 'BAH → DXB', amount: 'BHD 95.00', status: 'Pending', expires: '4h 30m' },
];

export default function QuoteApproval({ onBack, onApprove, onReject }: QuoteApprovalProps) {
  const [quotes, setQuotes] = useState(MOCK_QUOTES);

  const handleApprove = (id: string) => {
    setQuotes(q => q.filter(x => x.id !== id));
    onApprove?.(id);
  };

  const handleReject = (id: string) => {
    setQuotes(q => q.filter(x => x.id !== id));
    onReject?.(id);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
        <FileText size={18} className="text-slate-600" />
        <h3 className="text-sm font-semibold text-pure-black">Quote Approvals</h3>
        {quotes.length > 0 && (
          <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
            {quotes.length} Pending
          </span>
        )}
      </div>

      {quotes.length === 0 ? (
        <div className="py-16 text-center">
          <CheckCircle2 size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-medium text-pure-black/40">No pending quotes</p>
          <p className="text-[10px] text-pure-black/30 mt-1">All quotes have been processed</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {quotes.map((quote) => (
            <div key={quote.id} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <DollarSign size={18} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-pure-black">{quote.passenger}</p>
                  <p className="text-[10px] text-pure-black/50">{quote.route}</p>
                  <p className="text-[10px] text-pure-black/40 flex items-center gap-1 mt-0.5">
                    <Clock size={10} /> Expires in {quote.expires}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-pure-black">{quote.amount}</p>
                <button
                  onClick={() => handleApprove(quote.id)}
                  className="px-3 py-1.5 bg-black text-white text-[10px] font-bold rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(quote.id)}
                  className="px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg hover:bg-red-100 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
