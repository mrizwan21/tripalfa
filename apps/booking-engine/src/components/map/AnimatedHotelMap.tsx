/**
 * Animated Hotel Map Component
 * =============================
 * A map component that shows an animated hotel search with:
 * - Pulsing destination marker
 * - Animated hotel markers appearing around the destination
 * - Search radius visualization
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  MAPBOX_TOKEN,
  MAPBOX_STYLES,
  MARKER_COLORS,
  MapCoordinates,
} from "../../lib/mapbox-config";

// Set Mapbox access token
mapboxgl.accessToken = MAPBOX_TOKEN;

// ── Types ─────────────────────────────────────────────────────────────────────

interface HotelLocation extends MapCoordinates {
  id: string;
  name: string;
  price?: number;
  rating?: number;
  image?: string;
}

interface AnimatedHotelMapProps {
  destination: MapCoordinates & {
    name: string;
    city: string;
    country: string;
    currency: string;
  };

  // Hotels to animate
  hotels?: HotelLocation[];

  // Animation options
  animationDuration?: number; // in milliseconds
  showSearchRadius?: boolean;
  searchRadiusKm?: number;

  // Map options
  className?: string;
  height?: string;

  // Callbacks
  onHotelClick?: (hotel: HotelLocation) => void;
}

// ── Hotel Marker SVG ─────────────────────────────────────────────────────────

const HOTEL_SVG = (color: string = MARKER_COLORS.hotel) => `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}">
  <path d="M18.5 3H6c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-2h2v2zm0-4H7v-2h2v2zm0-4H7V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
</svg>
`;

// ── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Generate random hotel locations around a center point
 */
function generateRandomHotels(
  center: MapCoordinates,
  count: number = 8,
  radiusKm: number = 5,
): HotelLocation[] {
  const hotels: HotelLocation[] = [];
  const hotelNames = [
    "Grand Plaza Hotel",
    "Sunset Resort",
    "City Center Inn",
    "Luxury Suites",
    "Boutique Hotel",
    "Riverside Lodge",
    "Mountain View Hotel",
    "Beachfront Resort",
    "Downtown Hotel",
    "Garden Inn",
    "Palace Hotel",
    "Oriental Suites",
  ];

  for (let i = 0; i < count; i++) {
    // Random angle and distance
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const distance = radiusKm * (0.3 + Math.random() * 0.7);

    // Convert km to degrees (approximate)
    const latOffset = (distance / 110.574) * Math.cos(angle);
    const lngOffset =
      (distance / (111.32 * Math.cos((center.latitude * Math.PI) / 180))) *
      Math.sin(angle);

    hotels.push({
      id: `hotel-${i}`,
      name: hotelNames[i % hotelNames.length],
      latitude: center.latitude + latOffset,
      longitude: center.longitude + lngOffset,
      price: Math.round(80 + Math.random() * 300),
      rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
    });
  }

  return hotels;
}

// ── Main Component ───────────────────────────────────────────────────────────

