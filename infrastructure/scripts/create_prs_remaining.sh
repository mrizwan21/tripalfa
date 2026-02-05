#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p apps/booking-engine/src/components/booking
mkdir -p apps/booking-engine/src/components/hotel
mkdir -p apps/booking-engine/src/components/flight
mkdir -p apps/booking-engine/src/components/payment
mkdir -p apps/booking-engine/src/lib
mkdir -p apps/booking-engine/src/pages

# BookingFilters.tsx
cat > apps/booking-engine/src/components/booking/BookingFilters.tsx <<'EOF'
import React from 'react';

export function BookingFilters({ onFilter }: { onFilter: (f:any)=>void }) {
  return (
    <div className="p-4 border rounded mb-4">
      <div className="grid grid-cols-4 gap-2">
        <input placeholder="Search (ref, passenger, details)" maxLength={50} className="p-2 border rounded" />
        <select className="p-2 border rounded">
          <option>All products</option>
          <option>Hotel</option>
          <option>Flight</option>
        </select>
        <input type="date" className="p-2 border rounded" />
        <input type="date" className="p-2 border rounded" />
      </div>
    </div>
  );
}
EOF

# BookingTable.tsx
cat > apps/booking-engine/src/components/booking/BookingTable.tsx <<'EOF'
import React from 'react';
import { Booking } from '../../lib/srs-types';
import { Link } from 'react-router-dom';

