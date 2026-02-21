import React, { useState } from 'react';

export function CardForm({ onPay }: { onPay: (payload:any)=>void }) {
  const [card, setCard] = useState({ number:'', expiry:'', cvv:'' });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    onPay({ card });
  }
  return (
    <form onSubmit={submit} className="space-y-2">
      <input 
        id="card-number"
        name="card-number"
        className="w-full p-2 border rounded" 
        placeholder="Card number" 
        value={card.number} 
        onChange={e=>setCard({...card, number:e.target.value})}
      />
      <div className="flex gap-2">
        <input 
          id="card-expiry"
          name="card-expiry"
          className="flex-1 p-2 border rounded" 
          placeholder="MM/YY" 
          value={card.expiry} 
          onChange={e=>setCard({...card, expiry:e.target.value})}
        />
        <input 
          id="card-cvv"
          name="card-cvv"
          className="w-24 p-2 border rounded" 
          placeholder="CVV" 
          value={card.cvv} 
          onChange={e=>setCard({...card, cvv:e.target.value})}
        />
      </div>
      <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">Pay Now</button>
    </form>
  );
}
