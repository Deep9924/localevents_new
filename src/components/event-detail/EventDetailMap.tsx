"use client";
import { useState } from "react";
import { MapPin, Loader2, ExternalLink } from "lucide-react";
import { MapView } from "@/components/Map";

interface EventDetailMapProps {
  venue: string;
  cityName: string;
  cityLat: number;
  cityLng: number;
}

export function EventDetailMap({ venue, cityName, cityLat, cityLng }: EventDetailMapProps) {
  const [mapReady, setMapReady] = useState(false);

  const handleMapReady = (map: google.maps.Map) => {
    const center = { lat: cityLat, lng: cityLng };
    map.setCenter(center);
    map.setZoom(14);

    // Try to geocode the exact venue address first
    const geocoder = new google.maps.Geocoder();
    const query = `${venue}, ${cityName}`;

    geocoder.geocode({ address: query }, (results, status) => {
      const position =
        status === "OK" && results?.[0]?.geometry?.location
          ? results[0].geometry.location
          : center;

      map.setCenter(position);

      const marker = new google.maps.Marker({
        position,
        map,
        title: venue,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#4338CA",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2.5,
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family:'Sora',sans-serif;padding:4px 2px;max-width:180px">
            <div style="font-weight:700;color:#1e1b4b;font-size:13px;margin-bottom:3px">${venue}</div>
            <div style="color:#6b7280;font-size:11px">${cityName}</div>
          </div>
        `,
      });

      infoWindow.open(map, marker);
      marker.addListener("click", () => infoWindow.open(map, marker));

      setMapReady(true);
    });
  };

  return (
    <div>
      <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm h-56 relative">
        <MapView
          onMapReady={handleMapReady}
          initialCenter={{ lat: cityLat, lng: cityLng }}
          initialZoom={14}
          className="w-full h-56"
        />
        {!mapReady && (
          <div className="absolute inset-0 bg-indigo-50 flex items-center justify-center rounded-2xl">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-indigo-300 mx-auto mb-1.5 animate-spin" />
              <p className="text-indigo-400 text-xs">Loading map…</p>
            </div>
          </div>
        )}
      </div>
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue} ${cityName}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-2"
      >
        <MapPin className="w-3 h-3" />Open in Google Maps <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}