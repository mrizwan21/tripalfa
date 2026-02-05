#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p apps/booking-engine/src/pages
mkdir -p apps/booking-engine/src/components/booking
mkdir -p apps/booking-engine/src/components/Hotel
mkdir -p apps/booking-engine/src/components/payment
mkdir -p apps/booking-engine/src/lib

# 1) BookingManagement.tsx
cat > apps/booking-engine/src/pages/BookingManagement.tsx <<'EOF'
import React, { useEffect, useState } from 'react';
import { BookingList } from '../components/booking/BookingList';
import { fetchUserBookings } from '../lib/api';
import { Booking } from '../lib/srs-types';

export default function BookingManagement(): JSX.Element {
  const [bookings, setBookings] = useState<Booking[]>([]);
  useEffect(() => {
    fetchUserBookings().then(setBookings).catch(() => setBookings([]));
  }, []);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">My Bookings</h1>
      <BookingList bookings={bookings} />
    </div>
  );
}
EOF

# 2) BookingDetail.tsx
cat > apps/booking-engine/src/pages/BookingDetail.tsx <<'EOF'
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchBookingById } from '../lib/api';
import { Booking } from '../lib/srs-types';

export default function BookingDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  useEffect(() => {
    if (id) fetchBookingById(id).then(setBooking).catch(()=>setBooking(null));
  }, [id]);
  if (!booking) return <div className="p-6">Loading booking...</div>;
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Booking {booking.reference}</h1>
      <pre className="mt-4 bg-gray-100 p-4 rounded">{JSON.stringify(booking, null, 2)}</pre>
    </div>
  );
}
EOF

# 3) Wallet.tsx
cat > apps/booking-engine/src/pages/Wallet.tsx <<'EOF'
import React, { useEffect, useState } from 'react';
import { fetchWallets } from '../lib/api';
import { WalletAccount } from '../lib/srs-types';

