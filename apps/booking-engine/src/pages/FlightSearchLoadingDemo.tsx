/**
 * Flight Search Loading Demo Page
 * =================================
 * Demo page to test the FlightSearchLoading component
 */

import React, { useState, useEffect } from 'react';
import { FlightSearchLoading } from './FlightSearchLoading';
import { CurrencyCode } from '../api/exchangeRateApi';

// ── Sample Airport Data ──────────────────────────────────────────────────────

const SAMPLE_AIRPORTS = {
  DXB: {
    code: 'DXB',
    name: 'Dubai International Airport',
    city: 'Dubai',
    country: 'United Arab Emirates',
    latitude: 25.2532,
    longitude: 55.3657,
    currency: 'AED' as CurrencyCode,
  },
  LHR: {
    code: 'LHR',
    name: 'London Heathrow Airport',
    city: 'London',
    country: 'United Kingdom',
    latitude: 51.4700,
    longitude: -0.4543,
    currency: 'GBP' as CurrencyCode,
  },
  JFK: {
    code: 'JFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    country: 'United States',
    latitude: 40.6413,
    longitude: -73.7781,
    currency: 'USD' as CurrencyCode,
  },
  CDG: {
    code: 'CDG',
    name: 'Charles de Gaulle Airport',
    city: 'Paris',
    country: 'France',
    latitude: 49.0097,
    longitude: 2.5479,
    currency: 'EUR' as CurrencyCode,
  },
  SIN: {
    code: 'SIN',
    name: 'Singapore Changi Airport',
    city: 'Singapore',
    country: 'Singapore',
    latitude: 1.3644,
    longitude: 103.9915,
    currency: 'SGD' as CurrencyCode,
  },
  SYD: {
    code: 'SYD',
    name: 'Sydney Kingsford Smith Airport',
    city: 'Sydney',
    country: 'Australia',
    latitude: -33.9399,
    longitude: 151.1753,
    currency: 'AUD' as CurrencyCode,
  },
  TYO: {
    code: 'NRT',
    name: 'Narita International Airport',
    city: 'Tokyo',
    country: 'Japan',
    latitude: 35.7720,
    longitude: 140.3929,
    currency: 'JPY' as CurrencyCode,
  },
  DEL: {
    code: 'DEL',
    name: 'Indira Gandhi International Airport',
    city: 'Delhi',
    country: 'India',
    latitude: 28.5562,
    longitude: 77.1000,
    currency: 'INR' as CurrencyCode,
  },
};

type AirportCode = keyof typeof SAMPLE_AIRPORTS;

// ── Demo Component ───────────────────────────────────────────────────────────

export function FlightSearchLoadingDemo(): React.JSX.Element {
  const [originCode, setOriginCode] = useState<AirportCode>('DXB');
  const [destinationCode, setDestinationCode] = useState<AirportCode>('LHR');
  const [searchProgress, setSearchProgress] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const origin = SAMPLE_AIRPORTS[originCode];
  const destination = SAMPLE_AIRPORTS[destinationCode];

  // Simulate search progress
  useEffect(() => {
    if (isSearching) {
      setSearchProgress(0);
      const interval = setInterval(() => {
        setSearchProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsSearching(false);
            return 100;
          }
          return prev + Math.random() * 5;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isSearching]);

  const handleStartSearch = () => {
    setIsSearching(true);
    setSearchProgress(0);
  };

  const airportOptions = Object.keys(SAMPLE_AIRPORTS) as AirportCode[];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Control Panel */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-white mb-4">
            Flight Search Loading Demo
          </h1>
          
          <div className="flex flex-wrap gap-4 items-end">
            {/* Origin Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Origin
              </label>
              <select
                value={originCode}
                onChange={(e) => setOriginCode(e.target.value as AirportCode)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500"
              >
                {airportOptions.map((code) => (
                  <option key={code} value={code}>
                    {code} - {SAMPLE_AIRPORTS[code].city}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Destination
              </label>
              <select
                value={destinationCode}
                onChange={(e) => setDestinationCode(e.target.value as AirportCode)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500"
              >
                {airportOptions.map((code) => (
                  <option key={code} value={code}>
                    {code} - {SAMPLE_AIRPORTS[code].city}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartSearch}
              disabled={isSearching}
              className={`px-6 py-2 rounded-lg font-bold text-white transition-all ${
                isSearching
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isSearching ? 'Searching...' : 'Start Search Simulation'}
            </button>

            {/* Progress indicator */}
            {isSearching && (
              <div className="text-sm text-gray-400">
                Progress: {Math.round(searchProgress)}%
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Flight Search Loading Component */}
      <FlightSearchLoading
        origin={origin}
        destination={destination}
        searchProgress={searchProgress}
        estimatedTime={30}
      />
    </div>
  );
}

export default FlightSearchLoadingDemo;
