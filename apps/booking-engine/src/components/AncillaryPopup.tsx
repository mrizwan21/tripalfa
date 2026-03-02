import React, { useState } from "react";
import { X, Check, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { formatCurrency } from "@tripalfa/ui-components";

export interface Service {
  id: string;
  name: string;
  price: number;
  type: string;
}

export interface AncillaryPopupProps {
  isOpen: boolean;
  onClose: () => void;
  // Dynamic props
  services?: Service[];
  selectedServices?: string[];
  onToggleService?: (serviceId: string) => void;
  onConfirm?: () => void;
  title?: string;
}

export const AncillaryPopup = ({
  isOpen,
  onClose,
  services = [
    { id: "1", name: "Extra Legroom Seat", price: 45, type: "Seat" },
    { id: "2", name: "Priority Boarding", price: 20, type: "Boarding" },
    { id: "3", name: "Lounge Access", price: 60, type: "Lounge" },
    { id: "4", name: "Fast Track Security", price: 15, type: "Airport" },
  ],
  selectedServices = [],
  onToggleService,
  onConfirm,
  title = "Customize Your Experience",
}: AncillaryPopupProps) => {
  if (!isOpen) return null;

  // Use internal state if no callback provided (fallback for preview/mock mode)
  const [localSelection, setLocalSelection] = useState<string[]>([]);
  const isControlled = !!onToggleService;
  const activeSelection = isControlled ? selectedServices : localSelection;

  const handleToggle = (id: string) => {
    if (isControlled && onToggleService) {
      onToggleService(id);
    } else {
      setLocalSelection((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    }
  };

  const totalAmount = services
    .filter((s) => activeSelection.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 gap-2">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/60 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-card w-full max-w-6xl rounded-[3rem] shadow-[0_48px_150px_-20px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95 fade-in duration-500 border border-border/40 flex flex-col max-h-[90vh]">
        {/* Header Section */}
        <div className="px-10 py-8 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="md"
              onClick={onClose}
              className="p-3 rounded-full hover:bg-muted transition-colors border border-transparent hover:border-border"
            >
              <X size={20} className="text-foreground" />
            </Button>
            <h2 className="text-sm font-black text-foreground uppercase tracking-widest text-2xl font-semibold tracking-tight">
              {title}
            </h2>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-10 pb-10 custom-scrollbar gap-4">
          {/* Banner */}
          <div className="mb-8 p-1 rounded-3xl bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="bg-card/60 p-8 rounded-[22px] flex items-center justify-between backdrop-blur-sm gap-2">
              <div>
                <h3 className="text-xl font-black text-foreground tracking-tight">
                  Enhance Your Journey
                </h3>
                <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-wide">
                  Select additional services for your flight
                </p>
              </div>
              <div className="px-5 py-2.5 bg-card rounded-xl shadow-sm border border-border">
                <span className="text-[10px] font-black text-[hsl(var(--primary))] uppercase tracking-widest">
                  Premium Offers
                </span>
              </div>
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {services.map((service) => {
              const isSelected = activeSelection.includes(service.id);
              return (
                <div
                  key={service.id}
                  onClick={() => handleToggle(service.id)}
                  className={`p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all duration-300 flex items-center justify-between group ${
                    isSelected
                      ? "border-[hsl(var(--primary))] bg-purple-50/50 shadow-xl shadow-purple-100"
                      : "border-border/40 hover:border-border bg-card hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isSelected ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-lg shadow-purple-200" : "bg-muted text-border group-hover:text-muted-foreground"}`}
                    >
                      {isSelected ? (
                        <Check size={24} className="stroke-[3px]" />
                      ) : (
                        <Plus size={24} />
                      )}
                    </div>
                    <div>
                      <h4
                        className={`text-base font-black transition-colors ${isSelected ? "text-[hsl(var(--primary))]" : "text-foreground"}`}
                      >
                        {service.name}
                      </h4>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        {service.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-foreground">
                      {formatCurrency(service.price)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Selection Summary */}
        <div className="p-10 border-t border-border bg-muted/80 backdrop-blur-xl shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Total Add-ons
              </p>
              <p className="text-4xl font-black text-foreground tracking-tighter">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <Button
              data-testid="confirm-ancillaries"
              onClick={onConfirm || onClose}
              className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] text-[hsl(var(--primary-foreground))] px-12 py-6 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-border transition-all hover:-translate-y-1 active:scale-95"
            >
              Confirm Selection
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
