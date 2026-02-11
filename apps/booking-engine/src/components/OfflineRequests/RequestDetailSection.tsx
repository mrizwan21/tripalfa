import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CalendarDays,
  MapPin,
  Plane,
  Users,
  Armchair,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { OfflineChangeRequest } from '@tripalfa/shared-types';

interface RequestDetailSectionProps {
  request: OfflineChangeRequest;
}

interface FlightDetail {
  airline: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  duration: string;
  aircraft: string;
}

export const RequestDetailSection = ({ request }: RequestDetailSectionProps) => {
  const renderFlightDetails = (flights: FlightDetail[] | undefined) => {
    if (!flights || flights.length === 0) {
      return <p className="text-gray-600 text-sm">Flight details not available</p>;
    }

    return (
      <div className="space-y-3">
        {flights.map((flight, idx) => (
          <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-900">
                  {flight.airline} {flight.flightNumber}
                </p>
                <p className="text-xs text-gray-600">{flight.aircraft}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-gray-600 text-xs">Departure</p>
                <p className="font-medium text-gray-900">{flight.departure}</p>
              </div>
              <div className="text-center flex flex-col justify-end pb-0.5">
                <p className="text-gray-600 text-xs">{flight.duration}</p>
                <Plane className="w-4 h-4 text-gray-600 mx-auto" />
              </div>
              <div className="text-right">
                <p className="text-gray-600 text-xs">Arrival</p>
                <p className="font-medium text-gray-900">{flight.arrival}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPassengers = (passengers: string[] | undefined) => {
    if (!passengers || passengers.length === 0) {
      return <p className="text-gray-600 text-sm">No passenger details</p>;
    }

    return (
      <div className="space-y-2">
        {passengers.map((passenger, idx) => (
          <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-900">{passenger}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderPricingComparison = (
    original: Record<string, number> | undefined,
    proposed: Record<string, number> | undefined
  ) => {
    const pricingItems = ['baseFare', 'taxes', 'fees', 'surcharge'] as const;

    return (
      <div className="space-y-2">
        {pricingItems.map((item) => {
          const origValue = original?.[`${item}`] || 0;
          const propValue = proposed?.[`new${item.charAt(0).toUpperCase()}${item.slice(1)}`] || 0;
          const diff = propValue - origValue;

          return (
            <div key={item} className="flex items-center justify-between text-sm">
              <span className="text-gray-600 capitalize">{item}</span>
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-900 w-16 text-right">
                  ${origValue.toFixed(2)}
                </span>
                <span className="text-gray-400">→</span>
                <span className={`font-medium w-16 text-right ${
                  diff > 0 ? 'text-red-600' : diff < 0 ? 'text-green-600' : 'text-gray-900'
                }`}>
                  ${propValue.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}

        {/* Total */}
        <div className="flex items-center justify-between text-sm border-t pt-2 mt-2 font-semibold">
          <span>Total</span>
          <div className="flex items-center gap-3">
            <span className="text-gray-900 w-16 text-right">
              ${(original?.baseFare || 0 + (original?.taxes || 0) + (original?.fees || 0))?.toFixed(2)}
            </span>
            <span className="text-gray-400">→</span>
            <span className="text-gray-900 w-16 text-right">
              ${(proposed?.newBaseFare || 0 + (proposed?.newTaxes || 0) + (proposed?.newFees || 0))?.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Booking & Request Details</CardTitle>
        <CardDescription>Compare original booking with requested changes</CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="flights">Flights</TabsTrigger>
            <TabsTrigger value="passengers">Passengers</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Original Booking */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  Original Booking
                </h3>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CalendarDays className="w-4 h-4 text-gray-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-gray-600">Departure Date</p>
                      <p className="font-medium text-gray-900">
                        {request.originalBooking?.departureDate
                          ? new Date(request.originalBooking.departureDate).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-gray-600">Route</p>
                      <p className="font-medium text-gray-900">{request.originalBooking?.route || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-gray-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-gray-600">Passengers</p>
                      <p className="font-medium text-gray-900">{request.originalBooking?.passengers || 0}</p>
                    </div>
                  </div>

                  {request.originalBooking?.cabin && (
                    <div className="flex items-start gap-2">
                      <Armchair className="w-4 h-4 text-gray-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="text-gray-600">Cabin Class</p>
                        <p className="font-medium text-gray-900 capitalize">
                          {request.originalBooking.cabin}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <DollarSign className="w-4 h-4 text-gray-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-gray-600">Total Price</p>
                      <p className="font-medium text-gray-900 text-lg">
                        ${request.originalBooking?.totalPrice?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requested Changes */}
              {request.requestedChanges && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    Requested Changes
                  </h3>

                  <div className="space-y-2">
                    {request.requestedChanges.newDepartureDate && (
                      <div className="flex items-start gap-2">
                        <CalendarDays className="w-4 h-4 text-gray-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="text-gray-600">New Departure Date</p>
                          <p className="font-medium text-gray-900">
                            {new Date(request.requestedChanges.newDepartureDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {request.requestedChanges.newRoute && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="text-gray-600">New Route</p>
                          <p className="font-medium text-gray-900">{request.requestedChanges.newRoute}</p>
                        </div>
                      </div>
                    )}

                    {request.requestedChanges.reason && (
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-gray-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="text-gray-600">Reason for Change</p>
                          <p className="font-medium text-gray-900">{request.requestedChanges.reason}</p>
                        </div>
                      </div>
                    )}

                    {request.requestedChanges.newTotalPrice && (
                      <div className="flex items-start gap-2">
                        <DollarSign className="w-4 h-4 text-gray-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="text-gray-600">Proposed New Price</p>
                          <p className="font-medium text-gray-900 text-lg">
                            ${request.requestedChanges.newTotalPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Flights Tab */}
          <TabsContent value="flights" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Original Flights</h3>
                {renderFlightDetails(request.originalBooking?.flights as FlightDetail[])}
              </div>

              {request.requestedChanges?.newFlights && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Proposed Flights</h3>
                  {renderFlightDetails(request.requestedChanges.newFlights as FlightDetail[])}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Passengers Tab */}
          <TabsContent value="passengers" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Original Passengers</h3>
                {renderPassengers(request.originalBooking?.passengerNames as string[])}
              </div>

              {request.requestedChanges?.newPassengers && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Proposed Passengers</h3>
                  {renderPassengers(request.requestedChanges.newPassengers as string[])}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-3">Original Pricing</h3>
                {renderPricingComparison(
                  request.originalBooking as Record<string, number>,
                  undefined
                )}
              </div>

              {request.requestedChanges && (
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Proposed Pricing</h3>
                  {renderPricingComparison(
                    request.originalBooking as Record<string, number>,
                    request.requestedChanges as Record<string, number>
                  )}
                </div>
              )}
            </div>

            {/* Price Impact Summary */}
            {request.requestedChanges?.newTotalPrice && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Price Impact Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Original Total</span>
                    <span className="font-medium text-gray-900">
                      ${request.originalBooking?.totalPrice?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-2">
                    <span className="text-gray-900">New Total</span>
                    <span className="text-gray-900">
                      ${request.requestedChanges.newTotalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className={`flex justify-between text-sm font-semibold p-2 rounded text-center ${
                    request.requestedChanges.newTotalPrice - (request.originalBooking?.totalPrice || 0) < 0
                      ? 'bg-green-100 text-green-700'
                      : request.requestedChanges.newTotalPrice - (request.originalBooking?.totalPrice || 0) > 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                  }`}>
                    <span>Difference</span>
                    <span>
                      {request.requestedChanges.newTotalPrice - (request.originalBooking?.totalPrice || 0) > 0
                        ? '+'
                        : ''}
                      ${(request.requestedChanges.newTotalPrice - (request.originalBooking?.totalPrice || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
