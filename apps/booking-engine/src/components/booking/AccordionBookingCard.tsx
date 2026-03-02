import React from "react";
import { Booking } from "../../lib/srs-types";
import { Accordion, AccordionItem } from "../ui/accordion";
import { GeneralSection } from "./sections/GeneralSection";
import { ContactSection } from "./sections/ContactSection";
import { CostingSection } from "./sections/CostingSection";
import { PaymentsSection } from "./sections/PaymentsSection";
import { DocumentsSection } from "./sections/DocumentsSection";
import { InvoicesSection } from "./sections/InvoicesSection";
import { HistorySection } from "./sections/HistorySection";
import { StatusBadge } from "../ui/StatusBadge";

interface AccordionBookingCardProps {
  booking: Booking;
}

export const AccordionBookingCard: React.FC<AccordionBookingCardProps> = ({
  booking,
}) => {
  return (
    <div className="max-w-md mx-auto bg-[var(--color-bg-tertiary)] min-h-screen sm:min-h-0 sm:bg-[var(--color-bg-primary)]">
      {/* Mobile Header */}
      <div className="bg-[var(--color-bg-primary)] p-5 mb-4 border-b border-[var(--color-border-light)] sm:border sm:rounded-xl">
        <div className="flex justify-between items-center mb-2 gap-4">
          <div className="text-lg font-bold text-[var(--color-text-primary)]">
            {booking.product === "flight" ? "Flight Booking" : "Hotel Booking"}
          </div>
          <StatusBadge
            status={booking.status}
            type={
              booking.status === "Issued" || booking.status === "Confirmed"
                ? "success"
                : "neutral"
            }
          />
        </div>
        <div className="text-sm text-[var(--color-text-tertiary)]">
          Ref:{" "}
          <span className="font-mono text-[var(--color-text-secondary)]">
            {booking.reference || booking.id}
          </span>
        </div>
      </div>

      <div className="px-4 pb-10 sm:px-0">
        <Accordion allowMultiple={false}>
          <AccordionItem title="General" badge="Details">
            <GeneralSection booking={booking} />
          </AccordionItem>

          <AccordionItem title="Contact" badge="2 items">
            <ContactSection booking={booking} />
          </AccordionItem>

          <AccordionItem
            title="Costing"
            badge={`${booking.total.currency} ${booking.total.amount.toFixed(0)}`}
          >
            <CostingSection booking={booking} />
          </AccordionItem>

          <AccordionItem
            title="Payments"
            badge={booking.paymentStatus || "Status"}
          >
            <PaymentsSection booking={booking} />
          </AccordionItem>

          <AccordionItem title="Documents" badge="DL">
            <DocumentsSection
              booking={booking}
              onTicketIssued={() => {
                console.log("Ticket Issued - Refreshing booking data...");
              }}
            />
          </AccordionItem>

          <AccordionItem title="Invoices" badge="1">
            <InvoicesSection booking={booking} />
          </AccordionItem>

          <AccordionItem title="Booking History" badge="Log">
            <HistorySection booking={booking} />
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};
