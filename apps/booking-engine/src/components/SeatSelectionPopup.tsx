import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Info, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { useQuery } from '@tanstack/react-query';
import { fetchSeatMaps } from '../lib/api';

interface SeatSelectionPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedSeats: any[]) => void;
    isLCC?: boolean;
    offerId?: string;
}

export const SeatSelectionPopup = ({ isOpen, onClose, onConfirm, isLCC = false, offerId }: SeatSelectionPopupProps): React.JSX.Element | null => {
    const [selectedPassenger, setSelectedPassenger] = useState(1);
    const [isConfirming, setIsConfirming] = useState(false);

    const { data: seatMaps, isLoading } = useQuery({
        queryKey: ['seat-maps', offerId],
        queryFn: () => fetchSeatMaps(offerId!),
        enabled: !!offerId && isOpen
    });

    const [seatMap, setSeatMap] = React.useState<any[]>([]);
    const [selectedSeats, setSelectedSeats] = useState<any[]>([]);

    React.useEffect(() => {
        if (seatMaps && seatMaps.length > 0) {
            const firstMap = seatMaps[0];
            const flatMap: any[] = [];
            firstMap.cabins.forEach((cabin: any) => {
                cabin.rows.forEach((row: any) => {
                    row.sections.forEach((section: any) => {
                        section.elements.forEach((element: any) => {
                            if (element.type === 'seat') {
                                flatMap.push({
                                    id: element.designator,
                                    designator: element.designator,
                                    status: element.available_services?.length > 0 ? 'free' : 'unavailable',
                                    price: parseFloat(element.available_services?.[0]?.total_amount || '0'),
                                    isExitRow: row.is_exit_row === true
                                });
                            }
                        });
                    });
                });
            });
            setSeatMap(flatMap);
        } else if (!isLoading && !seatMaps && isOpen) {
            const mockSeats = Array.from({ length: 90 }, (_, i) => ({
                id: i + 1,
                designator: `${Math.ceil((i + 1) / 6)}${'ABCDEF'[i % 6]}`,
                status: Math.random() > 0.3 ? 'free' : 'unavailable',
                price: Math.random() > 0.8 ? 50 : 0,
                isExitRow: (i >= 54 && i < 60)
            }));
            setSeatMap(mockSeats);
        }
    }, [seatMaps, isLoading, isOpen]);

    if (!isOpen) return null;

    const passengers = [
        { id: 1, name: 'Arun Kumar', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arun' },
        { id: 2, name: 'Enbeae Mohamed', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Enbeae' },
        { id: 3, name: 'Nader Alqamoudi', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nader' }
    ];

    if (isConfirming) {
        return (
            <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsConfirming(false)} />
                <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-12 flex flex-col items-center gap-8 animate-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 rounded-full bg-[#10B981] flex items-center justify-center shadow-xl shadow-green-100 relative">
                        <div className="absolute inset-0 bg-[#10B981] blur-xl opacity-20 scale-150 animate-pulse" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 text-center">Are you sure you want to add Selected Seat to the booking</h2>

                    <div className="w-full space-y-4">
                        <p className="text-[10px] font-black text-center text-[#8B5CF6] uppercase tracking-widest">Seat selected summary</p>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-gray-50">
                                    <th className="px-4 py-2 text-left text-[8px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                                    <th className="px-4 py-2 text-left text-[8px] font-black text-gray-400 uppercase tracking-widest">Flight No.</th>
                                    <th className="px-4 py-2 text-left text-[8px] font-black text-gray-400 uppercase tracking-widest">Sequence No.</th>
                                    <th className="px-4 py-2 text-left text-[8px] font-black text-gray-400 uppercase tracking-widest">Seat No.</th>
                                    <th className="px-4 py-2 text-left text-[8px] font-black text-gray-400 uppercase tracking-widest">Class</th>
                                    <th className="px-4 py-2 text-left text-[8px] font-black text-gray-400 uppercase tracking-widest">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {selectedSeats.map((seat, i) => (
                                    <tr key={i} className="text-[9px] font-bold text-gray-600">
                                        <td className="px-4 py-3 flex items-center gap-2">
                                            <div className="w-3 h-3 bg-gray-200 rounded-sm" />
                                            {seat.name}
                                        </td>
                                        <td className="px-4 py-3">{seat.flightNo}</td>
                                        <td className="px-4 py-3">{seat.seqNo}</td>
                                        <td className="px-4 py-3">{seat.seatNo}</td>
                                        <td className="px-4 py-3">{seat.class}</td>
                                        <td className="px-4 py-3">${seat.price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex gap-4 w-full">
                        <button onClick={() => setIsConfirming(false)} className="flex-1 h-12 rounded-xl border border-[#8B5CF6] text-[#8B5CF6] font-black text-xs uppercase tracking-widest">No Need</button>
                        <button onClick={() => onConfirm(selectedSeats)} className="flex-1 h-12 rounded-xl bg-[#8B5CF6] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-100 transition-all active:scale-95">Yes, Sure</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative bg-white w-full max-w-5xl rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-500 border border-gray-100 flex flex-col max-h-[95vh]" data-testid="seat-selection-modal">

                <div className="p-8 text-center relative border-b border-gray-50">
                    <h2 className="text-2xl font-black text-gray-900">Seat Map</h2>
                    <button onClick={onClose} className="absolute top-8 right-8 p-2 text-gray-400 hover:text-gray-900 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-12 space-y-12">
                    <div className="flex items-center justify-center gap-6">
                        <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-all">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex gap-4">
                            {passengers.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPassenger(p.id)}
                                    className={`px-8 h-14 rounded-[2rem] flex items-center gap-4 border transition-all ${selectedPassenger === p.id
                                        ? 'bg-[#FFD700] border-[#FFD700] shadow-xl shadow-yellow-100 scale-105'
                                        : 'border-gray-100 text-gray-400'
                                        }`}
                                >
                                    <img src={p.avatar} className="w-8 h-8 rounded-full bg-blue-100 border border-white" alt="" />
                                    <span className="text-[11px] font-black uppercase tracking-widest">{p.name}</span>
                                </button>
                            ))}
                        </div>
                        <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-all">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="flex flex-col items-center gap-8 bg-gray-50/50 p-12 rounded-[3.5rem] border border-gray-100">
                        <div className="flex gap-10">
                            <div className="flex items-center gap-2 text-[#8B5CF6] font-black text-xs uppercase tracking-widest">Select the seat</div>
                            <div className="flex gap-4">
                                <button className="px-6 py-2 bg-[#8B5CF6] text-white rounded-lg text-xs font-black flex items-center gap-2">DXB - LON <img src="/airplane-white.svg" className="w-4 h-4 opacity-50 rotate-90" /></button>
                                <button className="px-6 py-2 border border-[#8B5CF6] text-[#8B5CF6] rounded-lg text-xs font-black flex items-center gap-2">LON - DXB <img src="/airplane-purple.svg" className="w-4 h-4 opacity-50 rotate-90" /></button>
                            </div>
                        </div>

                        <div className="flex gap-8">
                            {[
                                { label: 'Seat Unavailable', color: 'bg-gray-200' },
                                { label: isLCC ? 'Paid Seat ($15+)' : 'Free Seat ($0)', color: 'bg-[#8B5CF6]' },
                                { label: 'Premium/Exit row', color: 'bg-purple-300' },
                                { label: 'Chosen Seat', color: 'bg-[#FFD700]' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                    <span className="text-[10px] font-bold text-gray-400">{item.label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="relative w-full max-w-2xl bg-white border border-gray-100 rounded-2xl h-auto flex flex-col items-center justify-between p-8 px-12 group overflow-hidden">
                            <div className="absolute inset-y-0 left-0 w-8 bg-gray-100 flex items-center justify-center border-r border-gray-200">
                                <span className="text-[8px] font-black text-gray-300 rotate-270 uppercase tracking-widest">Exit row</span>
                            </div>
                            <div className="absolute inset-y-0 right-0 w-8 bg-gray-100 flex items-center justify-center border-l border-gray-200">
                                <span className="text-[8px] font-black text-gray-300 rotate-90 uppercase tracking-widest">Exit row</span>
                            </div>
                            <div className="relative w-full max-w-sm">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                                        <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin" />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Live Seat Map...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-6 gap-2">
                                        {seatMap.map((s: any) => (
                                            <button
                                                key={s.designator}
                                                disabled={s.status === 'unavailable'}
                                                onClick={() => {
                                                    const seatNo = s.designator;
                                                    const currentPassenger = passengers.find(p => p.id === selectedPassenger);
                                                    setSelectedSeats(prev => {
                                                        const exists = prev.find(st => st.name === currentPassenger?.name);
                                                        if (exists) {
                                                            return prev.map(st => st.name === currentPassenger?.name ? { ...st, seatNo, price: s.price } : st);
                                                        }
                                                        return [...prev, { name: currentPassenger?.name, flightNo: 'EK226', seqNo: '1', seatNo, class: 'Y', price: s.price }];
                                                    });
                                                }}
                                                className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 active:scale-95 flex flex-col items-center justify-center text-[7px] font-black ${s.status === 'unavailable' ? 'bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed' :
                                                    s.isExitRow ? 'bg-purple-300 border-purple-300 text-purple-700' :
                                                        selectedSeats.find(st => st.seatNo === s.designator) ? 'bg-[#FFD700] border-[#FFD700] text-black shadow-lg shadow-yellow-100' :
                                                            s.status === 'free' ? 'bg-white border-gray-100 text-[#8B5CF6]' :
                                                                'bg-[#8B5CF6] border-[#8B5CF6] text-white shadow-lg shadow-purple-100'
                                                    }`}
                                            >
                                                <span>{s.designator}</span>
                                                {s.price > 0 && <span className="text-[4px] mt-0.5">${s.price}</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 space-y-6 w-full">
                            <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Seat selected summary</h3>
                            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                                <table className="w-full border-collapse">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                                            <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Flight No.</th>
                                            <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Sequence No.</th>
                                            <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Seat No.</th>
                                            <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Class</th>
                                            <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {selectedSeats.map((seat: any, i: number) => (
                                            <tr key={i} className="text-[10px] font-black text-gray-700">
                                                <td className="px-6 py-4 flex items-center gap-3">
                                                    <div className="w-4 h-4 rounded-full border-2 border-[#FFD700] bg-white" />
                                                    {seat.name}
                                                </td>
                                                <td className="px-6 py-4">{seat.flightNo}</td>
                                                <td className="px-6 py-4">{seat.seqNo}</td>
                                                <td className="px-6 py-4">{seat.seatNo}</td>
                                                <td className="px-6 py-4">{seat.class}</td>
                                                <td className="px-6 py-4">${seat.price}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-8 w-full">
                            <Button
                                onClick={() => setIsConfirming(true)}
                                data-testid="confirm-seat-selection"
                                className="w-full max-w-xl h-14 rounded-2xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-black text-sm uppercase tracking-[4px] shadow-2xl shadow-purple-100 transition-all hover:-translate-y-1"
                            >
                                Add Seat Pay ${selectedSeats.reduce((sum: number, s: any) => sum + s.price, 0)}
                            </Button>
                            <div className="flex items-start gap-3 max-w-lg">
                                <Info size={16} className="text-[#FFD700] shrink-0 mt-0.5" />
                                <p className="text-[9px] font-bold text-gray-500 leading-relaxed uppercase tracking-wide italic">
                                    Kindly note there is no seat assigned to an infant. Hence, if you want to book a Bascinet then please send us a request through our offline request form.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
