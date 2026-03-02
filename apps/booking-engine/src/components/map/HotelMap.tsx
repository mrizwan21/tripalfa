/**
 * Hotel Map Component
 * ===================
 * A specialized map component for displaying hotel locations.
 * Uses Mapbox GL JS for interactive maps.
 */

import React from "react";
import { MapPin, Star, Navigation } from "lucide-react";
import { MapboxMap, calculateCenter, calculateZoom } from "./MapboxMap";
import { HotelMapMarker, MapCoordinates } from "../../lib/mapbox-config";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HotelMapProps {
  // Single hotel mode (for detail page)
  hotel?: {
    id: string;
    name: string;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
    rating?: number;
    starRating?: number;
    city?: string;
    country?: string;
  };

  // Multiple hotels mode (for list page)
  hotels?: Array<{
    id: string;
    name: string;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
    rating?: number;
    price?: number;
    currency?: string;
    image?: string;
  }>;

  // Map configuration
  height?: string;
  className?: string;

  // Callbacks
  onHotelClick?: (hotelId: string) => void;
  selectedHotelId?: string;

  // UI options
  showLocationCard?: boolean;
}

// ── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Convert hotel data to map markers
 */
function hotelsToMarkers(hotels: HotelMapProps["hotels"]): HotelMapMarker[] {
  return (hotels || [])
    .filter((h) => h.latitude != null && h.longitude != null)
    .map((h) => ({
      id: h.id,
      name: h.name,
      address: h.address,
      latitude: h.latitude!,
      longitude: h.longitude!,
      rating: h.rating,
      price: h.price,
      currency: h.currency,
      image: h.image,
    }));
}

/**
 * Get default coordinates from hotel city/country
 * This is a fallback when hotel doesn't have lat/lng
 */
function getDefaultCoordinates(
  city?: string,
  country?: string,
): MapCoordinates {
  // Default to Dubai
  return { longitude: 55.2708, latitude: 25.2048 };
}

// ── Hotel Location Card ───────────────────────────────────────────────────────

function HotelLocationCard({
  name,
  address,
  rating,
  starRating,
  onNavigate,
}: {
  name: string;
  address?: string;
  rating?: number;
  starRating?: number;
  onNavigate?: () => void;
}) {
  return (
    <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-80 bg-card rounded-2xl shadow-2xl p-6 z-10 border border-border">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 gap-2">
          <MapPin className="text-primary" size={24} />
        </div>
        <div className="flex-1 min-w-0 gap-4">
          <h3 className="font-bold text-foreground text-sm truncate text-xl font-semibold tracking-tight">
            {name}
          </h3>
          {address && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {address}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {starRating && (
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.round(starRating) }).map((_, i) => (
                  <Star
                    key={i}
                    size={10}
                    className="text-accent-foreground fill-accent-foreground"
                  />
                ))}
              </div>
            )}
            {rating && (
              <span className="text-xs font-bold text-muted-foreground">
                {rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {onNavigate && (
        <button
          onClick={onNavigate}
          className="mt-4 w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
        >
          <Navigation size={14} />
          Get Directions
        </button>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function HotelMap({
  hotel,
  hotels,
  height = "400px",
  className = "",
  onHotelClick,
  selectedHotelId,
  showLocationCard = true,
}: HotelMapProps): React.JSX.Element {
  // Determine mode: single hotel or multiple hotels
  const isSingleMode = !!hotel && !hotels;
  const isMultipleMode = !!hotels && hotels.length > 0;

  // Get markers for multiple hotels mode
  const markers = isMultipleMode ? hotelsToMarkers(hotels) : [];

  // Get center coordinates
  let center: MapCoordinates | undefined;
  let zoom = 14;

  if (isSingleMode && hotel) {
    if (hotel.latitude != null && hotel.longitude != null) {
      center = { latitude: hotel.latitude, longitude: hotel.longitude };
      zoom = 15;
    } else {
      center = getDefaultCoordinates(hotel.city, hotel.country);
      zoom = 12;
    }
  } else if (isMultipleMode && markers.length > 0) {
    center = calculateCenter(markers);
    zoom = calculateZoom(markers);
  }

  // Handle marker click
  const handleMarkerClick = (marker: HotelMapMarker) => {
    if (onHotelClick) {
      onHotelClick(marker.id);
    }
  };

  // Handle "Get Directions" click
  const handleGetDirections = () => {
    if (!hotel?.latitude || !hotel?.longitude) return;

    // Open in Google Maps
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hotel.latitude},${hotel.longitude}`;
    window.open(url, "_blank");
  };

  // No location data
  if (!center) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-2xl ${className}`}
        style={{ height }}
      >
        <div className="text-center p-8">
          <MapPin className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 font-bold">Location not available</p>
          <p className="text-gray-400 text-sm mt-2">
            Hotel coordinates not provided
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <MapboxMap
        mode="hotel"
        markers={markers}
        selectedMarkerId={selectedHotelId}
        onMarkerClick={handleMarkerClick}
        center={center}
        zoom={zoom}
        height={height}
        showControls={true}
        interactive={true}
      />

      {/* Location card for single hotel mode */}
      {isSingleMode && hotel && showLocationCard && (
        <HotelLocationCard
          name={hotel.name}
          address={hotel.address}
          rating={hotel.rating}
          starRating={hotel.starRating}
          onNavigate={handleGetDirections}
        />
      )}
    </div>
  );
}

export default HotelMap;
