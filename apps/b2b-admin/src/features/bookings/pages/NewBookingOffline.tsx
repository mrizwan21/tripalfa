import { useState, useMemo } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@tripalfa/ui-components/ui/card";
import { Button } from "@tripalfa/ui-components/ui/button";
import { Input } from "@tripalfa/ui-components/ui/input";
import { Textarea } from "@tripalfa/ui-components/ui/textarea";
import { Label } from "@tripalfa/ui-components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@tripalfa/ui-components/ui/select";
import api from "@/shared/lib/api";
import { Loader2, Check, Eye, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@tripalfa/ui-components/ui/dialog";
import { AdminBooking, OfflineBookingPayload, FinanceState } from "../types";

export default function NewBookingOfflinePage() {
  const [payload, setPayload] = useState<OfflineBookingPayload>({
    traveler: "",
    product: "hotel",
    reference: "",
    notes: "",
    amount: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offlineBookingId, setOfflineBookingId] = useState("");
  const [offlineBooking, setOfflineBooking] = useState<AdminBooking | null>(null);
  const [offlineLoading, setOfflineLoading] = useState(false);
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingMessage, setPricingMessage] = useState<string | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [finance, setFinance] = useState<FinanceState>({
    baseAmount: "",
    markup: "0",
    tax: "0",
    fees: "0",
    currency: "USD",
    note: "",
  });
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post("/admin/bookings", {
        customerName: payload.traveler,
        reference: payload.reference,
        type: payload.product,
        amount: Number(payload.amount || 0),
        notes: payload.notes,
        channel: "manual",
      });
      setSuccess("Manual booking submitted to queue.");
      setPayload({ traveler: "", product: "hotel", reference: "", notes: "", amount: "" });
    } catch (err: unknown) {
      console.error("Failed to submit manual booking", err);
      setError("Unable to submit manual booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function loadOfflineBooking() {
    if (!offlineBookingId.trim()) {
      setOfflineError("Enter a booking ID or reference to load details.");
      return;
    }
    setOfflineLoading(true);
    setOfflineError(null);
    setOfflineBooking(null);
    try {
      const res = await api.get(`/admin/bookings/${offlineBookingId}`);
      const bookingData = (res.data?.data as AdminBooking) ?? (res.data as AdminBooking);
      setOfflineBooking(bookingData);
      const amt = bookingData.totalAmount ?? bookingData.amount ?? "";
      const cur = bookingData.currency ?? "USD";
      setFinance((prev) => ({ ...prev, baseAmount: amt?.toString?.() ?? "", currency: cur }));
    } catch (err) {
      console.error("Failed to load booking for offline request", err);
      setOfflineError("Unable to load booking. Check the ID or try again.");
    } finally {
      setOfflineLoading(false);
    }
  }

  const totalComputed = useMemo(() => {
    const base = Number(finance.baseAmount || 0);
    const markup = Number(finance.markup || 0);
    const tax = Number(finance.tax || 0);
    const fees = Number(finance.fees || 0);
    return base + markup + tax + fees;
  }, [finance]);

  const financeValidation = useMemo(() => {
    const base = Number(finance.baseAmount);
    const markup = Number(finance.markup);
    const tax = Number(finance.tax);
    const fees = Number(finance.fees);
    if ([base, markup, tax, fees].some((v) => Number.isNaN(v))) {
      return { valid: false, reason: "Enter numeric values for all amounts." };
    }
    if ([base, markup, tax, fees].some((v) => v < 0)) {
      return { valid: false, reason: "Amounts cannot be negative." };
    }
    if (!finance.currency.trim()) {
      return { valid: false, reason: "Currency is required." };
    }
    return { valid: true, reason: null };
  }, [finance]);

  const savePricing = async () => {
    if (!offlineBooking) return;
    if (!financeValidation.valid) {
      setPricingError(financeValidation.reason);
      return;
    }
    setPricingSaving(true);
    setPricingMessage(null);
    setPricingError(null);
    try {
      await api.post(`/admin/bookings/${offlineBooking.id}/pricing`, {
        baseAmount: Number(finance.baseAmount || 0),
        markup: Number(finance.markup || 0),
        tax: Number(finance.tax || 0),
        fees: Number(finance.fees || 0),
        currency: finance.currency,
        total: totalComputed,
        note: finance.note,
      });
      setPricingMessage("Pricing saved and queued for invoicing.");
    } catch (err) {
      console.error("Failed to save pricing", err);
      setPricingError("Unable to save pricing. Please retry.");
    } finally {
      setPricingSaving(false);
    }
  };

  const raiseInvoice = async () => {
    if (!offlineBooking) return;
    if (!financeValidation.valid) {
      setPricingError(financeValidation.reason);
      return;
    }
    // Show invoice preview instead of directly raising
    setShowInvoicePreview(true);
  };

  const confirmAndRaiseInvoice = async () => {
    if (!offlineBooking) return;
    setPricingSaving(true);
    setPricingMessage(null);
    setPricingError(null);
    setShowInvoicePreview(false);
    try {
      await api.post(`/admin/bookings/${offlineBooking.id}/invoice`, {
        amount: totalComputed,
        currency: finance.currency,
        note: finance.note,
      });
      setPricingMessage("✓ Invoice raised and customer will be notified.");
    } catch (err) {
      console.error("Failed to raise invoice", err);
      setPricingError("Unable to raise invoice. Please retry.");
    } finally {
      setPricingSaving(false);
    }
  };

  const payViaWallet = async () => {
    if (!offlineBooking) return;
    if (!financeValidation.valid) {
      setPricingError(financeValidation.reason);
      return;
    }
    setPricingSaving(true);
    setPricingMessage(null);
    setPricingError(null);
    try {
      await api.post(`/admin/bookings/${offlineBooking.id}/pay-wallet`, {
        amount: totalComputed,
        currency: finance.currency,
        note: finance.note,
      });
      setPaymentSuccess(`✓ Payment of ${finance.currency} ${totalComputed.toFixed(2)} successfully processed. Status: Payment In Progress`);
    } catch (err) {
      console.error("Wallet payment failed", err);
      setPricingError("Unable to process wallet payment. Please retry.");
    } finally {
      setPricingSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">New Booking (Manual / Offline)</h1>
          <p className="text-sm text-slate-500">Capture offline requests and push them to booking queues.</p>
        </div>
        <Button variant="secondary" size="sm">Save draft</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Offline Change Request</CardTitle>
          <CardDescription>Submit an offline change (flight/hotel) for an existing booking.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3 md:items-end">
            <div className="space-y-2 md:col-span-2">
              <Label>Booking ID or Reference</Label>
              <Input
                value={offlineBookingId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOfflineBookingId(e.target.value)}
                placeholder="Enter booking ID or reference"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => { setOfflineBookingId(""); setOfflineBooking(null); }}>
                Reset
              </Button>
              <Button type="button" onClick={loadOfflineBooking} disabled={offlineLoading}>
                {offlineLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Load booking
              </Button>
            </div>
          </div>

          {offlineError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{offlineError}</div>
          )}

          {offlineBooking && (
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-semibold text-slate-800">Finance & Invoicing</h4>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <Label>Base amount</Label>
                  <Input
                    type="number"
                    value={finance.baseAmount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFinance((p) => ({ ...p, baseAmount: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Markup</Label>
                  <Input
                    type="number"
                    value={finance.markup}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFinance((p) => ({ ...p, markup: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Tax</Label>
                  <Input
                    type="number"
                    value={finance.tax}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFinance((p) => ({ ...p, tax: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Fees</Label>
                  <Input
                    type="number"
                    value={finance.fees}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFinance((p) => ({ ...p, fees: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Currency</Label>
                  <Input
                    value={finance.currency}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFinance((p) => ({ ...p, currency: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Total (computed)</Label>
                  <Input value={totalComputed.toFixed(2)} readOnly className="bg-slate-50" />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea
                  value={finance.note}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFinance((p) => ({ ...p, note: e.target.value }))}
                  placeholder="Markup rationale, tax breakdown, payment instructions"
                />
              </div>

              {pricingMessage && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 flex items-center gap-2">
                  <Check className="h-4 w-4" /> {pricingMessage}
                </div>
              )}
              {paymentSuccess && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 flex items-center gap-2">
                  <Check className="h-4 w-4" /> {paymentSuccess}
                </div>
              )}
              {pricingError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{pricingError}</div>
              )}
              {!pricingError && !financeValidation.valid && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{financeValidation.reason}</div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={savePricing} disabled={pricingSaving || !financeValidation.valid}>
                  {pricingSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save pricing
                </Button>
                <Button type="button" onClick={raiseInvoice} disabled={pricingSaving || !financeValidation.valid}>
                  {pricingSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} <Eye className="mr-2 h-4 w-4" /> Preview & raise invoice
                </Button>
                <Button type="button" variant="secondary" onClick={payViaWallet} disabled={pricingSaving || !financeValidation.valid}>
                  {pricingSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} <DollarSign className="mr-2 h-4 w-4" /> Pay via wallet
                </Button>
              </div>
              <p className="text-xs text-slate-500">All payments are routed through centralized wallet management.</p>

              <Dialog open={showInvoicePreview} onOpenChange={setShowInvoicePreview}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invoice Preview</DialogTitle>
                    <DialogDescription>Review invoice details before raising</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <h4 className="font-semibold text-slate-800 mb-3">Invoice Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Reference:</span>
                          <span className="font-medium">{offlineBooking?.reference || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Traveler:</span>
                          <span className="font-medium">{offlineBooking?.traveler || offlineBooking?.customerName || "Unknown"}</span>
                        </div>
                        <div className="border-t border-slate-200 my-2 pt-2">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Base Amount:</span>
                            <span>{finance.currency} {Number(finance.baseAmount || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Markup:</span>
                            <span>{finance.currency} {Number(finance.markup || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Tax:</span>
                            <span>{finance.currency} {Number(finance.tax || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Fees:</span>
                            <span>{finance.currency} {Number(finance.fees || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-200 mt-2 pt-2 font-semibold">
                            <span>Total:</span>
                            <span className="text-emerald-600">{finance.currency} {totalComputed.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Due Date:</span>
                          <span className="font-medium">
                            {new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowInvoicePreview(false)}>
                      Cancel
                    </Button>
                    <Button onClick={confirmAndRaiseInvoice} disabled={pricingSaving}>
                      {pricingSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirm & Raise
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
          <CardDescription>Record the essentials for manual processing.</CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <Check className="h-4 w-4" /> {success}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Traveler Name</Label>
              <Input
                value={payload.traveler}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPayload({ ...payload, traveler: e.target.value })}
                placeholder="Traveler full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Reference</Label>
              <Input
                value={payload.reference}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPayload({ ...payload, reference: e.target.value })}
                placeholder="Internal ref"
              />
            </div>
            <div className="space-y-2">
              <Label>Product</Label>
              <Select
                value={payload.product}
                onValueChange={(value: string) => setPayload({ ...payload, product: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="flight">Flight</SelectItem>
                  <SelectItem value="package">Package</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min={0}
                value={payload.amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPayload({ ...payload, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={payload.notes}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPayload({ ...payload, notes: e.target.value })}
                placeholder="Special requests, supplier instructions, PNR, etc."
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setPayload({ traveler: "", product: "hotel", reference: "", notes: "", amount: "" })}>
                Reset
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {submitting ? "Submitting..." : "Submit to queue"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
