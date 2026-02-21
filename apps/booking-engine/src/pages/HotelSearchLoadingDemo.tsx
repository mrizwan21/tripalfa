/**
 * Hotel Search Loading Demo Page
 * ===============================
 * Demo page to test the HotelSearchLoading component
 */

import React, { useState, useEffect } from 'react';
import { HotelSearchLoading } from './HotelSearchLoading';
import { CurrencyCode } from '../api/exchangeRateApi';

// ── Sample Destination Data ──────────────────────────────────────────────────

const SAMPLE_DESTINATIONS = {
  DUBAI: {
    name: 'Downtown Dubai',
    city: 'Dubai',
    country: 'United Arab Emirates',
    latitude: 25.2048,
    longitude: 55.2708,
    currency: 'AED' as CurrencyCode,
  },
  LONDON: {
    name: 'Westminster',
    city: 'London',
    country: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
    currency: 'GBP' as CurrencyCode,
  },
  NEWYORK: {
    name: 'Manhattan',
    city: 'New York',
    country: 'United States',
    latitude: 40.7831,
    longitude: -73.9712,
    currency: 'USD' as CurrencyCode,
  },
  PARIS: {
    name: 'Le Marais',
    city: 'Paris',
    country: 'France',
    latitude: 48.8566,
    longitude: 2.3522,
    currency: 'EUR' as CurrencyCode,
  },
  SINGAPORE: {
    name: 'Marina Bay',
    city: 'Singapore',
    country: 'Singapore',
    latitude: 1.3521,
    longitude: 103.8198,
    currency: 'SGD' as CurrencyCode,
  },
  SYDNEY: {
    name: 'Sydney CBD',
    city: 'Sydney',
    country: 'Australia',
    latitude: -33.8688,
    longitude: 151.2093,
    currency: 'AUD' as CurrencyCode,
  },
  TOKYO: {
    name: 'Shinjuku',
    city: 'Tokyo',
    country: 'Japan',
    latitude: 35.6762,
    longitude: 139.6503,
    currency: 'JPY' as CurrencyCode,
  },
  BANGKOK: {
    name: 'Sukhumvit',
    city: 'Bangkok',
    country: 'Thailand',
    latitude: 13.7563,
    longitude: 100.5018,
    currency: 'THB' as CurrencyCode,
  },
};

type DestinationKey = keyof typeof SAMPLE_DESTINATIONS;

// ── Demo Component ───────────────────────────────────────────────────────────

export function HotelSearchLoadingDemo(): React.JSX.Element {
  const [destinationKey, setDestinationKey] = useState<DestinationKey>('DUBAI');
  const [searchProgress, setSearchProgress] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  
  // User currency selector
  const [userCurrency, setUserCurrency] = useState<CurrencyCode>('USD');
  
  // Stay details
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);

  const destination = SAMPLE_DESTINATIONS[destinationKey];

  // Set default dates
  useEffect(() => {
    const today = new Date();
    const checkInDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const checkOutDate = new Date(checkInDate.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 nights
    
    setCheckIn(checkInDate.toISOString().split('T')[0]);
    setCheckOut(checkOutDate.toISOString().split('T')[0]);
  }, []);

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

  const destinationOptions = Object.keys(SAMPLE_DESTINATIONS) as DestinationKey[];
  const currencyOptions: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'AUD', 'JPY', 'SGD'];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Control Panel */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-white mb-4">
            Hotel Search Loading Demo
          </h1>
          
          <div className="flex flex-wrap gap-4 items-end">
            {/* Destination Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Destination
              </label>
              <select
                value={destinationKey}
                onChange={(e) => setDestinationKey(e.target.value as DestinationKey)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-amber-500"
              >
                {destinationOptions.map((key) => (
                  <option key={key} value={key}>
                    {SAMPLE_DESTINATIONS[key].city}, {SAMPLE_DESTINATIONS[key].country}
                  </option>
                ))}
              </select>
            </div>

            {/* User Currency Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Your Currency
              </label>
              <select
                value={userCurrency}
                onChange={(e) => setUserCurrency(e.target.value as CurrencyCode)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-amber-500"
              >
                {currencyOptions.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>

            {/* Check-in Date */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Check-in
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Check-out Date */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Check-out
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Guests */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Guests
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-amber-500"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Rooms */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Rooms
              </label>
              <select
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-amber-500"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
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
                  : 'bg-amber-500 hover:bg-amber-600'
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

      {/* Hotel Search Loading Component */}
      <HotelSearchLoading
        destination={destination}
        userCurrency={userCurrency}
        searchProgress={searchProgress}
        estimatedTime={30}
        checkIn={checkIn}
        checkOut={checkOut}
        guests={guests}
        rooms={rooms}
      />
    </div>
  );
}

export default HotelSearchLoadingDemo;
