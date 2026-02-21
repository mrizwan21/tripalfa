import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@tripalfa/ui-components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@tripalfa/ui-components/ui/card";
import { Button } from "@tripalfa/ui-components/ui/button";
import { Badge } from "@tripalfa/ui-components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@tripalfa/ui-components/ui/tabs";
import { Loader2, Plane, ArrowRight, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import api from "@/shared/lib/api";

export interface Flight {
  id: string;
  airline: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  currency: string;
}

export interface FlightAmendmentRequest {
  id: string;
  bookingId: string;
  bookingReference: string;
  traveler: string;
  currentFlight: Flight;
  requestType: "date_change" | "route_change" | "both";
  requestedDate?: string;
  requestedRoute?: { from: string; to: string };
  requestReason?: string;
  userApprovalStatus: "pending" | "approved" | "rejected";
  userApprovedOffer?: {
    flight: Flight;
    estimatedApprovalDate?: string;
  };
}

export interface AmendmentOffer {
  flights: Flight[];
  financialImpact: {
    currentFarePrice: number;
    newFarePrice: number;
    priceDifference: number;
    adjustmentType: "refund" | "charge" | "none";
    adjustmentAmount: number;
    currency: string;
  };
}

interface FlightAmendmentWorkflowProps {
  amendment: FlightAmendmentRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAmendmentComplete?: (result: FlightAmendmentRequest) => void;
}

// AlertBox component - custom alert without external library
const AlertBox = ({ type, children }: { type: "success" | "warning" | "error" | "info"; children: React.ReactNode }) => {
  const styles = {
    success: "bg-emerald-50 border-emerald-300 text-emerald-800",
    warning: "bg-amber-50 border-amber-300 text-amber-800",
    error: "bg-red-50 border-red-300 text-red-700",
    info: "bg-blue-50 border-blue-300 text-blue-800",
  };
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />,
    error: <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />,
    info: <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />,
  };
  return (
    <div className={`rounded-lg border-2 p-4 flex gap-3 ${styles[type]}`}>
      {icons[type]}
      <div className="flex-1">{children}</div>
    </div>
  );
};

