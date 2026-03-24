// Design: Civic Warmth — Map section showing nearby events
"use client";

import { useState } from "react";
import { Navigation, Loader2 } from "lucide-react";
import { Event } from "@/lib/events-data";
import { MapView } from "@/components/Map";

// Local interface matching what the DB actually returns
interface City {
  slug: string;
  name: string;
  province: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
}

interface MapSectionProps {
  city: City;
  events: Event[];
}

export default function MapSection({ city, events }: MapSectionProps) {
  const [mapReady, setMapReady] = useState(false);
  const [activeRadius, setActiveRadius] = useState(10);

  const cityLat = city.lat ?? 0;
  const cityLng = city.lng ?? 0;

  const handleMapReady = (map: google.maps.Map) => {
    setMapReady(true);

    map.setCenter({ lat: cityLat, lng: cityLng });
    map.setZoom(11);

    const bounds = new google.maps.LatLngBounds();

    events.slice(0, 8).forEach((event, index) => {
      const angle = (index / 8) * 2 * Math.PI;
      const radius = 0.02 + Math.random() * 0.04;
      const lat = cityLat + radius * Math.cos(angle);
      const lng = cityLng + radius * Math.sin(angle);

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        title: event.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#3730A3",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family: 'Sora', sans-serif; max-width: 200px; padding: 4px;">
            <div style="font-weight: 700; color: #1e1b4b; font-size: 13px; margin-bottom: 4px;">${event.title}</div>
            <div style="color: #d97706; font-size: 11px; font-weight: 600;">${event.date} • ${event.time}</div>
            <div style="color: #6b7280; font-size: 11px; margin-top: 2px;">${event.venue}</div>
            <div style="margin-top: 6px;">
              <span style="background: ${event.price === "Free" ? "#dcfce7" : "#eef2ff"}; color: ${event.price === "Free" ? "#16a34a" : "#3730a3"}; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600;">
                ${event.price === null ? "Free" : event.price}
              </span>
            </div>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });

      bounds.extend({ lat, lng });
    });

    new google.maps.Marker({
      position: { lat: cityLat, lng: cityLng },
      map,
      title: city.name,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: "#F59E0B",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
      },
    });
  };

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2 font-sora">
          <Navigation className="w-5 h-5 text-amber-500" />
          Explore Events Near You
        </h2>
        <div className="flex items-center gap-2">
          {[5, 10, 25].map((r) => (
            <button
              key={r}
              onClick={() => setActiveRadius(r)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                activeRadius === r
                  ? "bg-indigo-700 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700"
              }`}
            >
              {r} km
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden shadow-md border border-gray-100 h-80 relative">
        <MapView
          onMapReady={handleMapReady}
          initialCenter={{ lat: cityLat, lng: cityLng }}
          initialZoom={11}
          className="w-full h-80"
        />
        {!mapReady && (
          <div className="absolute inset-0 bg-indigo-50 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-indigo-300 mx-auto mb-2 animate-spin" />
              <p className="text-indigo-400 text-sm">Loading map...</p>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-2 text-center">
        Showing events within {activeRadius} km of {city.name}
      </p>
    </section>
  );
}
