import React, { useState } from "react";
import {
  FileText,
  Download,
  Printer,
  Mail,
  Ticket,
  AlertCircle,
  FileCheck,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { Booking } from "../../../lib/srs-types";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { IssueTicketModal } from "../../modals/IssueTicketModal";
import { SpecialRequestPopup } from "../../SpecialRequestPopup";

interface DocumentsSectionProps {
  booking: Booking;
  onTicketIssued: () => void;
}

export const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  booking,
  onTicketIssued,
}) => {
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isOfflineRequestOpen, setIsOfflineRequestOpen] = useState(false);

  const isIssued =
    booking.status === "Issued" ||
    booking.status === "Ticketed" ||
    booking.status === "Vouchered";

  // Mock wallet balance - in real app would come from context/api
  const walletBalance = 5000.0;

  const handleIssueTicket = () => {
    onTicketIssued();
    console.log("Ticket issued successfully!");
  };

  const handleOfflineRequest = (requests: any) => {
    console.log("Offline Request:", requests);
    setIsOfflineRequestOpen(false);
  };

  const documents = [
    {
      id: "itinerary",
      name: "Flight Itinerary",
      type: "PDF",
      date: booking.createdAt,
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      available: true,
    },
    {
      id: "invoice",
      name: "Commercial Invoice",
      type: "PDF",
      date: booking.createdAt,
      icon: <CreditCard className="w-5 h-5 text-green-600" />,
      available: true,
    },
    {
      id: "ticket",
      name: "E-Ticket / Voucher",
      type: "PDF",
      date: new Date().toISOString(),
      icon: <Ticket className="w-5 h-5 text-purple-600" />,
      available: isIssued, // Only available if issued
    },
    {
      id: "receipt",
      name: "Payment Receipt",
      type: "PDF",
      date: new Date().toISOString(),
      icon: <FileCheck className="w-5 h-5 text-teal-600" />,
      available: isIssued, // Only available if issued
    },
  ];

  return (
    <div className="space-y-6">
      {/* Action Card */}
      <Card className="bg-gradient-to-r from-indigo-50 to-white border-indigo-100">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-full ${isIssued ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
            >
              {isIssued ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">
                {isIssued ? "Booking is Ticketed" : "Booking on Hold"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                {isIssued
                  ? "Your ticket/voucher has been issued. You can download it below. For changes, please submit an offline request."
                  : "Confirm your booking by issuing the ticket. This will deduct the amount from your wallet."}
              </p>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {!isIssued ? (
              <Button
                onClick={() => setIsIssueModalOpen(true)}
                className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 gap-4"
              >
                <Ticket className="w-4 h-4 mr-2" />
                Issue Ticket
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsOfflineRequestOpen(true)}
                className="flex-1 md:flex-none border-border hover:border-border/80 text-muted-foreground gap-4"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Offline Request
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Available Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 p-6">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                doc.available
                  ? "border-border hover:border-border/80 hover:bg-muted/50"
                  : "border-transparent opacity-50 bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-card rounded-lg shadow-sm border border-border">
                  {doc.icon}
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{doc.name}</h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="bg-muted/50 px-1.5 py-0.5 rounded text-[10px] font-medium">
                      {doc.type}
                    </span>
                    {doc.available
                      ? `Generated on ${new Date(doc.date).toLocaleDateString()}`
                      : "Not generated yet"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {doc.available ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-muted-foreground hover:"
                    >
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-muted-foreground hover:"
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-2 text-xs border-border"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </Button>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground italic px-3">
                    Pending Issuance
                  </span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <IssueTicketModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onSubmit={handleIssueTicket}
        bookingId={booking.id}
        currency={booking.total.currency}
        amount={booking.total.amount}
        walletBalance={walletBalance}
      />

      <SpecialRequestPopup
        isOpen={isOfflineRequestOpen}
        onClose={() => setIsOfflineRequestOpen(false)}
        onConfirm={handleOfflineRequest}
      />
    </div>
  );
};
