import React from "react";
import { Booking } from "../../../lib/srs-types";

interface CostingSectionProps {
  booking: Booking;
}

export const CostingSection: React.FC<CostingSectionProps> = ({ booking }) => {
  const { total } = booking;

  // Dummy breakdown as 'total' only has amount/currency in Booking interface
  const breakdown = {
    baseFare: total.amount * 0.8,
    taxes: total.amount * 0.15,
    fees: total.amount * 0.05,
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm gap-4">
          <span className="text-[var(--color-text-tertiary)]">Base Fare</span>
          <span className="font-medium">
            {total.currency} {breakdown.baseFare.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm gap-4">
          <span className="text-[var(--color-text-tertiary)]">
            Taxes & Charges
          </span>
          <span className="font-medium">
            {total.currency} {breakdown.taxes.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm gap-4">
          <span className="text-[var(--color-text-tertiary)]">
            Service Fees
          </span>
          <span className="font-medium">
            {total.currency} {breakdown.fees.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="border-t border-[var(--color-border-light)] pt-3 flex justify-between items-center gap-4">
        <span className="font-semibold text-[var(--color-text-primary)]">
          Total Amount
        </span>
        <span className="font-bold text-lg text-[var(--color-text-primary)]">
          {total.currency} {total.amount.toFixed(2)}
        </span>
      </div>
    </div>
  );
};
