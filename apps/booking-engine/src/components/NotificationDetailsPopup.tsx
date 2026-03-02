import React, { useEffect, useRef } from "react";
import {
  X,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Info,
  Calendar,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { NotificationItem } from "../lib/notification-types";
import { cn } from "@tripalfa/ui-components";
import { Button } from "@/components/ui/button";

interface NotificationDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  notification: NotificationItem | null;
}

export function NotificationDetailsPopup({
  isOpen,
  onClose,
  notification,
}: NotificationDetailsPopupProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle ESC key to close popup
  useEffect(() => {
    if (!isOpen) return;

    // Set focus to dialog container for keyboard accessibility
    if (dialogRef.current) {
      dialogRef.current.focus();
    }

    // Handle ESC key press
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.code === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    // Add event listener when popup is open
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup event listener on unmount or when popup closes
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !notification) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <CheckCircle2 size={24} className="text-emerald-600" />;
      case "PENDING":
        return <Clock size={24} className="text-amber-600" />;
      case "REJECTED":
        return <XCircle size={24} className="text-rose-600" />;
      default:
        return <Info size={24} className="text-primary" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 gap-2"
      data-testid="notification-popup"
    >
      <div
        className="absolute inset-0 bg-foreground/60 backdrop-blur-xl animate-in fade-in duration-500"
        onClick={onClose}
        data-testid="popup-overlay"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="relative bg-card w-full max-w-lg rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95 duration-500 border border-border/20 outline-none"
        data-testid="popup-content"
      >
        {/* Header */}
        <div className="p-8 border-b border-border/50 flex justify-between items-center bg-muted/50 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-card shadow-sm border border-border/50 transition-transform hover:rotate-12 gap-2">
              {getStatusIcon(notification.status)}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                Details View
              </p>
              <h2 className="text-xl font-black text-foreground leading-tight text-2xl font-semibold tracking-tight">
                {notification.title}
              </h2>
            </div>
          </div>
          <Button
            variant="outline"
            size="default"
            onClick={onClose}
            className="p-2.5 hover:bg-muted rounded-full transition-all text-muted-foreground hover:text-foreground active:scale-90"
            data-testid="popup-close-button"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="p-8 space-y-8">
          {/* Status Banner */}
          <div
            className={cn(
              "p-6 rounded-[1.5rem] border flex items-start gap-4 transition-all hover:translate-y-[-2px]",
              notification.status === "CONFIRMED"
                ? "bg-emerald-50 border-emerald-100/50 text-emerald-900"
                : notification.status === "PENDING"
                  ? "bg-amber-50 border-amber-100/50 text-amber-900"
                  : notification.status === "REJECTED"
                    ? "bg-rose-50 border-rose-100/50 text-rose-900"
                    : "bg-primary/5 border-primary/10 text-primary-900",
            )}
            data-testid="status-banner"
          >
            <div className="mt-1">
              <Shield size={20} className="shrink-0" />
            </div>
            <div>
              <p
                className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60"
                data-testid="notification-status"
              >
                Status:{" "}
                <span data-testid="status-value">{notification.status}</span>
              </p>
              <p className="text-sm font-bold leading-relaxed">
                {notification.status === "REJECTED"
                  ? notification.remarks ||
                    "This request was rejected by the supplier. Please verify details and try again."
                  : notification.description}
              </p>
            </div>
          </div>

          {/* Request Details Grid */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3 text-xl font-semibold tracking-tight">
              Information
              <span className="flex-1 h-px bg-border/50 gap-4" />
            </h3>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Calendar size={10} /> Date
                </p>
                <p className="text-foreground font-black text-sm">
                  {format(new Date(notification.when), "MMM d, yyyy h:mm a")}
                </p>
              </div>

              {notification.passengerName && (
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                    Passenger
                  </p>
                  <p className="text-foreground font-black text-sm">
                    {notification.passengerName}
                  </p>
                </div>
              )}

              {notification.segment && (
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                    Product
                  </p>
                  <p className="text-foreground font-black text-sm">
                    {notification.segment}
                  </p>
                </div>
              )}

              {notification.price !== undefined && notification.price > 0 && (
                <div data-testid="price-section">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                    Total Amount
                  </p>
                  <p
                    className="text-primary font-black text-sm"
                    data-testid="price-value"
                  >
                    {notification.currency} {notification.price}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Simple Timeline */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3 text-xl font-semibold tracking-tight">
              Activity
              <span className="flex-1 h-px bg-border/50 gap-4" />
            </h3>
            <div className="space-y-6 pl-4 border-l-2 border-border/50 ml-1">
              <div className="relative">
                <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-muted border-2 border-card ring-4 ring-muted/50"></div>
                <p className="text-xs font-black text-foreground">
                  Request Initiated
                </p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight mt-0.5">
                  {notification.when}
                </p>
              </div>
              {notification.status !== "PENDING" && (
                <div className="relative">
                  <div
                    className={cn(
                      "absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border-2 border-white ring-4 ring-white shadow-sm",
                      notification.status === "REJECTED"
                        ? "bg-rose-500"
                        : "bg-emerald-500",
                    )}
                  ></div>
                  <p className="text-xs font-black text-foreground">
                    Current Status: {notification.status}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight mt-0.5">
                    Supplier Processed • Just now
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-muted/50 border-t border-border/50 flex flex-col sm:flex-row gap-4">
          <Button
            variant="default"
            size="default"
            className="flex-1 h-12 rounded-2xl bg-card border border-border text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-muted/50 hover:border-border/80 transition-all shadow-sm active:scale-95 gap-4"
          >
            Download Receipt
          </Button>
          <Button
            variant="default"
            size="default"
            className="flex-1 h-12 rounded-2xl bg-primary text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95 gap-4"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}
