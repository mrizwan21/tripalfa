import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreHorizontal,
  Eye,
  CreditCard,
  XCircle,
  Edit,
  ChevronDown,
} from "lucide-react";

export function BookingActions({
  status,
  product,
  id,
}: {
  status: string;
  product: string;
  id?: string;
}) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { label: "View Details", icon: Eye, value: "View" },
    {
      label: "Pay Now",
      icon: CreditCard,
      value: "Pay",
      disabled: !status.includes("On hold"),
    },
    { label: "Cancel", icon: XCircle, value: "Cancel", danger: true },
    { label: "Amend", icon: Edit, value: "Amend" },
  ];

  const handleAction = (value: string) => {
    setIsOpen(false);
    if (!id) return;

    switch (value) {
      case "View":
        if (product === "hotel") {
          navigate(`/hotel-booking-card/${id}`);
        } else {
          navigate(`/booking-card/${id}`);
        }
        break;
      case "Pay":
        alert("Initiating payment flow...");
        break;
      case "Cancel":
        if (confirm("Are you sure you want to cancel this booking?")) {
          alert("Cancellation request sent.");
        }
        break;
      case "Amend":
        alert("Amendment module loading...");
        break;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 pl-3 pr-2 rounded-lg bg-gray-50 border border-gray-100 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:border-primary hover:text-primary transition-all"
      >
        Options
        <ChevronDown
          size={12}
          className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {actions.map((action) => (
              <button
                key={action.value}
                disabled={action.disabled}
                onClick={() => handleAction(action.value)}
                className={`w-full px-4 py-2.5 flex items-center gap-3 text-[11px] font-bold transition-colors
                  ${action.danger ? "text-rose-600 hover:bg-rose-50" : "text-gray-700 hover:bg-gray-50"}
                  ${action.disabled ? "opacity-30 grayscale cursor-not-allowed" : ""}
                `}
              >
                <action.icon size={14} />
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
