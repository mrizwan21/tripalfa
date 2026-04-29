import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Import shared components from ../index
import { FlightSearchStep, FlightResultsStep } from '../index';

interface FlightOption {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  departure: {
    airport: string;
    airportCode: string;
    time: string;
    date: string;
  };
  arrival: {
    airport: string;
    airportCode: string;
    time: string;
    date: string;
  };
  duration: string;
  stops: number;
  price: {
    total: number;
    currency: string;
    breakdown: {
      base: number;
      tax: number;
      markup: number;
    };
  };
  cabinClass: string;
  amenities: string[];
  isRefundable: boolean;
  baggage: {
    carryOn: boolean;
    checked: number;
  };
}

const FLIGHTS: FlightOption[] = [
{
  id: 'FL001',
  airline: 'Gulf Air',
    airlineCode: 'GF',
    flightNumber: 'GF 123',
    departure: {
      airport: 'Bahrain International Airport',
      airportCode: 'BAH',
      time: '08:00',
      date: '2026-04-27'
    },
    arrival: {
      airport: 'Dubai International Airport',
      airportCode: 'DXB',
      time: '10:30',
      date: '2026-04-27'
    },
    duration: '2h 30m',
    stops: 0,
    price: {
      total: 450,
      currency: 'BHD',
      breakdown: {
        base: 380,
        tax: 50,
        markup: 20
      }
    },
    cabinClass: 'Economy',
    amenities: ['WiFi', 'Meal', 'Baggage'],
    isRefundable: true,
    baggage: {
      carryOn: true,
      checked: 1
    }
  },
  {
    id: 'FL002',
    airline: 'Emirates',
    airlineCode: 'EK',
    flightNumber: 'EK 456',
    departure: {
      airport: 'Bahrain International Airport',
      airportCode: 'BAH',
      time: '14:00',
      date: '2026-04-27'
    },
    arrival: {
      airport: 'Dubai International Airport',
      airportCode: 'DXB',
      time: '16:30',
      date: '2026-04-27'
    },
    duration: '2h 30m',
    stops: 0,
    price: {
      total: 520,
      currency: 'BHD',
      breakdown: {
        base: 440,
        tax: 60,
        markup: 20
      }
    },
    cabinClass: 'Business',
    amenities: ['WiFi', 'Meal', 'Baggage', 'Lounge Access'],
    isRefundable: true,
    baggage: {
      carryOn: true,
      checked: 2
    }
  }
];

export default function FlightFlowPage() {
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState<FlightOption[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [tenant] = useState({ currency: 'BHD' });

  const handleSearch = (searchData: any) => {
    console.log('Flight search:', searchData);
    // In a real app, this would call an API
    setSearchResults(FLIGHTS);
    setShowResults(true);
  };

  const handleFlightSelect = (flight: FlightOption) => {
    setSelectedFlight(flight.id);
    // Navigate to passenger details or confirmation
    navigate('/flight/passenger');
  };

  return (
    <div className="min-h-screen bg-near-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Flight Booking</h1>
        
        {/* Shared Flight Search Step */}
        <div className="mb-8">
          <FlightSearchStep
            tenant={tenant}
            onSearch={handleSearch}
            bookingContext="direct"
          />
        </div>

        {/* Shared Flight Results Step */}
        {showResults && (
          <div className="mt-8">
            <FlightResultsStep
              results={searchResults}
              currency={tenant.currency}
              showNett={true}
              selectedFlight={selectedFlight}
              onSelect={handleFlightSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
}