function AnimatedHotelMap({
  destination,
  hotels: propHotels,
  animationDuration = 3000,
  showSearchRadius = true,
  searchRadiusKm = 5,
  className = "",
  height = "500px",
  onHotelClick,
}: AnimatedHotelMapProps): React.JSX.Element {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const hotelMarkers = useRef<mapboxgl.Marker[]>([]);
  const animationFrame = useRef<number | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleHotels, setVisibleHotels] = useState<number>(0);

  // Generate hotels if not provided
  const hotels =
    propHotels || generateRandomHotels(destination, 8, searchRadiusKm);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAPBOX_STYLES.dark,
        center: [destination.longitude, destination.latitude],
        zoom: 12,
        interactive: false, // Disable interactions during loading
      });

      map.current.on("load", () => {
        setMapLoaded(true);
      });

      map.current.on("error", (e) => {
        console.error("Mapbox error:", e);
        setError("Failed to load map");
      });
    } catch (err) {
      console.error("Failed to initialize map:", err);
      setError("Failed to initialize map");
    }

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      hotelMarkers.current.forEach((marker) => marker.remove());
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add markers and animations
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // ── Add destination marker with pulse animation ───────────────────────────
    const destEl = document.createElement("div");
    destEl.innerHTML = `
      <div class="destination-marker">
        <div class="pulse-ring"></div>
        <div class="marker-content">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      </div>
      <style>
        .destination-marker {
          position: relative;
          width: 48px;
          height: 48px;
        }
        .pulse-ring {
          position: absolute;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: ${MARKER_COLORS.destination}44;
          animation: pulse 2s ease-out infinite;
        }
        .marker-content {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 36px;
          height: 36px;
          background: ${MARKER_COLORS.destination};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px ${MARKER_COLORS.destination}66;
          border: 3px solid white;
        }
        @keyframes pulse {
          0% {
            transform: scale(0.5);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      </style>
    `;

    new mapboxgl.Marker(destEl, { anchor: "center" })
      .setLngLat([destination.longitude, destination.latitude])
      .addTo(map.current);

    // ── Add search radius circle ─────────────────────────────────────────────
    if (showSearchRadius) {
      const radiusGeojson = createCircleGeojson(
        [destination.longitude, destination.latitude],
        searchRadiusKm,
      );

      map.current.addSource("search-radius", {
        type: "geojson",
        data: radiusGeojson,
      });

      map.current.addLayer({
        id: "search-radius-fill",
        type: "fill",
        source: "search-radius",
        paint: {
          "fill-color": MARKER_COLORS.hotel,
          "fill-opacity": 0.1,
        },
      });

      map.current.addLayer({
        id: "search-radius-line",
        type: "line",
        source: "search-radius",
        paint: {
          "line-color": MARKER_COLORS.hotel,
          "line-width": 2,
          "line-dasharray": [4, 4],
          "line-opacity": 0.5,
        },
      });
    }

    // ── Animate hotels appearing one by one ───────────────────────────────────
    const hotelDelay = animationDuration / hotels.length;

    hotels.forEach((hotel, index) => {
      setTimeout(() => {
        if (!map.current) return;

        const hotelEl = document.createElement("div");
        hotelEl.style.cssText = `
          opacity: 0;
          transform: scale(0);
          transition: all 0.3s ease-out;
        `;
        hotelEl.innerHTML = `
          <div style="
            background: white;
            border-radius: 12px;
            padding: 8px 12px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.3);
            display: flex;
            flex-direction: column;
            align-items: center;
            min-width: 60px;
          ">
            <span style="
              font-size: 14px;
              font-weight: 800;
              color: ${MARKER_COLORS.hotel};
            ">$${hotel.price || "---"}</span>
            ${
              hotel.rating
                ? `
              <span style="
                font-size: 10px;
                color: hsl(var(--muted-foreground));
              ">★ ${hotel.rating}</span>
            `
                : ""
            }
          </div>
        `;

        const marker = new mapboxgl.Marker(hotelEl, { anchor: "bottom" })
          .setLngLat([hotel.longitude, hotel.latitude])
          .addTo(map.current);

        hotelMarkers.current.push(marker);

        // Animate in
        requestAnimationFrame(() => {
          hotelEl.style.opacity = "1";
          hotelEl.style.transform = "scale(1)";
        });

        setVisibleHotels((prev) => prev + 1);

        // Add click handler
        if (onHotelClick) {
          hotelEl.style.cursor = "pointer";
          hotelEl.addEventListener("click", () => onHotelClick(hotel));
        }
      }, index * hotelDelay);
    });
  }, [
    mapLoaded,
    destination,
    hotels,
    animationDuration,
    showSearchRadius,
    searchRadiusKm,
    onHotelClick,
  ]);

  // ── Render ───────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-foreground rounded-2xl ${className}`}
        style={{ height }}
      >
        <div className="text-center p-8">
          <p className="text-muted-foreground font-bold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{ height }}
    >
      {/* Map container */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* Loading overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-foreground gap-2">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-accent-foreground border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-muted-foreground font-bold text-sm">
              Loading map...
            </p>
          </div>
        </div>
      )}

      {/* Destination info overlay */}
      <div className="absolute top-6 left-6 bg-foreground/80 backdrop-blur-md rounded-2xl p-4 z-10 border border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="white"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-black text-white">{destination.city}</p>
            <p className="text-xs text-muted-foreground">
              {destination.country}
            </p>
          </div>
        </div>
      </div>

      {/* Hotels found counter */}
      <div className="absolute top-6 right-6 bg-foreground/80 backdrop-blur-md rounded-2xl px-4 py-3 z-10 border border-border/40">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-white font-bold">{visibleHotels}</span>
          <span className="text-muted-foreground text-sm">hotels found</span>
        </div>
      </div>

      {/* Mapbox attribution */}
      <div className="absolute bottom-1 left-1 text-[10px] text-muted-foreground bg-black/50 px-1 rounded">
        © Mapbox © OpenStreetMap
      </div>
    </div>
  );
}

// ── Helper: Create circle GeoJSON ────────────────────────────────────────────

function createCircleGeojson(
  center: [number, number],
  radiusKm: number,
): GeoJSON.GeoJSON {
  const points = 64;
  const coords: [number, number][] = [];

  for (let i = 0; i < points; i++) {
    const angle = (2 * Math.PI * i) / points;
    const latOffset = (radiusKm / 110.574) * Math.cos(angle);
    const lngOffset =
      (radiusKm / (111.32 * Math.cos((center[1] * Math.PI) / 180))) *
      Math.sin(angle);
    coords.push([center[0] + lngOffset, center[1] + latOffset]);
  }
  coords.push(coords[0]); // Close the polygon

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
  };
}

export default AnimatedHotelMap;
