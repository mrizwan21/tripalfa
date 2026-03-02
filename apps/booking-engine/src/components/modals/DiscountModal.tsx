import React, { useState } from "react";
import { Tag } from "lucide-react";
import { cn } from "@tripalfa/ui-components";
import { Modal } from "../ui/Modal";

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  bookingId: string;
  currency: string;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  bookingId,
  currency,
}) => {
  const [value, setValue] = useState<string>("");
  const [type, setType] = useState<"fixed" | "percentage">("fixed");
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      value: parseFloat(value),
      type,
      currency: type === "fixed" ? currency : undefined,
      reason,
      actionType: "discount",
    });
    onClose();
  };

  const title = (
    <div className="flex items-center gap-2">
      <Tag className="w-5 h-5 text-[var(--color-primary)]" />
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
        Apply Discount
      </h3>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Discount Type
          </label>
          <div className="flex rounded-md shadow-sm gap-4" role="group">
            <button
              type="button"
              onClick={() => setType("fixed")}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium rounded-l-lg border",
                type === "fixed"
                  ? "bg-[var(--color-bg-secondary)] text-[var(--color-primary)] border-[var(--color-primary)] z-10"
                  : "bg-white text-[var(--color-text-secondary)] border-[var(--color-border-light)] hover:bg-gray-50",
              )}
            >
              Fixed Amount ({currency})
            </button>
            <button
              type="button"
              onClick={() => setType("percentage")}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium rounded-r-lg border-t border-b border-r",
                type === "percentage"
                  ? "bg-[var(--color-bg-secondary)] text-[var(--color-primary)] border-[var(--color-primary)] border-l z-10"
                  : "bg-white text-[var(--color-text-secondary)] border-[var(--color-border-light)] hover:bg-gray-50",
              )}
            >
              Percentage (%)
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            {type === "fixed" ? "Discount Amount" : "Discount Percentage"}
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 pl-9 rounded-md border border-[var(--color-border-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder="0.00"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none gap-2">
              {type === "fixed" ? (
                <span className="text-[var(--color-text-tertiary)] text-sm">
                  {currency}
                </span>
              ) : (
                <Tag className="h-4 w-4 text-[var(--color-text-tertiary)]" />
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Reason / Coupon Code
          </label>
          <input
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-[var(--color-border-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            placeholder="e.g. CORP_DISCOUNT"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-[var(--color-primary)] hover:brightness-90 text-white font-medium rounded-lg transition-all shadow-sm active:scale-[0.98]"
          >
            Apply Discount
          </button>
        </div>
      </form>
    </Modal>
  );
};
