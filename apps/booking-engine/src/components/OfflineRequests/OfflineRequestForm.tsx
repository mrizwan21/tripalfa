import React, { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "../ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2, ChevronRight } from "lucide-react";
import {
  OfflineChangeRequest,
  CreateOfflineRequestPayload,
} from "@tripalfa/shared-types";
import offlineRequestApi from "@/api/offlineRequestApi";
import flightApi from "@/api/flightApi";
import hotelApi from "@/api/hotelApi";

interface OfflineRequestFormProps {
  bookingId: string;
  bookingRef: string;
  bookingType: "flight" | "hotel";
  originalDetails: any;
  onSuccess?: (request: OfflineChangeRequest) => void;
  onCancel?: () => void;
}

interface FlightSearchParams {
  departureDate: string;
  departureAirport: string;
  arrivalAirport: string;
  passengers: number;
  returnDate?: string;
}

interface SearchResults {
  flights?: any[];
  hotels?: any[];
}

export const OfflineRequestForm: React.FC<OfflineRequestFormProps> = ({
  bookingId,
  bookingRef,
  bookingType,
  originalDetails,
  onSuccess,
  onCancel,
}) => {
  const [changeReason, setChangeReason] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchParams, setSearchParams] = useState<FlightSearchParams | null>(
    null,
  );
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<SearchResults>({});
  const [showSearch, setShowSearch] = useState(false);

  // Fetch available flights/hotels
  const searchQuery = useQuery({
    queryKey: ["offline-search", searchParams],
    queryFn: async () => {
      if (!searchParams) return null;

      if (bookingType === "flight") {
        return await flightApi.search(searchParams);
      } else {
        return await hotelApi.search({
          location: originalDetails.location,
          checkInDate: selectedDate,
          checkOutDate: originalDetails.checkOutDate,
          guests: originalDetails.guests,
        });
      }
    },
    enabled: !!searchParams,
  });

  // Create offline request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (payload: CreateOfflineRequestPayload) => {
      return await offlineRequestApi.createRequest(payload);
    },
    onSuccess: (data) => {
      onSuccess?.(data);
    },
  });

  const handleSearch = useCallback(() => {
    if (!selectedDate) {
      alert("Please select a date");
      return;
    }

    if (bookingType === "flight") {
      const params: FlightSearchParams = {
        departureDate: selectedDate,
        departureAirport: originalDetails.departure.airport,
        arrivalAirport: originalDetails.arrival.airport,
        passengers: originalDetails.passengers,
        returnDate: originalDetails.returnDate,
      };
      setSearchParams(params);
    } else {
      setSearchParams({ departureDate: selectedDate } as any);
    }
    setShowSearch(true);
  }, [selectedDate, bookingType, originalDetails]);

  const handleSelectOption = useCallback((option: any) => {
    setSelectedOption(option);
  }, []);

  const handleSubmit = async () => {
    if (!changeReason.trim()) {
      alert("Please provide a reason for the change");
      return;
    }

    if (!selectedOption) {
      alert("Please select a new flight or hotel");
      return;
    }

    const payload: CreateOfflineRequestPayload = {
      bookingId,
      bookingRef,
      requestType:
        bookingType === "flight" ? "schedule_change" : "booking_modification",
      requestedChanges: {
        newItinerary: selectedOption,
        changeReason,
        originalDetails,
      },
    };

    createRequestMutation.mutate(payload);
  };

  const formatPrice = (price: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(price);
  };

  const getOriginalPrice = () => {
    if (bookingType === "flight") {
      return originalDetails.pricing?.totalPrice || 0;
    } else {
      return originalDetails.pricing?.totalPrice || 0;
    }
  };

  const renderFlightDetails = (flight: any, isOriginal: boolean = false) => (
    <Card className={isOriginal ? "border-gray-300" : "border-blue-400"}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4 gap-4">
          <h3 className="text-lg font-semibold">
            {isOriginal ? "Original Flight" : "Selected Flight"}
          </h3>
          {!isOriginal && <Badge variant="default">SELECTED</Badge>}
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-center flex-1 gap-4">
              <div className="text-3xl font-bold text-indigo-700">
                {flight.departure?.airport}
              </div>
              <div className="text-sm text-gray-600">
                {flight.departure?.city}
              </div>
              <div className="text-sm font-medium mt-2">
                {new Date(flight.departure?.time).toLocaleTimeString()}
              </div>
            </div>

            <div className="flex-1 text-center gap-4">
              <ChevronRight className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <div className="text-sm text-gray-600">
                {flight.duration &&
                  `${Math.floor(flight.duration / 60)}h ${flight.duration % 60}m`}
              </div>
            </div>

            <div className="text-center flex-1 gap-4">
              <div className="text-3xl font-bold text-indigo-700">
                {flight.arrival?.airport}
              </div>
              <div className="text-sm text-gray-600">
                {flight.arrival?.city}
              </div>
              <div className="text-sm font-medium mt-2">
                {new Date(flight.arrival?.time).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <div className="text-xs text-gray-600">Airline</div>
            <div className="font-semibold">
              {flight.airline} • {flight.flightNumber}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Class</div>
            <div className="font-semibold">{flight.cabin || "Economy"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Passengers</div>
            <div className="font-semibold">{flight.passengers} Adults</div>
          </div>
        </div>

        {!isOriginal && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs text-gray-600">Price</div>
            <div className="text-2xl font-bold text-indigo-700">
              {formatPrice(flight.price || selectedOption.price)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderHotelDetails = (hotel: any, isOriginal: boolean = false) => (
    <Card className={isOriginal ? "border-gray-300" : "border-blue-400"}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4 gap-4">
          <h3 className="text-lg font-semibold">
            {isOriginal ? "Original Hotel" : "Selected Hotel"}
          </h3>
          {!isOriginal && <Badge variant="default">SELECTED</Badge>}
        </div>

        <div className="mb-4">
          <h4 className="text-xl font-bold mb-2">
            {hotel.name || isOriginal ? originalDetails.name : hotel.name}
          </h4>
          <p className="text-sm text-gray-600 mb-2">
            📍 {hotel.location || originalDetails.location}
          </p>
          <div className="flex gap-2 mb-3">
            <Badge variant="outline">
              ★ {hotel.rating || originalDetails.rating}
            </Badge>
            <Badge variant="outline">
              {hotel.roomType || originalDetails.roomType}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <div className="text-xs text-gray-600">Check-in</div>
            <div className="font-semibold">
              {selectedDate || originalDetails.checkInDate}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Check-out</div>
            <div className="font-semibold">{originalDetails.checkOutDate}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Guests</div>
            <div className="font-semibold">
              {hotel.guests || originalDetails.guests}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Nights</div>
            <div className="font-semibold">
              {Math.ceil(
                (new Date(originalDetails.checkOutDate).getTime() -
                  new Date(
                    selectedDate || originalDetails.checkInDate,
                  ).getTime()) /
                  (1000 * 60 * 60 * 24),
              )}{" "}
              nights
            </div>
          </div>
        </div>

        {!isOriginal && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs text-gray-600">Price per Night</div>
            <div className="text-2xl font-bold text-indigo-700">
              {formatPrice(hotel.pricePerNight || selectedOption.pricePerNight)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Original Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            Current {bookingType === "flight" ? "Flight" : "Hotel"} Details
          </CardTitle>
          <CardDescription>Booking Reference: {bookingRef}</CardDescription>
        </CardHeader>
        <CardContent>
          {bookingType === "flight"
            ? renderFlightDetails(originalDetails, true)
            : renderHotelDetails(originalDetails, true)}

          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <strong>Original Paid Amount:</strong>{" "}
              {formatPrice(getOriginalPrice())}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* New Selection */}
      <Card>
        <CardHeader>
          <CardTitle>
            Select New {bookingType === "flight" ? "Flight" : "Hotel"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              New {bookingType === "flight" ? "Departure" : "Check-in"} Date
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full"
            />
          </div>

          <Button
            onClick={handleSearch}
            disabled={searchQuery.isLoading}
            className="w-full"
          >
            {searchQuery.isLoading && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Search Available Options
          </Button>

          {searchQuery.error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5 gap-4" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  Search Failed
                </p>
                <p className="text-sm text-red-700">
                  {searchQuery.error instanceof Error
                    ? searchQuery.error.message
                    : "Unknown error"}
                </p>
              </div>
            </div>
          )}

          {showSearch && searchQuery.data && (
            <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
              {bookingType === "flight" && searchQuery.data.flights ? (
                searchQuery.data.flights.map((flight: any) => (
                  <div
                    key={flight.id}
                    onClick={() => handleSelectOption(flight)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                      selectedOption?.id === flight.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-semibold">
                          {flight.departure?.airport} →{" "}
                          {flight.arrival?.airport}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(flight.departure?.time).toLocaleString()} -{" "}
                          {flight.airline} {flight.flightNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-indigo-700">
                          {formatPrice(flight.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : searchQuery.data.hotels ? (
                searchQuery.data.hotels.map((hotel: any) => (
                  <div
                    key={hotel.id}
                    onClick={() => handleSelectOption(hotel)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                      selectedOption?.id === hotel.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-semibold">{hotel.name}</p>
                        <p className="text-sm text-gray-600">
                          ★ {hotel.rating} • {hotel.roomType}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-indigo-700">
                          {formatPrice(hotel.pricePerNight)}/night
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600">No results found</p>
              )}
            </div>
          )}

          {selectedOption &&
            (bookingType === "flight"
              ? renderFlightDetails(selectedOption)
              : renderHotelDetails(selectedOption))}
        </CardContent>
      </Card>

      {/* Reason for Change */}
      <Card>
        <CardHeader>
          <CardTitle>Reason for Change</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="block text-sm font-medium mb-2">
            Please explain why you need to make this change
          </label>
          <Textarea
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            placeholder="e.g., Change in travel plans, medical emergency, schedule conflict, etc."
            className="w-full min-h-20"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 gap-4"
          disabled={createRequestMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            !changeReason.trim() ||
            !selectedOption ||
            createRequestMutation.isPending
          }
          className="flex-1 hover: gap-4"
        >
          {createRequestMutation.isPending && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          Submit Change Request
        </Button>
      </div>

      {createRequestMutation.error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5 gap-4" />
          <div>
            <p className="text-sm font-medium text-red-900">
              Error Submitting Request
            </p>
            <p className="text-sm text-red-700">
              {createRequestMutation.error instanceof Error
                ? createRequestMutation.error.message
                : "An unexpected error occurred"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
