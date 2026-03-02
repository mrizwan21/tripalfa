import React, { useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Check,
  Users,
  Eye,
  Plane,
} from "lucide-react";
import { Button } from "../ui/button";
import { formatCurrency } from "@tripalfa/ui-components";
import {
  Passenger,
  FlightSegmentInfo,
  SelectedSpecialService,
  SpecialServiceOption,
  DEFAULT_SSR_OPTIONS,
  getPassengerAvatar,
} from "../../lib/ancillary-types";

interface SpecialServicesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (services: SelectedSpecialService[]) => void;
  passengers: Passenger[];
  segments: FlightSegmentInfo[];
  availableServices?: SpecialServiceOption[];
  existingSelections?: SelectedSpecialService[];
}

// Icon mapping for SSR codes
const getSSRIcon = (code: string) => {
  switch (code.toUpperCase()) {
    case "WCHR":
    case "WCHS":
    case "WCHC":
      return User;
    case "BSCT":
    case "INFT":
      return User;
    case "BLND":
    case "DEAF":
      return Eye;
    case "UMNR":
      return Users;
    default:
      return User;
  }
};

export const SpecialServicesPopup = ({
  isOpen,
  onClose,
  onConfirm,
  passengers,
  segments,
  availableServices,
  existingSelections = [],
}: SpecialServicesPopupProps) => {
  const [selectedPassengerIdx, setSelectedPassengerIdx] = useState(0);
  const [selectedSegmentIdx, setSelectedSegmentIdx] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedServices, setSelectedServices] =
    useState<SelectedSpecialService[]>(existingSelections);
  const [notes, setNotes] = useState<Record<string, string>>({});

  // Use provided services or defaults
  const ssrOptions: SpecialServiceOption[] =
    availableServices && availableServices.length > 0
      ? availableServices
      : DEFAULT_SSR_OPTIONS;

  const currentPassenger = passengers[selectedPassengerIdx];
  const currentSegment = segments[selectedSegmentIdx];

  // Get services for current passenger/segment
  const currentServices = selectedServices.filter(
    (s) =>
      s.passengerId === currentPassenger?.id &&
      s.segmentId === currentSegment?.id,
  );

  const isServiceSelected = (serviceId: string) => {
    return currentServices.some((s) => s.serviceId === serviceId);
  };

  const handleServiceToggle = (service: SpecialServiceOption) => {
    if (!currentPassenger || !currentSegment) return;

    const key = `${currentPassenger.id}-${currentSegment.id}-${service.id}`;

    if (isServiceSelected(service.id)) {
      // Remove service
      setSelectedServices((prev) =>
        prev.filter(
          (s) =>
            !(
              s.passengerId === currentPassenger.id &&
              s.segmentId === currentSegment.id &&
              s.serviceId === service.id
            ),
        ),
      );
    } else {
      // Add service
      const newService: SelectedSpecialService = {
        passengerId: currentPassenger.id,
        passengerName:
          `${currentPassenger.firstName} ${currentPassenger.lastName}`.trim(),
        segmentId: currentSegment.id,
        flightNumber: currentSegment.flightNumber,
        serviceId: service.id,
        serviceCode: service.code,
        serviceName: service.name,
        price: service.price,
        currency: service.currency,
        notes: notes[key] || "",
      };
      setSelectedServices((prev) => [...prev, newService]);
    }
  };

  const handleNotesChange = (serviceId: string, value: string) => {
    if (!currentPassenger || !currentSegment) return;
    const key = `${currentPassenger.id}-${currentSegment.id}-${serviceId}`;
    setNotes((prev) => ({ ...prev, [key]: value }));

    // Update existing selection if any
    setSelectedServices((prev) =>
      prev.map((s) => {
        if (
          s.passengerId === currentPassenger.id &&
          s.segmentId === currentSegment.id &&
          s.serviceId === serviceId
        ) {
          return { ...s, notes: value };
        }
        return s;
      }),
    );
  };

  const totalAmount = selectedServices.reduce((sum, s) => sum + s.price, 0);

  if (!isOpen) return null;

  if (isConfirming) {
    return (
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 gap-2">
        <div
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
          onClick={() => setIsConfirming(false)}
        />
        <div className="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-12 flex flex-col items-center gap-8 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/20 relative gap-2">
            <User className="w-8 h-8 text-white" />
            <div className="absolute inset-0 bg-primary blur-2xl opacity-40 scale-150 animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-gray-900 text-center leading-relaxed text-2xl font-semibold tracking-tight">
            Confirm Special Services
          </h2>

          <div className="w-full space-y-3 max-h-48 overflow-y-auto">
            {selectedServices.map((service, i) => (
              <div key={i} className="bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-black text-gray-900">
                      {service.passengerName}
                    </p>
                    <p className="text-[8px] font-bold text-gray-400">
                      {service.flightNumber} - {service.serviceName}
                    </p>
                  </div>
                  <span className="text-sm font-black text-primary">
                    {service.price === 0
                      ? "Free"
                      : formatCurrency(service.price)}
                  </span>
                </div>
                {service.notes && (
                  <p className="text-[8px] text-gray-500 mt-2 italic">
                    "{service.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center w-full pt-4 border-t border-gray-100 gap-4">
            <span className="text-sm font-black text-gray-900">Total</span>
            <span className="text-xl font-black text-primary">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          <div className="flex gap-4 w-full">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsConfirming(false)}
              className="flex-1 h-12 rounded-xl border border-primary text-primary font-black text-xs uppercase tracking-widest transition-colors hover:bg-primary/10 gap-4"
            >
              Go Back
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => onConfirm(selectedServices)}
              className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 active:scale-95 gap-4"
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 gap-2">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div
        className="relative bg-white w-full max-w-5xl rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-500 border border-gray-100 flex flex-col max-h-[95vh]"
        data-testid="special-services-modal"
      >
        {/* Header */}
        <div className="p-8 text-center relative border-b border-gray-50">
          <h2 className="text-2xl font-black text-gray-900">
            Special Services
          </h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            Request special assistance for your journey
          </p>
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            className="absolute top-8 right-8 p-2 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 space-y-12">
          {/* Passenger Selection */}
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="outline"
              size="md"
              onClick={() =>
                setSelectedPassengerIdx((prev) => Math.max(0, prev - 1))
              }
              disabled={selectedPassengerIdx === 0}
              className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-primary hover:bg-primary/10 transition-all disabled:opacity-30 gap-2"
            >
              <ChevronLeft size={20} />
            </Button>
            <div className="flex gap-4 flex-wrap justify-center">
              {passengers.map((p, idx) => (
                <Button
                  variant="outline"
                  size="md"
                  key={p.id}
                  onClick={() => setSelectedPassengerIdx(idx)}
                  className={`px-6 h-14 rounded-[2rem] flex items-center gap-4 border transition-all ${
                    selectedPassengerIdx === idx
                      ? "bg-primary border-primary text-primary-foreground shadow-xl shadow-primary/20"
                      : "border-yellow-200 text-gray-400 bg-white"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 border-2 border-white">
                    <img
                      src={p.avatar || getPassengerAvatar(p.firstName)}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] font-black uppercase tracking-widest block">
                      {`${p.firstName} ${p.lastName}`.trim()}
                    </span>
                    <span className="text-[8px] font-bold text-gray-400 uppercase">
                      {p.type}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={() =>
                setSelectedPassengerIdx((prev) =>
                  Math.min(passengers.length - 1, prev + 1),
                )
              }
              disabled={selectedPassengerIdx === passengers.length - 1}
              className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-primary hover:bg-primary/10 transition-all disabled:opacity-30 gap-2"
            >
              <ChevronRight size={20} />
            </Button>
          </div>

          {/* Main Selection Area */}
          <div className="bg-gray-100/50 p-10 rounded-[3rem] space-y-8">
            {/* Flight Tabs */}
            <div className="flex justify-center gap-4">
              <div className="bg-white p-2 rounded-2xl flex gap-4 flex-wrap justify-center">
                {segments.map((seg, idx) => (
                  <Button
                    variant="outline"
                    size="md"
                    key={seg.id}
                    onClick={() => setSelectedSegmentIdx(idx)}
                    className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all ${
                      selectedSegmentIdx === idx
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "border border-primary text-primary"
                    }`}
                  >
                    {seg.origin}
                    <Plane
                      size={14}
                      className={`transform rotate-90 ${selectedSegmentIdx === idx ? "text-white/70" : ""}`}
                    />
                    {seg.destination}
                  </Button>
                ))}
              </div>
            </div>

            {/* Info Notice */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
              <p className="text-[10px] text-blue-700 font-medium">
                Special services are subject to availability and airline
                confirmation. Please request at least 48 hours before departure.
              </p>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ssrOptions.map((service) => {
                const Icon = getSSRIcon(service.code);
                const isSelected = isServiceSelected(service.id);
                const noteKey = `${currentPassenger?.id}-${currentSegment?.id}-${service.id}`;

                return (
                  <div
                    key={service.id}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-lg"
                        : "border-gray-100 bg-white hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => handleServiceToggle(service)}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-gray-100 text-gray-400 hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        {isSelected ? <Check size={20} /> : <Icon size={20} />}
                      </Button>

                      <div className="flex-1 gap-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-wide text-xl font-semibold tracking-tight">
                                {service.name}
                              </h3>
                              <span className="px-2 py-0.5 bg-gray-100 rounded text-[8px] font-mono font-bold text-gray-500">
                                {service.code}
                              </span>
                            </div>
                            {service.description && (
                              <p className="text-[9px] font-medium text-gray-400 mt-1">
                                {service.description}
                              </p>
                            )}
                          </div>
                          <span
                            className={`text-sm font-black ${service.price === 0 ? "text-green-600" : "text-primary"}`}
                          >
                            {service.price === 0
                              ? "Free"
                              : formatCurrency(service.price)}
                          </span>
                        </div>

                        {/* Notes input when selected */}
                        {isSelected && service.requiresNotes && (
                          <div className="mt-4">
                            <input
                              type="text"
                              placeholder="Additional notes (optional)"
                              value={notes[noteKey] || ""}
                              onChange={(e) =>
                                handleNotesChange(service.id, e.target.value)
                              }
                              className="w-full h-10 px-4 bg-white border border-gray-200 rounded-lg text-[10px] font-medium text-gray-700 placeholder:text-gray-400 outline-none focus:border-primary transition-colors"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Bar */}
            <div className="bg-white p-6 rounded-2xl border border-gray-50 flex items-center justify-between gap-2">
              <div>
                <span className="text-sm font-black text-gray-900 uppercase tracking-[2px]">
                  Total Services
                </span>
                <p className="text-[9px] font-bold text-gray-400 mt-1">
                  {selectedServices.length} service(s) selected
                </p>
              </div>
              <span className="text-xl font-black text-primary">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {/* All Selections Summary */}
          {selectedServices.length > 0 && (
            <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
              <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-4 text-xl font-semibold tracking-tight">
                All Service Requests
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedServices.map((service, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-3 border border-gray-100"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] font-black text-gray-700">
                          {service.passengerName}
                        </p>
                        <p className="text-[8px] font-bold text-gray-400">
                          {service.flightNumber} - {service.serviceName}
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-primary">
                        {service.price === 0
                          ? "Free"
                          : formatCurrency(service.price)}
                      </span>
                    </div>
                    {service.notes && (
                      <p className="text-[8px] text-gray-500 mt-1 italic truncate">
                        "{service.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer CTA */}
          <div className="flex justify-center pt-4 gap-4">
            <Button
              onClick={() =>
                selectedServices.length > 0 && setIsConfirming(true)
              }
              disabled={selectedServices.length === 0}
              className="w-full max-w-xl h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-[4px] shadow-2xl shadow-primary/20 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
            >
              Request Services{" "}
              {totalAmount > 0 && ` - ${formatCurrency(totalAmount)}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