export default function FlightAmendmentWorkflow({
  amendment,
  open,
  onOpenChange,
  onAmendmentComplete,
}: FlightAmendmentWorkflowProps) {
  const [step, setStep] = useState<"view" | "search" | "compare" | "user_approval" | "finalize">("view");
  const [offers, setOffers] = useState<AmendmentOffer | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userApprovalSent, setUserApprovalSent] = useState(false);
  const [userApprovalWaitTime, setUserApprovalWaitTime] = useState<number | null>(null);

  if (!amendment) return null;

  const handleSearchAlternatives = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/admin/bookings/${amendment.bookingId}/amendment/search-flights`, {
        currentFlight: amendment.currentFlight,
        requestType: amendment.requestType,
        requestedDate: amendment.requestedDate,
        requestedRoute: amendment.requestedRoute,
      });
      setOffers(res.data as AmendmentOffer);
      setStep("search");
    } catch (err) {
      console.error("Failed to search alternatives", err);
      setError("Unable to search alternative flights. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendToUserApproval = async (flight: Flight) => {
    setSelectedFlight(flight);
    setLoading(true);
    setError(null);
    try {
      const financialImpact = offers?.financialImpact || {
        adjustmentType: "none",
        adjustmentAmount: 0,
      };
      await api.post(`/admin/bookings/${amendment.bookingId}/amendment/send-user-approval`, {
        amendmentId: amendment.id,
        selectedFlight: flight,
        financialImpact,
        expiresIn: 24 * 60,
      });
      setUserApprovalSent(true);
      setUserApprovalWaitTime(24);
      setStep("user_approval");
    } catch (err) {
      console.error("Failed to send approval request", err);
      setError("Unable to send approval request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeAmendment = async () => {
    if (!selectedFlight || !offers) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/admin/bookings/${amendment.bookingId}/amendment/finalize`, {
        amendmentId: amendment.id,
        selectedFlight,
        financialImpact: offers.financialImpact,
      });
      const updatedAmendment = res.data as FlightAmendmentRequest;
      onAmendmentComplete?.(updatedAmendment);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to finalize amendment", err);
      setError("Unable to finalize amendment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Flight Amendment Workflow
          </DialogTitle>
          <DialogDescription>
            Booking: {amendment.bookingReference} | Traveler: {amendment.traveler}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={step} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="view" disabled={step !== "view" && step !== "search"} className="text-xs">
              <span className="hidden sm:inline">Current</span>
            </TabsTrigger>
            <TabsTrigger value="search" disabled={!offers && step !== "search"} className="text-xs">
              <span className="hidden sm:inline">Search</span>
            </TabsTrigger>
            <TabsTrigger value="compare" disabled={!offers && step !== "compare"} className="text-xs">
              <span className="hidden sm:inline">Compare</span>
            </TabsTrigger>
            <TabsTrigger value="user_approval" disabled={!userApprovalSent} className="text-xs">
              <span className="hidden sm:inline">User Approval</span>
            </TabsTrigger>
            <TabsTrigger value="finalize" disabled={!userApprovalSent} className="text-xs">
              <span className="hidden sm:inline">Finalize</span>
            </TabsTrigger>
          </TabsList>

          {/* STEP 1: View Current Booking */}
          <TabsContent value="view" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Flight Booking</CardTitle>
                <CardDescription>This is what the traveler wants to amend</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg bg-slate-50">
                    <h4 className="font-semibold text-sm text-slate-800 mb-3">Flight Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Airline:</span>
                        <span className="font-medium">{amendment.currentFlight.airline}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Route:</span>
                        <span className="font-medium">
                          {amendment.currentFlight.departure} → {amendment.currentFlight.arrival}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Departure:</span>
                        <span className="font-medium">{amendment.currentFlight.departureTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Arrival:</span>
                        <span className="font-medium">{amendment.currentFlight.arrivalTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Duration:</span>
                        <span className="font-medium">{amendment.currentFlight.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Stops:</span>
                        <span className="font-medium">
                          {amendment.currentFlight.stops === 0 ? "Direct" : `${amendment.currentFlight.stops} stop(s)`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h4 className="font-semibold text-sm text-slate-800 mb-3">Amendment Request</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Request Type:</span>
                        <Badge variant="outline" className="capitalize">
                          {amendment.requestType.replace("_", " ")}
                        </Badge>
                      </div>
                      {amendment.requestedDate && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Desired Date:</span>
                          <span className="font-medium">{new Date(amendment.requestedDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {amendment.requestedRoute && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Desired Route:</span>
                          <span className="font-medium">
                            {amendment.requestedRoute.from} → {amendment.requestedRoute.to}
                          </span>
                        </div>
                      )}
                      {amendment.requestReason && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <p className="text-slate-600 text-xs mb-1">User Reason:</p>
                          <p className="text-slate-800 italic text-sm">"{amendment.requestReason}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {error && (
                  <AlertBox type="error">
                    <p className="font-semibold">{error}</p>
                  </AlertBox>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSearchAlternatives} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Search Alternatives
              </Button>
            </div>
          </TabsContent>

          {/* STEP 2: Search Results */}
          <TabsContent value="search" className="space-y-4">
            {offers ? (
              <div className="space-y-4">
                <AlertBox type="success">
                  <p className="font-semibold">Found {offers.flights.length} alternative flight option(s)</p>
                  <p className="text-sm">Select a flight to compare prices and financial impact</p>
                </AlertBox>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Available Alternatives</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {offers.flights.map((flight) => (
                        <div
                          key={flight.id}
                          className="p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition"
                          onClick={() => {
                            setSelectedFlight(flight);
                            setStep("compare");
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900">{flight.airline}</p>
                              <div className="flex items-center gap-3 mt-2 text-sm">
                                <span className="font-medium">{flight.departure}</span>
                                <span className="text-slate-500">{flight.departureTime}</span>
                                <ArrowRight className="h-4 w-4 text-slate-400" />
                                <span className="font-medium">{flight.arrival}</span>
                                <span className="text-slate-500">{flight.arrivalTime}</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                {flight.duration} • {flight.stops === 0 ? "Direct" : `${flight.stops} stop(s)`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-lg text-slate-900">
                                {flight.currency} {flight.price.toFixed(2)}
                              </p>
                              <Button size="sm" variant="outline" className="mt-2">
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-slate-400" />
                <p className="text-slate-600">Searching for alternatives...</p>
              </div>
            )}
          </TabsContent>

          {/* STEP 3: Compare & Financial Impact */}
          <TabsContent value="compare" className="space-y-4">
            {selectedFlight && offers && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Itinerary Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border-2 border-slate-200 rounded-lg p-4 bg-slate-50">
                        <h4 className="font-semibold text-sm text-slate-700 mb-3">Current Booking</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{amendment.currentFlight.departure}</span>
                            <span className="text-xs text-slate-500">→</span>
                            <span className="font-medium">{amendment.currentFlight.arrival}</span>
                          </div>
                          <p className="text-slate-600">{amendment.currentFlight.departureTime}</p>
                          <p className="text-xs text-slate-500">{amendment.currentFlight.duration}</p>
                          <div className="pt-2 border-t border-slate-200 text-lg font-semibold text-slate-900">
                            {amendment.currentFlight.currency} {amendment.currentFlight.price.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="border-2 border-emerald-500 rounded-lg p-4 bg-emerald-50">
                        <h4 className="font-semibold text-sm text-emerald-700 mb-3">Proposed Amendment</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{selectedFlight.departure}</span>
                            <span className="text-xs text-slate-500">→</span>
                            <span className="font-medium">{selectedFlight.arrival}</span>
                          </div>
                          <p className="text-slate-600">{selectedFlight.departureTime}</p>
                          <p className="text-xs text-slate-500">{selectedFlight.duration}</p>
                          <div className="pt-2 border-t border-emerald-200 text-lg font-semibold text-emerald-700">
                            {selectedFlight.currency} {selectedFlight.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Financial Impact Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-600 mb-1">Current Fare</p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {offers.financialImpact.currency} {offers.financialImpact.currentFarePrice.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-lg">
                        <p className="text-sm text-emerald-600 mb-1">New Fare</p>
                        <p className="text-2xl font-semibold text-emerald-700">
                          {offers.financialImpact.currency} {offers.financialImpact.newFarePrice.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {offers.financialImpact.adjustmentType !== "none" && (
                      <AlertBox type={offers.financialImpact.adjustmentType === "refund" ? "success" : "warning"}>
                        <div>
                          <p className="font-semibold">
                            {offers.financialImpact.adjustmentType === "refund" ? "Refund Due" : "Additional Charge"}
                          </p>
                          <p className="text-lg font-bold mt-1">
                            {offers.financialImpact.currency} {Math.abs(offers.financialImpact.adjustmentAmount).toFixed(2)}
                          </p>
                          <p className="text-sm mt-2">
                            {offers.financialImpact.adjustmentType === "refund"
                              ? "Traveler will receive a refund for the price difference. Credit within 5-7 business days."
                              : "Traveler will pay additional amount. Charge applied to existing payment method."}
                          </p>
                        </div>
                      </AlertBox>
                    )}
                  </CardContent>
                </Card>

                {error && <AlertBox type="error">{error}</AlertBox>}
              </>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("search")}>
                Back
              </Button>
              <Button onClick={() => handleSendToUserApproval(selectedFlight!)} disabled={!selectedFlight || loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send to Traveler for Approval
              </Button>
            </div>
          </TabsContent>

          {/* STEP 4: User Approval Status */}
          <TabsContent value="user_approval" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Waiting for Traveler Approval</CardTitle>
                <CardDescription>An approval link has been sent to {amendment.traveler}. They have 24 hours to respond.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <AlertBox type="info">
                  <div>
                    <p className="font-semibold">Approval Request In Progress</p>
                    <p className="text-sm mt-1">Time remaining: ~{userApprovalWaitTime} hours</p>
                    <p className="text-sm mt-2">We're waiting for the traveler to review and approve the financial changes and new itinerary.</p>
                  </div>
                </AlertBox>

                {selectedFlight && offers && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-800">What's Awaiting Approval:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-slate-600 mb-2">New Flight Details</p>
                        <p className="font-medium text-slate-900">{selectedFlight.airline}</p>
                        <p className="text-sm text-slate-600">
                          {selectedFlight.departure} → {selectedFlight.arrival}
                        </p>
                        <p className="text-sm text-slate-600">{selectedFlight.departureTime}</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-slate-600 mb-2">Financial Impact</p>
                        <Badge
                          variant="default"
                          className={
                            offers.financialImpact.adjustmentType === "refund"
                              ? "bg-emerald-100 text-emerald-800 border-0"
                              : offers.financialImpact.adjustmentType === "charge"
                              ? "bg-amber-100 text-amber-800 border-0"
                              : "bg-slate-100 text-slate-800 border-0"
                          }
                        >
                          {offers.financialImpact.adjustmentType === "refund"
                            ? `Refund: ${offers.financialImpact.currency} ${offers.financialImpact.adjustmentAmount.toFixed(2)}`
                            : offers.financialImpact.adjustmentType === "charge"
                            ? `Charge: ${offers.financialImpact.currency} ${offers.financialImpact.adjustmentAmount.toFixed(2)}`
                            : "No change"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                <AlertBox type="warning">
                  <p>Once the traveler approves, you must finalize the amendment to complete the process. They will receive confirmation immediately after.</p>
                </AlertBox>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close (Stay in Queue)
              </Button>
              <Button onClick={() => setStep("finalize")} className="bg-emerald-600 hover:bg-emerald-700">
                Check Approval Status
              </Button>
            </div>
          </TabsContent>

          {/* STEP 5: Finalize Amendment */}
          <TabsContent value="finalize" className="space-y-4">
            <AlertBox type="success">
              <p className="font-semibold">✓ Traveler has approved the amendment</p>
              <p className="text-sm mt-1">All details are confirmed. Click below to finalize and process the flight amendment.</p>
            </AlertBox>

            {selectedFlight && offers && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Amendment Summary - Ready to Finalize</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-600 uppercase tracking-wide mb-2">Booking Reference</p>
                      <p className="font-semibold text-lg text-slate-900">{amendment.bookingReference}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-600 uppercase tracking-wide mb-2">Traveler</p>
                      <p className="font-semibold text-slate-900">{amendment.traveler}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-slate-800 mb-3">New Flight Assignment</h4>
                    <div className="p-4 border border-emerald-300 bg-emerald-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{selectedFlight.airline}</p>
                          <div className="flex items-center gap-2 mt-2 text-slate-800">
                            <span className="font-medium">{selectedFlight.departure}</span>
                            <ArrowRight className="h-4 w-4" />
                            <span className="font-medium">{selectedFlight.arrival}</span>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">
                            {selectedFlight.departureTime} • {selectedFlight.duration}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">
                            {selectedFlight.currency} {selectedFlight.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {offers.financialImpact.adjustmentType !== "none" && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-slate-800 mb-3">Financial Settlement</h4>
                      <AlertBox type={offers.financialImpact.adjustmentType === "refund" ? "success" : "warning"}>
                        <div>
                          <p className="font-semibold">
                            {offers.financialImpact.adjustmentType === "refund"
                              ? `Refund of ${offers.financialImpact.currency} ${offers.financialImpact.adjustmentAmount.toFixed(2)}`
                              : `Charge of ${offers.financialImpact.currency} ${offers.financialImpact.adjustmentAmount.toFixed(2)}`}
                          </p>
                          <p className="text-sm mt-2">
                            {offers.financialImpact.adjustmentType === "refund"
                              ? "The refund will be credited to the original payment method within 5-7 business days."
                              : "The charge will be applied to the existing payment method on file."}
                          </p>
                        </div>
                      </AlertBox>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {error && <AlertBox type="error">{error}</AlertBox>}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {step === "finalize" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Save Draft & Exit
              </Button>
              <Button onClick={handleFinalizeAmendment} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Finalize Amendment
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
