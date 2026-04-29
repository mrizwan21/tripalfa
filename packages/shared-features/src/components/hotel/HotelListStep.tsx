import React from 'react';

export function HotelListStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="p-8 bg-white rounded-xl border border-navy/5 shadow-apple">
      <h2 className="text-2xl font-bold text-pure-black mb-4">Hotel List</h2>
      <p className="text-pure-black/60 mb-6">
        This component is a placeholder. In a real implementation, you would see a list of hotels here.
      </p>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border border-navy/10 rounded-lg flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Hotel {i}</h3>
              <p className="text-sm text-pure-black/40">Sample hotel description</p>
            </div>
            <button className="px-4 py-2 bg-pure-black text-white text-sm font-semibold rounded-lg hover:bg-apple-blue transition-all">
              Select
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={onNext}
        className="mt-8 px-6 py-3 bg-pure-black text-apple-blue text-sm font-semibold rounded-xl shadow-sm hover:bg-black transition-all"
      >
        Continue to Room Selection
      </button>
    </div>
  );
}