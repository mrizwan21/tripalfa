import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, CheckCircle2, Loader2, MapPin, Wallet, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiManager, BookingActions, StarRating } from '../../index';
import { calculateStackedMarkup } from '../../utils/markupUtils';
import type { HotelRoom } from '../../types';

interface HotelGuestPayload {
 ancillaries?: {
 earlyCheckIn: boolean;
 breakfast: boolean;
 transfer: 'None' | 'Private' | 'Group';
 };
 travellers?: Array<{
 title: string;
 firstName: string;
 lastName: string;
 email: string;
 phone: string;
 }>;
 selectedInventoryBlock?: string | null;
}

export function HotelConfirmationStep({ payload, onBack }: { payload: HotelGuestPayload, onBack: () => void }) {
 const navigate = useNavigate();
 const { selectedHotelId, selectedRoomId, markupRules, hotelSearch } = useApp();

 const { ancillaries, travellers, selectedInventoryBlock } = payload || {};

 const { data: hotel, isLoading } = useQuery({
 queryKey: ['hotel', selectedHotelId],
 queryFn: async () => {
 if (!selectedHotelId) return null;
 return apiManager.getHotelById(selectedHotelId);
 },
 enabled: !!selectedHotelId
 });

 const room = hotel?.rooms.find((r: HotelRoom) => r.id === selectedRoomId) || hotel?.rooms[0];

 const [isIssuing, setIsIssuing] = useState(false);
 const [issuanceStep, setIssuanceStep] = useState(0);

 const ancillaryCosts = {
 earlyCheckIn: 35.00,
 breakfast: 22.50,
 transferPrivate: 45.00,
 transferGroup: 15.00
 };

 const currentAncillaryTotal = 
 (ancillaries?.earlyCheckIn ? ancillaryCosts.earlyCheckIn : 0) +
 (ancillaries?.breakfast ? ancillaryCosts.breakfast : 0) +
 (ancillaries?.transfer === 'Private' ? ancillaryCosts.transferPrivate : ancillaries?.transfer === 'Group' ? ancillaryCosts.transferGroup : 0);

 const stackedMarkup = (!room || !hotel) ? 0 : calculateStackedMarkup(room.price, markupRules, { hotelStars: hotel.stars, destinationCode: hotel.city }).totalMarkup;
 const finalPrice = room ? room.price + stackedMarkup + currentAncillaryTotal : 0;
 const earning = room ? (room.price - room.netFare) + (stackedMarkup > 0 ? stackedMarkup : 0) : 0;

 const handleBooking = async () => {
 if (!hotel || !room) return;
 setIsIssuing(true);
 
 try {
 setIssuanceStep(1);
 const generateReferenceNo = () => {
 return `TA-${String(Math.floor(Date.now() % 1000000)).padStart(6, '0')}`;
 };

 const bookingData = {
 referenceNo: generateReferenceNo(),
 service: 'Hotel',
 amount: finalPrice,
 netFare: room.netFare,
 markup: earning,
 passengerName: travellers?.[0] ? `${travellers[0].firstName} ${travellers[0].lastName}` : 'Guest',
 currency: hotel.currency || 'USD',
 status: 'Confirmed',
 travelDate: hotelSearch?.checkIn || new Date().toISOString(),
 hotelName: hotel.name,
 inventoryBlockId: selectedInventoryBlock,
 };

 setTimeout(() => setIssuanceStep(2), 1500);

 const result = await apiManager.post('/tenant/bookings', bookingData) as { id: string; pnr: string };
 
 setTimeout(() => {
 navigate(`/booking/${result.id}`, { state: { confirmed: true, ref: result.id } });
 }, 3000);
 } catch (err: unknown) {
 console.error('Hotel booking failed:', err);
 setIsIssuing(false);
 alert('Booking failed. Please check your balance or inventory.');
 }
 };

 return (
 <>
 <div className="booking-header animate-fade mb-12 flex justify-between items-end">
 <div>
 <button onClick={onBack} disabled={isIssuing} className="text-pure-black text-xs font-semibold hover:underline mb-4">
 Modify Reservation Details
 </button>
 <h1 className="text-2xl font-semibold text-pure-black mb-4 tracking-tight">Final Authorization Segment</h1>
 </div>
 </div>

 {isLoading || !hotel || !room ? (
 <div className="flex justify-center items-center py-60">
 <Loader2 className="animate-spin text-pure-black"size={40} />
 </div>
 ) : (
 <div className="booking-content flex flex-col md:flex-row gap-12 animate-slide-up">
 
 <div className="main-area flex-1">
 {/* Review Card */}
 <div className="card mb-12 overflow-hidden shadow-sm border-navy/5">
 <div className="flex p-8 items-center gap-8 bg-white border-b border-navy/5">
 <div className="w-32 h-32 rounded-xl overflow-hidden shrink-0">
 <img src={hotel.image} className="w-full h-full object-cover"alt={hotel.name} />
 </div>
 <div>
 <h2 className="text-xl font-semibold text-pure-black tracking-tight mb-2">{hotel.name}</h2>
 <StarRating rating={hotel.stars} />
 <div className="flex items-center gap-2 mt-4 text-xs font-bold text-pure-black/50">
 <MapPin size={14} className="text-apple-blue"/> {hotel.address}
 </div>
 </div>
 </div>
 <div className="p-8 grid grid-cols-2 gap-8 bg-light-gray">
 <div>
 <h3 className="text-[10px] font-semibold text-pure-black/40 mb-1">Stay Duration</h3>
 <div className="text-sm font-semibold text-pure-black flex items-center gap-2">
 <Calendar size={14} className="text-apple-blue"/> {hotelSearch?.checkIn || '12 MAY'} to {hotelSearch?.checkOut || '15 MAY'}
 </div>
 </div>
 <div>
 <h3 className="text-[10px] font-semibold text-pure-black/40 mb-1">Room Classification</h3>
 <div className="text-sm font-semibold text-pure-black">{room.name}</div>
 </div>
 </div>
 </div>

 <BookingActions 
 primaryLabel="EXECUTE SECURE BLOCK"
 secondaryLabel="CANCEL"
 onPrimary={handleBooking}
 onSecondary={onBack}
 isIssuing={isIssuing}
 issuanceStep={issuanceStep}
 issuanceSteps={['Allocating Inventory...', 'Synchronizing Ledger...', 'Generating E-Voucher...']}
 stepLabels={['Booking Secured', 'Payment', 'Voucher']}
 centerIcon={<ShieldCheck size={32} />}
 transactionPrefix="HTL-B"
 />
 </div>

 {/* Settlement Matrix Aside */}
 <aside className="sidebar-area w-full md:w-[350px]">
 <div className="card sticky top-24 shadow-xl border border-navy/5 overflow-hidden rounded-xl bg-white">
 <div className="py-6 px-8 bg-black text-white flex justify-between items-center">
 <h2 className="flex items-center gap-2 text-[10px] font-semibold"><Wallet size={14} className="text-apple-blue"/> Settlement Matrix</h2>
 <div className="px-2 py-0.5 bg-apple-blue/20 rounded text-[8px] font-semibold text-apple-blue">LIVE AUDIT</div>
 </div>
 <div className="p-8 space-y-4">
 <div className="flex justify-between items-center">
 <span className="text-[10px] font-semibold text-pure-black/40">Base Rate</span>
 <span className="text-xs font-semibold text-pure-black">{hotel.currency} {room.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[10px] font-semibold text-pure-black/40">Markups</span>
 <span className="text-xs font-semibold text-apple-blue">+{hotel.currency} {stackedMarkup.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
 </div>

 {currentAncillaryTotal > 0 && (
 <div className="pt-4 border-t border-navy/5 space-y-2">
 <span className="text-[9px] font-semibold text-apple-blue mb-2 block">Ancillaries Applied</span>
 {ancillaries?.earlyCheckIn && (
 <div className="flex justify-between text-xs font-bold text-pure-black">
 <span>Early Check-in</span>
 <span>{hotel.currency} {ancillaryCosts.earlyCheckIn.toFixed(2)}</span>
 </div>
 )}
 {ancillaries?.breakfast && (
 <div className="flex justify-between text-xs font-bold text-pure-black">
 <span>Breakfast</span>
 <span>{hotel.currency} {ancillaryCosts.breakfast.toFixed(2)}</span>
 </div>
 )}
 {ancillaries?.transfer !== 'None' && ancillaries?.transfer && (
 <div className="flex justify-between text-xs font-bold text-pure-black">
 <span>{ancillaries.transfer} Transfer</span>
 <span>{hotel.currency} {(ancillaries.transfer === 'Private' ? ancillaryCosts.transferPrivate : ancillaryCosts.transferGroup).toFixed(2)}</span>
 </div>
 )}
 </div>
 )}
 </div>

 <div className="p-8 bg-black text-white relative">
 <div className="flex justify-between items-center mb-4">
 <span className="text-[9px] font-semibold text-apple-blue">Total Issuance Amount</span>
 </div>
 <div className="text-3xl font-semibold mb-4">
 <span className="text-sm mr-2 opacity-50">{hotel.currency}</span>
 {finalPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}
 </div>
 <div className="text-[9px] text-emerald-400 font-semibold flex items-center gap-2">
 <CheckCircle2 size={12} /> Expected Margin: {hotel.currency} {earning.toLocaleString(undefined, {minimumFractionDigits: 2})}
 </div>
 </div>
 </div>
 </aside>
 </div>
 )}
 </>
 );
}
