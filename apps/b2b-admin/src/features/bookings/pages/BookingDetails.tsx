import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  CreditCard,
  User,
  MapPin,
  Plane,
  Hotel,
  Package,
} from "lucide-react";
import api from "@/shared/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@tripalfa/ui-components/ui/card";
import { Button } from "@tripalfa/ui-components/ui/button";
import { Badge } from "@tripalfa/ui-components/ui/badge";

type AdminBooking = {
  id: string;
  reference?: string;
  bookingRef?: string;
  status?: string;
  type?: string;
  product?: string;
  createdAt?: string;
  issuedDate?: string;
  paymentStatus?: string;
  destination?: string;
  origin?: string;
  checkInDate?: string;
  checkOutDate?: string;
  roomType?: string;
  amount?: number;
  totalAmount?: number;
  currency?: string;
  traveler?: string;
  customerName?: string;
  userEmail?: string;
  email?: string;
  customerEmail?: string;
  phone?: string;
  passengers?: number;
  pnr?: string;
  supplier?: string;
  provider?: string;
  channel?: string;
  source?: string;
  raw?: Record<string, any>;
};

const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "confirmed":
    case "completed":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "pending":
    case "on hold":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "cancelled":
    case "failed":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-muted text-foreground border-border";
  }
};

const getProductIcon = (product?: string) => {
  const p = product?.toLowerCase();
  if (p === "hotel") return Hotel;
  if (p === "flight") return Plane;
  return Package;
};

export default function BookingDetailsPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState<AdminBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/admin/bookings/${id}`, {
          signal: controller.signal,
        });
        const data =
          (res.data?.data as AdminBooking) || (res.data as AdminBooking);
        setBooking(data);
      } catch (err) {
        if (!(err instanceof Error && err.name === "CanceledError")) {
          console.error("Failed to load booking", err);
          setError("Unable to load booking details.");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center text-sm text-muted-foreground gap-4">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading booking...
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center text-muted-foreground gap-4">
        <p className="text-base font-semibold">
          {error ?? "Booking not found"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Please try again or return to the bookings list.
        </p>
        <Link to="/bookings">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bookings
          </Button>
        </Link>
      </div>
    );
  }

  const ProductIcon = getProductIcon(booking.product || booking.type);
  const productType = (booking.product || booking.type || "booking")
    .toString()
    .toLowerCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <Link to="/bookings">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Booking Details
            </h1>
            <p className="text-sm text-muted-foreground">
              Reference: {booking.reference || booking.bookingRef || booking.id}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={getStatusColor(booking.status)}>
          {booking.status || "Unknown"}
        </Badge>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Overview */}
          <Card>
            <CardHeader className="space-y-0 gap-2">
              <CardTitle className="flex items-center gap-2">
                <ProductIcon className="h-5 w-5 text-indigo-600" />
                {productType.charAt(0).toUpperCase() +
                  productType.slice(1)}{" "}
                Booking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Booking ID</p>
                  <p className="font-medium text-foreground">{booking.id}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Reference</p>
                  <p className="font-medium text-foreground">
                    {booking.reference || booking.bookingRef || "-"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {new Date(
                      booking.createdAt || booking.issuedDate || Date.now(),
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Payment Status
                  </p>
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    {booking.paymentStatus || "Pending"}
                  </p>
                </div>
              </div>

              {booking.origin && booking.destination && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Route</p>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="font-semibold text-foreground">
                        {booking.origin}
                      </p>
                      <p className="text-xs text-muted-foreground">Origin</p>
                    </div>
                    <div className="flex-1 h-px bg-border gap-4" />
                    <Plane className="h-5 w-5 text-indigo-600" />
                    <div className="flex-1 h-px bg-border gap-4" />
                    <div className="text-center">
                      <p className="font-semibold text-foreground">
                        {booking.destination}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Destination
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {booking.destination && !booking.origin && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Location</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-foreground">
                      {booking.destination}
                    </p>
                  </div>
                </div>
              )}

              {booking.checkInDate && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">
                    Stay Period
                  </p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Check-in</p>
                      <p className="font-medium text-foreground">
                        {new Date(booking.checkInDate).toLocaleDateString()}
                      </p>
                    </div>
                    {booking.checkOutDate && (
                      <>
                        <div className="h-px w-8 bg-border" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Check-out
                          </p>
                          <p className="font-medium text-foreground">
                            {new Date(
                              booking.checkOutDate,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  {booking.roomType && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Room: {booking.roomType}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Raw Data */}
          {booking.raw && (
            <Card>
              <CardHeader className="space-y-0 gap-2">
                <CardTitle className="text-sm">Additional Details</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                  {JSON.stringify(booking.raw, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Price Summary */}
          <Card>
            <CardHeader className="space-y-0 gap-2">
              <CardTitle>Price Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  {booking.currency || "USD"}{" "}
                  {(booking.totalAmount || booking.amount || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Taxes & Fees</span>
                <span className="font-medium">Included</span>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-lg text-foreground">
                    {booking.currency || "USD"}{" "}
                    {(booking.totalAmount || booking.amount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader className="space-y-0 gap-2">
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-6">
              <p className="font-medium text-foreground">
                {booking.customerName || "Guest"}
              </p>
              {booking.email && (
                <p className="text-sm text-muted-foreground">{booking.email}</p>
              )}
              {booking.phone && (
                <p className="text-sm text-muted-foreground">{booking.phone}</p>
              )}
              {booking.passengers && (
                <p className="text-sm text-muted-foreground">
                  {booking.passengers} passenger(s)
                </p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button className="w-full">Edit Booking</Button>
            <Button variant="outline" className="w-full">
              Download Invoice
            </Button>
            <Button
              variant="outline"
              className="w-full hover: hover:bg-rose-50"
            >
              Cancel Booking
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
