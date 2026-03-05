import React, { useState } from "react";
import { X, Upload, Calendar, User, Plane, Check } from "lucide-react";

import { NotificationItem } from "../lib/notification-types";
import { Button } from "@tripalfa/ui-components";
import { Label } from "@/components/ui/label";

interface BookingAmendmentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  passengers?: any[];
  productType?: "flight" | "hotel";
  prefillData?: NotificationItem | null;
}

type AmendmentType =
  | "cancel_refund"
  | "re_issue"
  | "wheel_chair"
  | "seat_request"
  | "add_baggage"
  | "add_meals"
  | "special_request";

export function BookingAmendmentPopup({
  isOpen,
  onClose,
  bookingId,
  passengers = [],
  productType = "flight",
  prefillData,
}: BookingAmendmentPopupProps) {
  if (!isOpen) return null;

  const [activeType, setActiveType] = useState<AmendmentType>("cancel_refund");
  const [selectedPassengers, setSelectedPassengers] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  React.useEffect(() => {
    if (isOpen && prefillData) {
      // Map notification type to amendment type
      if (
        prefillData.title.includes("Date Change") ||
        prefillData.title.includes("Re-Issue")
      ) {
        setActiveType("re_issue");
      } else if (prefillData.title.includes("Meal")) {
        setActiveType("add_meals");
      } else if (prefillData.title.includes("Seat")) {
        setActiveType("seat_request");
      } else if (prefillData.title.includes("Baggage")) {
        setActiveType("add_baggage");
      } else if (prefillData.title.includes("Wheelchair")) {
        setActiveType("wheel_chair");
      } else if (
        prefillData.title.includes("Refund") ||
        prefillData.title.includes("Cancel")
      ) {
        setActiveType("cancel_refund");
      } else {
        setActiveType("special_request");
      }
    }
  }, [isOpen, prefillData]);

  const togglePassenger = (id: string) => {
    if (selectedPassengers.includes(id)) {
      setSelectedPassengers(selectedPassengers.filter((p) => p !== id));
    } else {
      setSelectedPassengers([...selectedPassengers, id]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const menuItems: { id: AmendmentType; label: string }[] = [
    { id: "cancel_refund", label: "Cancel & Refund" },
    {
      id: "re_issue",
      label: productType === "hotel" ? "Change Dates" : "Re-Issue",
    },
    { id: "wheel_chair", label: "Wheel Chair" },
    { id: "seat_request", label: "Seat Request" },
    { id: "add_baggage", label: "Add Baggage" },
    { id: "add_meals", label: "Add Meals" },
    { id: "special_request", label: "Special Request" },
  ];

  // Mock passenger data if not provided (keeping existing logic)
  const displayPassengers =
    passengers.length > 0
      ? passengers
      : [
          { id: "p1", firstName: "Mohamed", lastName: "Rizwan", type: "ADT" },
          { id: "p2", firstName: "Samia", lastName: "Khan", type: "ADT" },
        ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 gap-2">
      <div
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="relative bg-card w-full max-w-6xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex max-h-[90vh]">
        {/* Left Sidebar Menu */}
        <div className="w-64 bg-muted/50 border-r border-border p-6 flex-shrink-0 gap-4">
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-6 px-2 text-xl font-semibold tracking-tight">
            Actions
          </h3>
          <div className="space-y-2">
            {menuItems.map((item) => (
              <Button
                variant="outline"
                size="default"
                key={item.id}
                onClick={() => setActiveType(item.id)}
                className={`w-full text-left px-5 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${
                  activeType === item.id
                    ? "bg-card text-[hsl(var(--primary))] shadow-md translate-x-2 border border-border"
                    : "text-muted-foreground hover:bg-card hover:text-foreground hover:shadow-sm"
                }`}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-card gap-4">
          {/* Header */}
          <div className="h-20 border-b border-border flex items-center justify-between px-8 bg-card/80 backdrop-blur-md sticky top-0 z-10 gap-2">
            <div>
              <h2 className="text-lg font-black text-[hsl(var(--primary))] text-2xl font-semibold tracking-tight">
                Booking Request Card
              </h2>
              <p className="text-[10px] font-bold text-muted-foreground mt-1">
                Ref: {bookingId}{" "}
                <span className="ml-2 px-2 py-0.5 bg-muted/50 rounded text-muted-foreground uppercase">
                  {productType}
                </span>
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors gap-2"
            >
              <X size={16} />
            </Button>
          </div>

          <div className="p-8 overflow-y-auto space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-[hsl(var(--primary))] uppercase tracking-widest flex items-center gap-2 text-xl font-semibold tracking-tight">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))]" />
                Select Passengers
              </h3>

              {displayPassengers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No passengers available for this booking.
                </div>
              ) : (
                <div className="grid gap-3">
                  {displayPassengers.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => togglePassenger(p.id)}
                      className={`relative group cursor-pointer border rounded-2xl p-4 transition-all duration-200 ${
                        selectedPassengers.includes(p.id)
                          ? "border-[hsl(var(--primary))] bg-purple-50/30"
                          : "border-border hover:border-border/80 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            selectedPassengers.includes(p.id)
                              ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                              : "bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          <User size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-[hsl(var(--primary))]">
                            {p.firstName} {p.lastName}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {p.type === "ADT" ? "Adult" : p.type}
                          </p>
                        </div>
                      </div>
                      {selectedPassengers.includes(p.id) && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[hsl(var(--primary))] text-white flex items-center justify-center">
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dynamic Fields Based on Selection */}
            <div className="space-y-6 pt-4 border-t border-dashed border-border">
              {activeType === "re_issue" && (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                  <h3 className="text-xs font-black text-[hsl(var(--primary))] uppercase tracking-widest flex items-center gap-2 text-xl font-semibold tracking-tight">
                    <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))]" />
                    {productType === "hotel"
                      ? "New Date Details"
                      : "New Flight Details"}
                  </h3>
                  <div className="bg-muted/50 rounded-2xl p-6 border border-border space-y-6">
                    {productType === "flight" ? (
                      /* Flight specific fields */
                      <>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-sm font-medium">
                              New Date
                            </Label>
                            <div className="relative">
                              <input
                                id="amendment-departure-date"
                                name="amendment-departure-date"
                                type="date"
                                className="w-full h-12 rounded-xl border border-border pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-[hsl(var(--primary))] transition-colors"
                              />
                              <Calendar
                                size={16}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-sm font-medium">
                              Preferred Class
                            </Label>
                            <select
                              id="amendment-preferred-class"
                              name="amendment-preferred-class"
                              className="w-full h-12 rounded-xl border border-border px-4 text-sm font-medium focus:outline-none focus:border-[hsl(var(--primary))] bg-card transition-colors"
                            >
                              <option value="economy">Economy</option>
                              <option value="business">Business</option>
                              <option value="first-class">First Class</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-sm font-medium">
                            Route (Optional)
                          </Label>
                          <div className="relative">
                            <input
                              id="amendment-route"
                              name="amendment-route"
                              type="text"
                              placeholder="e.g. DXB - LHR"
                              className="w-full h-12 rounded-xl border border-border pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-[hsl(var(--primary))] transition-colors"
                            />
                            <Plane
                              size={16}
                              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Hotel specific fields */
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-sm font-medium">
                            Check-in Date
                          </Label>
                          <div className="relative">
                            <input
                              id="amendment-new-departure"
                              name="amendment-new-departure"
                              type="date"
                              className="w-full h-12 rounded-xl border border-border pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-[hsl(var(--primary))] transition-colors"
                            />
                            <Calendar
                              size={16}
                              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-sm font-medium">
                            Check-out Date
                          </Label>
                          <div className="relative">
                            <input
                              id="amendment-new-return"
                              name="amendment-new-return"
                              type="date"
                              className="w-full h-12 rounded-xl border border-border pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-[hsl(var(--primary))] transition-colors"
                            />
                            <Calendar
                              size={16}
                              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(activeType === "add_baggage" ||
                activeType === "add_meals" ||
                activeType === "seat_request" ||
                activeType === "special_request") && (
                <div className="space-y-2 animate-in slide-in-from-right-4 duration-300">
                  <h3 className="text-xs font-black text-[hsl(var(--primary))] uppercase tracking-widest flex items-center gap-2 text-xl font-semibold tracking-tight">
                    <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))]" />
                    {menuItems.find((i) => i.id === activeType)?.label} Details
                  </h3>
                  <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-yellow-700 text-xs font-medium">
                    Please specify your exact requirements below. Our team will
                    verify availability and confirm the additional costs.
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-black text-[hsl(var(--primary))] uppercase tracking-widest flex items-center gap-2 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))]" />
                  Message / Instructions
                </Label>
                <textarea
                  id="amendment-message"
                  name="amendment-message"
                  className="w-full h-32 rounded-2xl border border-border p-4 text-sm font-medium focus:outline-none focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-purple-50 transition-all resize-none"
                  placeholder="Please describe your request in detail..."
                ></textarea>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-[hsl(var(--primary))] uppercase tracking-widest flex items-center gap-2 text-xl font-semibold tracking-tight">
                  <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))]" />
                  Attachments (Optional)
                </h3>
                <div className="mt-2 text-xs text-muted-foreground mb-2">
                  Upload relevant documents like medical reports or passport
                  copies.
                </div>

                <div className="flex gap-4 items-center">
                  <Label className="flex items-center gap-2 px-6 py-3 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-[hsl(var(--primary)/0.9)] transition-all shadow-lg shadow-purple-100 active:scale-95 text-sm font-medium">
                    <Upload size={14} />
                    Choose Files
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </Label>
                  <div className="flex-1 h-12 rounded-xl border border-border bg-muted/50 flex items-center px-4 text-xs font-medium text-muted-foreground gap-2">
                    {files.length > 0 ? (
                      <span className="text-foreground">
                        {files.length} file(s) selected
                      </span>
                    ) : (
                      "No file chosen"
                    )}
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {files.map((f, i) => (
                      <div
                        key={i}
                        className="px-3 py-1 bg-card border border-border rounded-lg text-[10px] font-bold text-muted-foreground flex items-center gap-2"
                      >
                        {f.name}
                        <Button
                          variant="outline"
                          size="default"
                          onClick={() =>
                            setFiles(files.filter((_, idx) => idx !== i))
                          }
                          className="hover:text-red-500"
                        >
                          <X size={10} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="h-24 border-t border-border flex items-center justify-center bg-muted/50 backdrop-blur-sm px-8 gap-4">
            <Button
              variant="default"
              size="default"
              onClick={onClose}
              className="h-12 w-32 border border-border text-muted-foreground rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-card hover:border-border/80 transition-all"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              size="default"
              className="h-12 w-48 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-purple-200 hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 active:translate-y-0"
            >
              Submit Request
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