export function BookingTable({ items }: { items: Booking[] }) {
  if (!items || items.length === 0) return <div>No bookings</div>;
  return (
    <table className="w-full table-auto">
      <thead><tr className="text-left"><th>Ref</th><th>Product</th><th>Date</th><th>Status</th><th>Price</th><th>Action</th></tr></thead>
      <tbody>
        {items.map(b => (
          <tr key={b.id} className="border-t">
            <td>{b.reference}</td>
            <td>{b.product}</td>
            <td>{new Date(b.createdAt).toLocaleString()}</td>
            <td>{b.status}</td>
            <td>{b.total.currency} {b.total.amount.toFixed(2)}</td>
            <td><Link to={`/booking/${b.id}`} className="text-blue-600">View</Link></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
EOF

# BookingActions.tsx
cat > apps/booking-engine/src/components/booking/BookingActions.tsx <<'EOF'
import React from 'react';

export function BookingActions({ status, product }: { status: string; product:string }) {
  // Simplified: show buttons per SRS rules (frontend enforces enable/disable)
  const actions = [];
  if (product === 'flight') {
    if (status === 'On hold') actions.push('Pay');
    if (status === 'Ticketed') actions.push('Cancel & refund');
  } else {
    if (status === 'On hold') actions.push('Cancel');
    if (status === 'Vouchered') actions.push('Cancel & refund');
  }
  return (
    <div className="flex gap-2">
      {actions.map(a => <button key={a} className="px-2 py-1 border rounded text-sm">{a}</button>)}
      <button className="px-2 py-1 border rounded text-sm">View</button>
    </div>
  );
}
EOF

# ImageGallery.tsx
cat > apps/booking-engine/src/components/hotel/ImageGallery.tsx <<'EOF'
import React, { useState } from 'react';

export function ImageGallery({ images }: { images: {url:string, hero?:boolean}[] }) {
  const [idx, setIdx] = useState(0);
  if (!images || images.length === 0) return null;
  const img = images[idx] || images[0];
  return (
    <div className="space-y-2">
      <img src={img.url} alt="hotel" className="w-full h-60 object-cover rounded" />
      <div className="flex justify-between">
        <button onClick={()=>setIdx(Math.max(0, idx-1))} disabled={idx===0} className="px-2 py-1 border rounded"><</button>
        <div>{idx+1}/{images.length}</div>
        <button onClick={()=>setIdx(Math.min(images.length-1, idx+1))} disabled={idx===images.length-1} className="px-2 py-1 border rounded">></button>
      </div>
    </div>
  );
}
EOF

# Facilities.tsx
cat > apps/booking-engine/src/components/hotel/Facilities.tsx <<'EOF'
import React from 'react';

export function Facilities({ facilities }: { facilities: { name:string, free:boolean }[] }) {
  if (!facilities) return null;
  const free = facilities.filter(f=>f.free).slice(0,6);
  return (
    <ul className="flex gap-3 flex-wrap">
      {free.map((f, i)=> <li key={i} className="text-sm text-gray-600">{f.name}</li>)}
    </ul>
  );
}
EOF

# FlightList.tsx
cat > apps/booking-engine/src/pages/FlightList.tsx <<'EOF'
import React, { useEffect, useState } from 'react';
import { searchFlights } from '../lib/api';
import { FareCard } from '../components/flight/FareCard';

export default function FlightList() {
  const [fares, setFares] = useState<any[]>([]);
  useEffect(()=>{ searchFlights({ from:'', to:'', departDate:'', cabin:'Economy', pax:{adults:1,children:0,infants:0} }).then(setFares).catch(()=>setFares([])); }, []);
  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Flights</h1>
      <div className="space-y-4">{fares.map(f=> <FareCard key={f.fareId} fare={f} />)}</div>
    </div>
  );
}
EOF

# FareCard.tsx
cat > apps/booking-engine/src/components/flight/FareCard.tsx <<'EOF'
import React from 'react';

export function FareCard({ fare }: { fare:any }) {
  return (
    <div className="border p-3 rounded flex justify-between">
      <div>
        <div className="font-semibold">{fare.airline} {fare.cabin}</div>
        <div className="text-sm">{fare.duration} • {fare.stops===0?'Non-stop':fare.stops+' stop(s)'}</div>
      </div>
      <div className="text-right">
        <div className="font-medium">{fare.currency} {fare.amount}</div>
        <button className="mt-2 px-3 py-1 bg-blue-600 text-white rounded">Select</button>
      </div>
    </div>
  );
}
EOF

# FlightDetail.tsx
cat > apps/booking-engine/src/pages/FlightDetail.tsx <<'EOF'
import React from 'react';

export default function FlightDetail() {
  return (
    <div className="p-6">
      <h1 className="text-2xl">Flight detail (placeholder)</h1>
      <p>Implement fare breakdown, segments, baggage and seat selection per SRS.</p>
    </div>
  );
}
EOF

# AddExtraBaggage.tsx
cat > apps/booking-engine/src/components/flight/AddExtraBaggage.tsx <<'EOF'
import React, { useState } from 'react';

export function AddExtraBaggage({ onChange }: { onChange: (items:any[])=>void }) {
  const [items, setItems] = useState<any[]>([]);
  function add() { const it = { id: String(items.length+1), weight: 15, price: 30 }; setItems([...items, it]); onChange([...items, it]); }
  return (
    <div>
      <button onClick={add} className="px-3 py-1 border rounded">Add extra baggage</button>
      <ul>{items.map(i=> <li key={i.id}>{i.weight}kg - {i.price}</li>)}</ul>
    </div>
  );
}
EOF

# SeatSelection.tsx
cat > apps/booking-engine/src/components/flight/SeatSelection.tsx <<'EOF'
import React from 'react';

export function SeatSelection({ segments }: { segments:any[] }) {
  return (
    <div>
      <p className="text-sm text-gray-600">Seat selection UI (placeholder) — per SRS enable when supplier supports it.</p>
    </div>
  );
}
EOF

# WalletTopUp.tsx
cat > apps/booking-engine/src/pages/WalletTopUp.tsx <<'EOF'
import React, { useState } from 'react';
import { postTopUp } from '../lib/api';

export default function WalletTopUp() {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [msg, setMsg] = useState('');
  async function submit(e:any) {
    e.preventDefault();
    const res = await postTopUp({ accountFrom: 'STRIPE-USD', accountTo: 'WAL-USD', amount: Number(amount), currency, paymentType: 'card' });
    setMsg('Invoice: ' + res.invoiceNo + ' status:' + res.status);
  }
  return (
    <form className="p-4" onSubmit={submit}>
      <h2 className="text-xl mb-2">Top up Wallet</h2>
      <div className="mb-2"><input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount" className="p-2 border rounded" /></div>
      <div className="mb-2"><select value={currency} onChange={e=>setCurrency(e.target.value)} className="p-2 border rounded"><option>USD</option><option>EUR</option></select></div>
      <button className="px-3 py-1 bg-blue-600 text-white rounded" type="submit">Top Up</button>
      {msg && <div className="mt-2 text-sm text-green-600">{msg}</div>}
    </form>
  );
}
EOF

# price.ts utilities
cat > apps/booking-engine/src/lib/price.ts <<'EOF'
export function roomTotal(original:number, tax:number, commission:number, nights:number, qty:number) {
  const perNight = original + (tax || 0) + (commission || 0);
  return perNight * nights * qty;
}

export function formatMoney(amount:number, currency='USD') {
  return currency + ' ' + amount.toFixed(2);
}
EOF

# validation.ts utilities
cat > apps/booking-engine/src/lib/validation.ts <<'EOF'
export function isEmail(v?:string) {
  if (!v) return false;
  const re = /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/;
  return re.test(v);
}

export function isCardNumber(v?:string) {
  if (!v) return false;
  return /^[0-9]{13,19}$/.test(v);
}

export function isCVV(v?:string) {
  if (!v) return false;
  return /^[0-9]{3,4}$/.test(v);
}
EOF

# update api.ts stubs: append more endpoints if file exists
API="apps/booking-engine/src/lib/api.ts"
if [ ! -f "$API" ]; then
  cat > "$API" <<'EOF'
/* api stubs placeholder */
export async function dummy() { return null; }
EOF
fi

cat >> "$API" <<'EOF'

// Additional SRS API stubs
export async function searchFlights(params:any) {
  return [
    { fareId: 'f1', airline: 'ACME', cabin: 'Economy', amount: 200, currency: 'USD', duration: '2h 30m', stops:0 }
  ];
}

export async function postTopUp(payload:any) {
  return { invoiceNo: 'CI-' + Math.floor(Math.random()*9000+1000), status: 'On-Request' };
}

export async function getBookings(params:any) {
  return { items: await fetchUserBookings(), total:2, page:1, perPage:10 };
}

// Expose earlier functions (if not already)
export { fetchUserBookings, fetchBookingById, fetchWallets, searchHotels, fetchHotelById, fetchAddonsFromHepstar, holdHotelBooking, processCardPayment, confirmBooking } from './api';
EOF

# make executable
chmod +x scripts/create_prs_remaining.sh
echo "Created remaining scaffolding script: scripts/create_prs_remaining.sh. Run it to write files."
