import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import {
  X,
  Plane,
  Clock,
  Shield,
  Briefcase,
  Info,
  ChevronRight,
  Check,
  Luggage,
} from "lucide-react";
import { Button } from "./ui/button";
import { Flight } from "../lib/srs-types";
import { fetchAircrafts } from "../lib/api";

interface FlightDetailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: () => void;
  flight: Flight;
}

export const FlightDetailPopup = ({
  isOpen,
  onClose,
  onSelect,
  flight,
}: FlightDetailPopupProps): React.JSX.Element | null => {
  const [activeTab, setActiveTab] = useState("itinerary");
  const [aircraftNames, setAircraftNames] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    if (isOpen) {
      fetchAircrafts().then((data) => {
        if (Array.isArray(data)) {
          const nameMap: Record<string, string> = {};
          data.forEach((a: any) => {
            if (a.code) nameMap[a.code] = a.name;
          });
          setAircraftNames(nameMap);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Determine tabs based on available data
  const tabs = [
    { id: "itinerary", label: "Itinerary" },
    { id: "fare", label: "Fare Details" },
    { id: "rules", label: "Fare Rules" },
    { id: "baggage", label: "Baggage" },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 gap-2"
      data-testid="flight-detail-modal"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card w-full max-w-3xl max-h-[90vh] rounded-[2rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-300 border border-border/20">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all z-20 gap-2"
        >
          <X size={16} />
        </button>

        {/* Header Tabs */}
        <div className="px-8 pt-8 pb-4 border-b border-border flex-shrink-0 gap-4">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 translate-y-[-2px]"
                    : "bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="px-10 py-8 overflow-y-auto flex-1 custom-scrollbar gap-4">
          {/* Tab: Itinerary */}
          {activeTab === "itinerary" && (
            <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
              {/* Segments Loop */}
              {flight.segments?.map((segment, index) => {
                const depDate = segment.departureTime
                  ? parseISO(segment.departureTime)
                  : null;
                const arrDate = segment.arrivalTime
                  ? parseISO(segment.arrivalTime)
                  : null;
                const isLayover = index < (flight.segments?.length || 0) - 1;

                // Lookup aircraft name from code or static DB
                const aircraftName =
                  aircraftNames[segment.aircraft || ""] ||
                  segment.aircraft ||
                  "--";

                return (
                  <div key={index} className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-black text-foreground">
                        {depDate ? format(depDate, "EEE, d MMM") : "--"}
                      </h3>
                    </div>

                    <div className="bg-muted/50 rounded-[2rem] p-8 border border-border relative">
                      <div className="grid grid-cols-[1.5fr_1fr_1.5fr] gap-8">
                        {/* Departure Side */}
                        <div className="space-y-8">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                flight.airlineLogo ||
                                `https://logo.clearbit.com/${flight.airline.toLowerCase().replace(/\s/g, "")}.com`
                              }
                              className="h-10 w-10 object-contain rounded-lg bg-card p-1 shadow-sm"
                              alt="airline"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://cdn-icons-png.flaticon.com/512/723/723955.png";
                              }}
                            />
                            <div>
                              <p className="text-[11px] font-black text-foreground">
                                {flight.airline}
                              </p>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                {segment.carrierCode}
                                {flight.flightNumber}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <p className="text-2xl font-black text-foreground tracking-tighter">
                              {depDate ? format(depDate, "HH:mm") : "--:--"}
                            </p>
                            <div>
                              <p className="text-[10px] font-black text-foreground uppercase">
                                {segment.origin}
                              </p>
                              <p className="text-[9px] font-bold text-muted-foreground">
                                {segment.originCity || ""}
                              </p>
                              {segment.departureTerminal && (
                                <p className="text-[8px] font-black text-primary mt-1">
                                  TERMINAL {segment.departureTerminal}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Visual Timeline Centered */}
                        <div className="flex flex-col items-center justify-center gap-4">
                          <div className="w-full relative h-[140px] flex items-center gap-2">
                            <div className="absolute left-1/2 -translate-x-1/2 w-[1.5px] h-full bg-gradient-to-b from-primary via-destructive to-primary rounded-full opacity-20"></div>
                            <div className="flex flex-col justify-between h-full w-full items-center relative py-2">
                              <div className="w-3 h-3 rounded-full bg-card border-[3px] border-primary shadow-sm"></div>
                              <div className="bg-card px-4 py-1.5 rounded-full border border-indigo-100 shadow-lg text-[10px] font-black text-primary whitespace-nowrap">
                                {segment.duration || "--"}
                              </div>
                              <div className="w-3 h-3 rounded-full bg-card border-[3px] border-primary shadow-sm"></div>
                            </div>
                          </div>
                          <p className="text-[9px] font-black text-muted-foreground uppercase mt-4 tracking-[1.5px]">
                            {flight.cabin || "Economy"} Class
                          </p>
                        </div>

                        {/* Arrival Side */}
                        <div className="flex flex-col justify-between text-right">
                          <div>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">
                              Aircraft
                            </p>
                            <p className="text-[10px] font-black text-foreground uppercase truncate">
                              {aircraftName}
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-2xl font-black text-foreground tracking-tighter">
                              {arrDate ? format(arrDate, "HH:mm") : "--:--"}
                            </p>
                            <div>
                              <p className="text-[10px] font-black text-foreground uppercase">
                                {segment.destination}
                              </p>
                              <p className="text-[9px] font-bold text-muted-foreground">
                                {segment.destinationCity || ""}
                              </p>
                              {segment.arrivalTerminal && (
                                <p className="text-[8px] font-black text-primary mt-1">
                                  TERMINAL {segment.arrivalTerminal}
                                </p>
                              )}
                            </div>
                          </div>
                          <div>
                            <p
                              className={`text-[9px] font-black uppercase tracking-widest ${flight.refundable ? "text-green-500" : "text-destructive"}`}
                            >
                              {flight.refundable
                                ? "Refundable"
                                : "Non-Refundable"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isLayover && (
                      <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-2xl border border-dashed border-border gap-4">
                        <div className="flex items-center gap-3">
                          <Clock size={12} className="text-muted-foreground" />
                          <span className="text-[10px] font-black text-foreground uppercase tracking-[1.5px]">
                            Stopover in{" "}
                            {segment.destinationCity || segment.destination}
                          </span>
                        </div>
                        {segment.layoverDuration && (
                          <p className="text-[11px] font-black text-primary mt-1 uppercase">
                            ({segment.layoverDuration})
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab: Fare Details */}
          {activeTab === "fare" && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 flex flex-col items-center py-6 gap-4">
              <div className="w-full max-w-md bg-muted/50 rounded-[2rem] border border-border p-8 shadow-sm">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[3px] mb-8 text-center">
                  Fare Breakdown
                </h4>
                <div className="space-y-6">
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                      Base Fare
                    </span>
                    <span className="text-md font-black text-foreground">
                      {(flight.amount * 0.85).toFixed(2)} {flight.currency}
                    </span>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-dashed border-border">
                    <h5 className="text-[9px] font-black text-muted-foreground uppercase tracking-[2px]">
                      Taxes & Fees Breakup
                    </h5>
                    {[
                      { label: "Fuel Surcharge", factor: 0.08 },
                      { label: "Passenger Service Fee", factor: 0.04 },
                      { label: "Airport Tax", factor: 0.03 },
                    ].map((tax, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center gap-4"
                      >
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {tax.label}
                        </span>
                        <span className="text-[10px] font-black text-foreground">
                          {(flight.amount * tax.factor).toFixed(2)}{" "}
                          {flight.currency}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 mt-6 border-t-[2px] border-dashed border-border flex justify-between items-center gap-4">
                    <span className="text-md font-black text-foreground uppercase tracking-[1px]">
                      Total Amount
                    </span>
                    <span className="text-2xl font-black text-primary">
                      {flight.amount} {flight.currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Fare Rules */}
          {activeTab === "rules" && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="p-10 bg-muted/50 rounded-[2.5rem] border border-border">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-card flex items-center justify-center text-primary shadow-sm gap-2">
                    <Shield size={24} />
                  </div>
                  <h4 className="text-xl font-black text-foreground">
                    Fare Policy
                  </h4>
                </div>
                <div className="space-y-6">
                  <div className="p-6 bg-card rounded-2xl border border-border">
                    <p className="text-sm font-black text-foreground uppercase tracking-widest mb-2">
                      Refund Policy
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                      {flight.refundable
                        ? "This fare is fully refundable before departure. Cancellation fees may apply depending on the time of request."
                        : "This is a non-refundable fare. Changes and cancellations will not be eligible for a refund."}
                    </p>
                  </div>
                  <div className="p-6 bg-card rounded-2xl border border-border">
                    <p className="text-sm font-black text-foreground uppercase tracking-widest mb-2">
                      Change Policy
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                      Date changes are permitted with a fee plus any fare
                      difference. Contact our support team at least 24 hours
                      before departure.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Baggage */}
          {activeTab === "baggage" && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 gap-8">
                <div className="p-12 rounded-[2.5rem] border border-border bg-muted/50 shadow-sm">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-card flex items-center justify-center text-primary shadow-sm gap-2">
                      <Luggage size={24} />
                    </div>
                    <h5 className="text-xl font-black text-foreground">
                      Baggage Allowance
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {flight.includedBags &&
                      flight.includedBags.map((bag, i) => (
                        <div
                          key={i}
                          className="bg-card p-8 rounded-3xl border border-border flex items-center gap-6 shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 animate-pulse gap-2">
                            <Luggage size={32} />
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[2px]">
                              {bag.type === "checked" ? "Checked" : "Hand"}{" "}
                              Baggage
                            </p>
                            <p className="text-2xl font-black text-foreground mt-1">
                              {bag.quantity} x{" "}
                              {bag.weight || (bag.type === "checked" ? 23 : 7)}{" "}
                              {bag.unit || "kg"}
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">
                              Per Passenger
                            </p>
                          </div>
                        </div>
                      ))}
                    {!flight.includedBags?.length && (
                      <div className="col-span-2 text-center py-10 bg-card rounded-3xl border border-dashed border-border">
                        <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">
                          No baggage information available.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-8 py-6 bg-card border-t border-border flex items-center justify-between flex-shrink-0 gap-2">
          <div data-testid="flight-price">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[3px] mb-1">
              Total Payable
            </p>
            <p className="text-2xl font-black text-foreground font-sans tracking-tighter">
              {flight.currency} {flight.amount.toLocaleString()}
            </p>
          </div>
          <Button
            data-testid="book-now-button"
            onClick={onSelect}
            className="px-12 py-5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-[3px] shadow-2xl shadow-primary/20 transition-all hover:translate-y-[-4px] active:scale-95"
          >
            Confirm Booking
          </Button>
        </div>
      </div>
    </div>
  );
};
