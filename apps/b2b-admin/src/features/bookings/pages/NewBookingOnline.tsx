import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@tripalfa/ui-components/ui/card";
import { Button } from "@tripalfa/ui-components/ui/button";
import { Input } from "@tripalfa/ui-components/ui/input";
import { Label } from "@tripalfa/ui-components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@tripalfa/ui-components/ui/tabs";
import { Hotel, Plane, Search, Loader2 } from "lucide-react";
import api from "@/shared/lib/api";
import { CityAutocomplete } from "@/shared/components/inputs/CityAutocomplete";

type CitySuggestion = {
  code?: string;
  name?: string;
  city?: string;
  country?: string;
  [key: string]: any;
};

export default function NewBookingOnlinePage() {
  const [form, setForm] = useState({
    origin: "DXB",
    destination: "",
    guests: 2,
    rooms: 1,
    hotelCheckIn: "",
    hotelCheckOut: "",
    flightDepart: "",
    flightReturn: "",
  });
  const [selectedDestination, setSelectedDestination] =
    useState<CitySuggestion | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<CitySuggestion | null>(
    null,
  );
  const [hotelSearching, setHotelSearching] = useState(false);
  const [hotelResults, setHotelResults] = useState<any[]>([]);
  const [hotelError, setHotelError] = useState<string | null>(null);
  const [flightSearching, setFlightSearching] = useState(false);
  const [flightResults, setFlightResults] = useState<any[]>([]);
  const [flightError, setFlightError] = useState<string | null>(null);

  const searchHotels = async () => {
    if (!form.destination.trim() || !form.hotelCheckIn || !form.hotelCheckOut) {
      setHotelError("Please enter destination and check-in/out dates.");
      return;
    }
    setHotelSearching(true);
    setHotelError(null);
    setHotelResults([]);
    try {
      const res = await api.get("/admin/bookings/search/hotels", {
        params: {
          destination: form.destination,
          checkIn: form.hotelCheckIn,
          checkOut: form.hotelCheckOut,
          rooms: form.rooms,
          guests: form.guests,
        },
      });
      const results = res.data?.results || res.data?.hotels || [];
      if (results.length === 0) {
        setHotelError(
          "No hotels found for your criteria. Try different dates.",
        );
      } else {
        setHotelResults(results);
      }
    } catch (err) {
      console.error("Hotel search failed", err);
      setHotelError("Unable to search hotels. Please try again.");
    } finally {
      setHotelSearching(false);
    }
  };

  const searchFlights = async () => {
    if (!form.origin.trim() || !form.destination.trim() || !form.flightDepart) {
      setFlightError("Please enter origin, destination, and departure date.");
      return;
    }
    setFlightSearching(true);
    setFlightError(null);
    setFlightResults([]);
    try {
      const res = await api.get("/admin/bookings/search/flights", {
        params: {
          origin: form.origin.toUpperCase(),
          destination: form.destination.toUpperCase(),
          depart: form.flightDepart,
          return: form.flightReturn,
          passengers: form.guests,
        },
      });
      const results = res.data?.results || res.data?.flights || [];
      if (results.length === 0) {
        setFlightError(
          "No flights found for your criteria. Try different dates.",
        );
      } else {
        setFlightResults(results);
      }
    } catch (err) {
      console.error("Flight search failed", err);
      setFlightError("Unable to search flights. Please try again.");
    } finally {
      setFlightSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            New Booking (Online)
          </h1>
          <p className="text-sm text-muted-foreground">
            Search live inventory via suppliers configured in API manager.
          </p>
        </div>
        <Button size="sm" variant="secondary">
          <Search className="mr-2 h-4 w-4" />
          Quick Search
        </Button>
      </div>

      <Tabs defaultValue="hotel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hotel">
            <Hotel className="mr-2 h-4 w-4" />
            Hotel
          </TabsTrigger>
          <TabsTrigger value="flight">
            <Plane className="mr-2 h-4 w-4" />
            Flight
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hotel">
          <Card>
            <CardHeader className="space-y-0 gap-2">
              <CardTitle>Hotel Search</CardTitle>
              <CardDescription>
                Enter search criteria and fetch rates.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-6">
              <CityAutocomplete
                label="Destination"
                placeholder="Search city or destination..."
                value={form.destination}
                onChange={(value, suggestion) => {
                  setForm({ ...form, destination: value });
                  setSelectedDestination(suggestion || null);
                }}
                type="hotel"
              />
              <div className="space-y-2">
                <Label>Rooms</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.rooms}
                  onChange={(e) =>
                    setForm({ ...form, rooms: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Guests</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.guests}
                  onChange={(e) =>
                    setForm({ ...form, guests: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Check-in</Label>
                  <Input
                    type="date"
                    value={form.hotelCheckIn}
                    onChange={(e) =>
                      setForm({ ...form, hotelCheckIn: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Check-out</Label>
                  <Input
                    type="date"
                    value={form.hotelCheckOut}
                    onChange={(e) =>
                      setForm({ ...form, hotelCheckOut: e.target.value })
                    }
                  />
                </div>
              </div>
              {hotelError && (
                <div className="lg:col-span-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {hotelError}
                </div>
              )}
              <div className="lg:col-span-3 flex justify-end gap-4">
                <Button onClick={searchHotels} disabled={hotelSearching}>
                  {hotelSearching && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {hotelSearching ? "Searching..." : "Search hotels"}
                </Button>
              </div>
              {hotelResults.length > 0 && (
                <div className="lg:col-span-3">
                  <h4 className="mb-3 text-sm font-semibold text-foreground">
                    Available Hotels
                  </h4>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {hotelResults.map((hotel, idx) => (
                      <Card key={idx} className="overflow-hidden">
                        <CardContent className="space-y-2 p-3">
                          <h5 className="font-medium text-foreground">
                            {hotel.name || `Hotel ${idx + 1}`}
                          </h5>
                          <p className="text-xs text-muted-foreground">
                            {hotel.location || hotel.destination}
                          </p>
                          <p className="text-sm font-semibold text-emerald-600">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: hotel.currency || "USD",
                            }).format(hotel.price || hotel.rate || 0)}
                          </p>
                          <Button size="sm" className="w-full">
                            Book
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flight">
          <Card>
            <CardHeader className="space-y-0 gap-2">
              <CardTitle>Flight Search</CardTitle>
              <CardDescription>
                Look up flights via Duffel/Amadeus connectors.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-6">
              <CityAutocomplete
                label="From"
                placeholder="Search origin airport..."
                value={form.origin}
                onChange={(value, suggestion) => {
                  setForm({ ...form, origin: value });
                  setSelectedOrigin(suggestion || null);
                }}
                type="flight"
              />
              <CityAutocomplete
                label="To"
                placeholder="Search destination airport..."
                value={form.destination}
                onChange={(value, suggestion) => {
                  setForm({ ...form, destination: value });
                  setSelectedDestination(suggestion || null);
                }}
                type="flight"
              />
              <div className="space-y-2">
                <Label>Passengers</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.guests}
                  onChange={(e) =>
                    setForm({ ...form, guests: Number(e.target.value) })
                  }
                />
              </div>
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Depart</Label>
                  <Input
                    type="date"
                    value={form.flightDepart}
                    onChange={(e) =>
                      setForm({ ...form, flightDepart: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Return</Label>
                  <Input
                    type="date"
                    value={form.flightReturn}
                    onChange={(e) =>
                      setForm({ ...form, flightReturn: e.target.value })
                    }
                  />
                </div>
              </div>
              {flightError && (
                <div className="lg:col-span-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {flightError}
                </div>
              )}
              <div className="lg:col-span-3 flex justify-end gap-4">
                <Button onClick={searchFlights} disabled={flightSearching}>
                  {flightSearching && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {flightSearching ? "Searching..." : "Search flights"}
                </Button>
              </div>
              {flightResults.length > 0 && (
                <div className="lg:col-span-3">
                  <h4 className="mb-3 text-sm font-semibold text-foreground">
                    Available Flights
                  </h4>
                  <div className="space-y-2">
                    {flightResults.map((flight, idx) => (
                      <Card key={idx} className="overflow-hidden">
                        <CardContent className="flex items-center justify-between p-3 gap-2">
                          <div className="flex-1 gap-4">
                            <p className="font-medium text-foreground">
                              {flight.airline || "Airline"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {flight.departure || "--:--"} →{" "}
                              {flight.arrival || "--:--"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {flight.duration || "-"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-emerald-600">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: flight.currency || "USD",
                              }).format(flight.price || flight.fare || 0)}
                            </p>
                            <Button size="sm" className="mt-2">
                              Book
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