export default function Wallet(): JSX.Element {
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  useEffect(()=>{ fetchWallets().then(setAccounts).catch(()=>setAccounts([])); }, []);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Wallet</h1>
      {accounts.length === 0 ? <div>No accounts found</div> : (
        <ul>
          {accounts.map(a=>(
            <li key={a.currency} className="mb-2">
              <strong>{a.currency}</strong>: {a.currentBalance.toFixed(2)} (pending {a.pendingBalance.toFixed(2)})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
EOF

# 4) BookingList.tsx
cat > apps/booking-engine/src/components/booking/BookingList.tsx <<'EOF'
import React from 'react';
import { Booking } from '../../lib/srs-types';
import { BookingCard } from './BookingCard';

export function BookingList({ bookings }: { bookings: Booking[] }) {
  if (!bookings || bookings.length === 0) return <div>No bookings found</div>;
  return (
    <div className="space-y-4">
      {bookings.map(b => <BookingCard key={b.id} booking={b} />)}
    </div>
  );
}
EOF

# 5) BookingCard.tsx
cat > apps/booking-engine/src/components/booking/BookingCard.tsx <<'EOF'
import React from 'react';
import { Booking } from '../../lib/srs-types';
import { Link } from 'react-router-dom';

export function BookingCard({ booking }: { booking: Booking }) {
  return (
    <div className="border rounded p-4 flex justify-between">
      <div>
        <div className="text-sm text-gray-500">{booking.product.toUpperCase()}</div>
        <div className="font-medium">{booking.reference}</div>
        <div className="text-sm">{booking.createdAt}</div>
        <div className="text-sm">Status: {booking.status}</div>
      </div>
      <div className="text-right">
        <div className="font-semibold">{booking.total.currency} {booking.total.amount.toFixed(2)}</div>
        <Link to={`/booking/${booking.id}`} className="inline-block mt-2 text-sm text-blue-600">View</Link>
      </div>
    </div>
  );
}
EOF

# 6) srs-types.ts
cat > apps/booking-engine/src/lib/srs-types.ts <<'EOF'
export type Money = { amount: number; currency: string };

export interface Booking {
  id: string;
  product: 'hotel' | 'flight';
  status: string;
  reference: string;
  total: Money;
  createdAt: string;
  raw?: any;
}

export interface WalletAccount {
  currency: string;
  currentBalance: number;
  pendingBalance: number;
}
EOF

# 7) Append API stubs to src/lib/api.ts (create file if missing)
API_FILE="apps/booking-engine/src/lib/api.ts"
if [ ! -f "$API_FILE" ]; then
  cat > "$API_FILE" <<'EOF'
/* Auto-generated API stubs for SRS PRs 1-4.
   These are frontend mocks; backend integration required for production.
*/
export async function fetchUserBookings() { return []; }
export async function fetchBookingById(id: string) { return null; }
export async function fetchWallets() { return []; }
EOF
fi

cat >> "$API_FILE" <<'EOF'

// --- SRS stubs (PRs 1-4) ---
import { Booking, WalletAccount } from './srs-types';

export async function fetchUserBookings(): Promise<Booking[]> {
  return [
    { id: '1', product: 'hotel', status: 'Vouchered', reference: 'TL-000001', total: { amount: 250, currency: 'USD' }, createdAt: new Date().toISOString() },
    { id: '2', product: 'flight', status: 'On hold', reference: 'TL-000002', total: { amount: 120, currency: 'USD' }, createdAt: new Date().toISOString() },
  ];
}

export async function fetchBookingById(id: string): Promise<Booking | null> {
  const all = await fetchUserBookings();
  return all.find(b=>b.id === id) || null;
}

export async function fetchWallets(): Promise<WalletAccount[]> {
  return [{ currency: 'USD', currentBalance: 50.0, pendingBalance: 0 }];
}

export async function searchHotels(params: { location: string; checkin: string; checkout: string; adults: number; children: number; currency?: string }) {
  const mock = [
    { id: 'h_1', name: 'Hotel A', location: 'City X', image: '', price: { amount: 120, currency: 'USD' } },
    { id: 'h_2', name: 'Hotel B', location: 'City X', image: '', price: { amount: 140, currency: 'USD' } },
  ];
  return mock;
}

export async function fetchHotelById(id: string) {
  return { id, name: `Hotel ${id}`, rooms: [{ id: 'r1', name: 'Standard', description: 'Standard room', price: { amount: 100, currency: 'USD' } }] };
}

export async function fetchAddonsFromHepstar(hotelId: string) {
  return [{ code: 'REF_PROT', title: 'Refund Protect', description: 'Protect your booking', price: { amount: 10, currency: 'USD' } }];
}

export async function holdHotelBooking(payload: any) {
  return { holdReference: 'HOLD-' + Math.floor(Math.random()*900000 + 100000), expiry: new Date(Date.now()+15*60*1000).toISOString() };
}

export async function processCardPayment(cardPayload: any) {
  return { success: true, transactionId: 'TXN-' + Math.floor(Math.random()*900000) };
}

export async function confirmBooking(payload: { holdReference?: string; paymentMethod?: any }) {
  return { bookingId: 'TL-' + Math.floor(Math.random()*900000 + 100000), status: 'Issued' };
}
// --- end stubs ---
EOF

# 8) HotelList.tsx
cat > apps/booking-engine/src/pages/HotelList.tsx <<'EOF'
import React, { useEffect, useState } from 'react';
import { searchHotels } from '../lib/api';
import { HotelCard } from '../components/Hotel/HotelCard';

export default function HotelList(): JSX.Element {
  const [hotels, setHotels] = useState<any[]>([]);
  useEffect(()=>{ searchHotels({ location: '', checkin:'', checkout:'', adults:1, children:0 }).then(setHotels).catch(()=>setHotels([])); }, []);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Hotels</h1>
      <div className="grid grid-cols-1 gap-4">
        {hotels.map(h => <HotelCard hotel={h} key={h.id} />)}
      </div>
    </div>
  );
}
EOF

# 9) HotelCard.tsx
cat > apps/booking-engine/src/components/Hotel/HotelCard.tsx <<'EOF'
import React from 'react';
import { Link } from 'react-router-dom';

export function HotelCard({ hotel }: { hotel: any }) {
  const image = hotel.image || '/assets/hotel-fallback.jpg';
  return (
    <article className="border rounded p-4 flex">
      <img src={image} alt={hotel.name} className="w-32 h-20 object-cover rounded mr-4"/>
      <div className="flex-1">
        <h3 className="font-semibold">{hotel.name}</h3>
        <div className="text-sm text-gray-600">{hotel.location}</div>
        <div className="mt-2 font-medium">{hotel.price?.currency} {hotel.price?.amount}</div>
        <div className="mt-2">
          <Link to={`/hotels/${hotel.id}`} className="text-blue-600 text-sm">View</Link>
        </div>
      </div>
    </article>
  );
}
EOF

# 10) HotelDetail.tsx
cat > apps/booking-engine/src/pages/HotelDetail.tsx <<'EOF'
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchHotelById, fetchAddonsFromHepstar, holdHotelBooking } from '../lib/api';
import { RoomList } from '../components/Hotel/RoomList';
import { AddOnService } from '../components/booking/AddOnService';

export default function HotelDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [hotel, setHotel] = useState<any|null>(null);
  const [selectedRooms, setSelectedRooms] = useState<Record<string,number>>({});
  const [addons, setAddons] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(()=>{ if(id) fetchHotelById(id).then(setHotel).catch(()=>setHotel(null)); }, [id]);
  useEffect(()=>{ if(id) fetchAddonsFromHepstar(id).then(setAddons).catch(()=>setAddons([])); }, [id]);

  if (!hotel) return <div className="p-6">Loading hotel...</div>;

  function handleProceed() {
    const totalRooms = Object.values(selectedRooms).reduce((s,n)=>s+n,0);
    if (totalRooms === 0) { alert('Please select at least 1 room'); return; }
    holdHotelBooking({ hotelId: id, rooms: selectedRooms, addons }).then((res)=> {
      navigate('/checkout', { state: { bookingHold: res } });
    });
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">{hotel.name}</h1>
      <div className="mt-4">
        <RoomList rooms={hotel.rooms || []} onChange={(r)=>setSelectedRooms(r)} />
      </div>
      <div className="mt-6">
        <h2 className="font-semibold">Add-ons</h2>
        <AddOnService addons={addons} />
      </div>
      <div className="mt-6">
        <button onClick={handleProceed} className="px-4 py-2 bg-blue-600 text-white rounded">Proceed to passenger info</button>
      </div>
    </div>
  );
}
EOF

# 11) RoomList.tsx
cat > apps/booking-engine/src/components/Hotel/RoomList.tsx <<'EOF'
import React, { useState } from 'react';

export function RoomList({ rooms, onChange }: { rooms: any[]; onChange: (sel: Record<string,number>)=>void }) {
  const [sel, setSel] = useState<Record<string,number>>({});
  function setRoom(id: string, qty: number) {
    const next = { ...sel, [id]: qty };
    setSel(next);
    onChange(next);
  }
  return (
    <div className="space-y-4">
      {rooms.map((r:any)=>(
        <div key={r.id} className="border p-3 rounded flex items-center justify-between">
          <div>
            <div className="font-medium">{r.name}</div>
            <div className="text-sm text-gray-600">{r.description}</div>
            <div className="text-sm mt-1 font-semibold">{r.price?.currency} {r.price?.amount}</div>
          </div>
          <div>
            <input type="number" min={0} defaultValue={0} onChange={e=>setRoom(r.id, Math.max(0, Number(e.target.value)))} className="w-20 border rounded p-1"/>
          </div>
        </div>
      ))}
    </div>
  );
}
EOF

# 12) AddOnService.tsx
cat > apps/booking-engine/src/components/booking/AddOnService.tsx <<'EOF'
import React, { useState } from 'react';

export function AddOnService({ addons }: { addons: any[] }) {
  const [selected, setSelected] = useState<Record<string,boolean>>({});
  function toggle(code: string) { setSelected(prev => ({ ...prev, [code]: !prev[code] })); }
  return (
    <div className="space-y-2">
      {addons.map(a=>(
        <div key={a.code} className="flex items-center justify-between border p-2 rounded">
          <div>
            <div className="font-medium">{a.title}</div>
            <div className="text-sm text-gray-600">{a.description}</div>
          </div>
          <div>
            <button onClick={()=>toggle(a.code)} className={'px-3 py-1 rounded ' + (selected[a.code] ? 'bg-green-600 text-white' : 'bg-gray-100')}>
              {selected[a.code] ? 'Selected' : 'Add'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
EOF

# 13) PassengerForm.tsx
cat > apps/booking-engine/src/components/booking/PassengerForm.tsx <<'EOF'
import React from 'react';

export function PassengerForm({ index }: { index: number }) {
  return (
    <div className="border p-3 rounded">
      <div className="mb-2 font-semibold">Passenger {index + 1}</div>
      <div className="grid grid-cols-2 gap-2">
        <input name={'g' + index + '_first'} placeholder="First name" className="p-2 border rounded" />
        <input name={'g' + index + '_last'} placeholder="Last name" className="p-2 border rounded" />
        <input name={'g' + index + '_dob'} placeholder="Date of birth (DD/MM/YYYY)" className="p-2 border rounded" />
        <input name={'g' + index + '_nationality'} placeholder="Nationality" className="p-2 border rounded" />
      </div>
    </div>
  );
}
EOF

# 14) CardForm.tsx
cat > apps/booking-engine/src/components/payment/CardForm.tsx <<'EOF'
import React, { useState } from 'react';

export function CardForm({ onPay }: { onPay: (payload:any)=>void }) {
  const [card, setCard] = useState({ number:'', expiry:'', cvv:'' });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    onPay({ card });
  }
  return (
    <form onSubmit={submit} className="space-y-2">
      <input className="w-full p-2 border rounded" placeholder="Card number" value={card.number} onChange={e=>setCard({...card, number:e.target.value})}/>
      <div className="flex gap-2">
        <input className="flex-1 p-2 border rounded" placeholder="MM/YY" value={card.expiry} onChange={e=>setCard({...card, expiry:e.target.value})}/>
        <input className="w-24 p-2 border rounded" placeholder="CVV" value={card.cvv} onChange={e=>setCard({...card, cvv:e.target.value})}/>
      </div>
      <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">Pay Now</button>
    </form>
  );
}
EOF

# 15) WalletSelector.tsx
cat > apps/booking-engine/src/components/payment/WalletSelector.tsx <<'EOF'
import React from 'react';
import { WalletAccount } from '../../lib/srs-types';

export function WalletSelector({ accounts, onSelect }: { accounts: WalletAccount[]; onSelect: (c:WalletAccount)=>void }) {
  if (!accounts || accounts.length === 0) return <div>No wallets</div>;
  return (
    <div>
      {accounts.map(a => (
        <button key={a.currency} className="mr-2 px-3 py-1 border rounded" onClick={()=>onSelect(a)}>
          {a.currency} {a.currentBalance.toFixed(2)}
        </button>
      ))}
    </div>
  );
}
EOF

# 16) Overwrite BookingConfirmation.tsx if exists, else create
cat > apps/booking-engine/src/pages/BookingConfirmation.tsx <<'EOF'
import React from 'react';
import { useLocation } from 'react-router-dom';

export default function BookingConfirmation(): JSX.Element {
  const { state } = useLocation();
  const bookingId = state?.bookingId || `TL-${String(Math.floor(Math.random()*900000 + 100000))}`;
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Booking confirmed</h1>
      <p className="mt-4">Your Booking ID: <strong>{bookingId}</strong></p>
      <p className="mt-2">A confirmation email has been sent to the lead passenger.</p>
    </div>
  );
}
EOF

# 17) Overwrite App.tsx to register new routes (backup existing)
APP_PATH="apps/booking-engine/src/App.tsx"
if [ -f "$APP_PATH" ]; then
  cp "$APP_PATH" "${APP_PATH}.bak"
fi

cat > "$APP_PATH" <<'EOF'
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Home from './pages/Home';
import FlightSearch from './pages/FlightSearch';
import HotelSearch from './pages/HotelSearch';
import HotelList from './pages/HotelList';
import HotelDetail from './pages/HotelDetail';
import BookingCheckout from './pages/BookingCheckout';
import BookingConfirmation from './pages/BookingConfirmation';
import BookingManagement from './pages/BookingManagement';
import BookingDetail from './pages/BookingDetail';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="flights" element={<FlightSearch />} />
          <Route path="hotels" element={<HotelSearch />} />
          <Route path="hotels/list" element={<HotelList />} />
          <Route path="hotels/:id" element={<HotelDetail />} />
          <Route path="checkout" element={<BookingCheckout />} />
          <Route path="confirmation" element={<BookingConfirmation />} />
          <Route path="bookings" element={<BookingManagement />} />
          <Route path="booking/:id" element={<BookingDetail />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
EOF

# Make script executable
chmod +x scripts/create_prs_1_4.sh

echo "SRS PRs 1-4 files created under apps/booking-engine (script ran)."
echo "Please run 'cd apps/booking-engine && npm install && npm run dev' to test locally."
