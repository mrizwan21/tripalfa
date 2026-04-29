import React from 'react';
import { Plane, Clock, Info } from 'lucide-react';
import { cn } from '../../index';

interface FlightResultsStepProps {
  results: any[];
  currency: string;
  showNett?: boolean;
  selectedFlight?: string;
  onSelect: (flight: any) => void;
}

export default function FlightResultsStep({ results, currency, showNett = false, selectedFlight, onSelect }: FlightResultsStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[20px] font-display font-bold text-pure-black">Available Flights</h3>
        <div className="px-4 py-1.5 bg-light-gray rounded-full text-[12px] font-text font-medium text-black/50">
          {results.length} results found
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {results.map((flight) => (
          <div 
            key={flight.id}
            className={cn(
              "bg-white rounded-2xl p-6 border transition-all cursor-pointer group",
              selectedFlight === flight.id ? "border-apple-blue ring-4 ring-apple-blue/5 shadow-md" : "border-black/5 hover:border-black/10 hover:shadow-sm"
            )}
            onClick={() => onSelect(flight)}
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-8">
              <div className="flex items-center gap-4 w-48">
                <div className="w-12 h-12 bg-light-gray rounded-xl flex items-center justify-center shrink-0">
                  <Plane size={24} className="text-black/20" />
                </div>
                <div>
                  <p className="text-[14px] font-text font-bold text-pure-black">{flight.airline}</p>
                  <p className="text-[12px] font-text text-black/40">{flight.flightNumber}</p>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center gap-12">
                <div className="text-center">
                  <p className="text-[20px] font-display font-bold text-pure-black">{flight.departure.time}</p>
                  <p className="text-[13px] font-text text-black/40 font-bold">{flight.departure.airportCode}</p>
                </div>
                <div className="flex-1 max-w-[200px] flex flex-col items-center gap-1">
                  <p className="text-[11px] font-text text-black/30 font-medium uppercase tracking-widest">{flight.duration}</p>
                  <div className="w-full h-[2px] bg-light-gray relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-light-gray rounded-full border-2 border-white" />
                  </div>
                  <p className="text-[11px] font-text text-black/40 font-medium">{flight.stops === 0 ? 'Non-stop' : `${flight.stops} Stop(s)`}</p>
                </div>
                <div className="text-center">
                  <p className="text-[20px] font-display font-bold text-pure-black">{flight.arrival.time}</p>
                  <p className="text-[13px] font-text text-black/40 font-bold">{flight.arrival.airportCode}</p>
                </div>
              </div>

              <div className="flex flex-row lg:flex-col items-end justify-between lg:justify-center gap-2 lg:pl-12 lg:border-l border-black/5">
                <div className="text-right">
                  <p className="text-[24px] font-display font-bold text-pure-black leading-none">{currency} {flight.price.total}</p>
                  {showNett && (
                    <p className="text-[12px] font-text text-green-600 font-bold mt-1">Nett: {currency} {flight.price.breakdown.base}</p>
                  )}
                </div>
                <button className={cn(
                  "px-6 py-2.5 rounded-xl text-[13px] font-text font-bold transition-all",
                  selectedFlight === flight.id ? "bg-apple-blue text-white" : "bg-light-gray text-pure-black hover:bg-black/5"
                )}>
                  Select
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
