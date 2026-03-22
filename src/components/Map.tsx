"use client";

import { useEffect, useRef } from "react";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: typeof google;
  }
}

const API_KEY = process.env.NEXT_PUBLIC_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL =
  process.env.NEXT_PUBLIC_FRONTEND_FORGE_API_URL ||
  "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

function loadMapScript() {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => { resolve(); script.remove(); };
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });
}

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 43.6532, lng: -79.3832 },
  initialZoom = 12,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);

  const init = usePersistFn(async () => {
    if (!API_KEY) return; // skip silently, fallback UI handles it
    try {
      await loadMapScript();
      if (!mapContainer.current) return;
      map.current = new window.google!.maps.Map(mapContainer.current, {
        zoom: initialZoom,
        center: initialCenter,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: true,
        streetViewControl: true,
        mapId: "DEMO_MAP_ID",
      });
      if (onMapReady) onMapReady(map.current);
    } catch (error) {
      console.error(error);
    }
  });

  useEffect(() => {
    init();
  }, [init]);

  // Guard is AFTER hooks — safe to early return here
  if (!API_KEY) {
    return (
      <div className={cn("w-full h-full bg-gray-100 flex flex-col items-center justify-center gap-2 rounded-lg", className)}>
        <span className="text-2xl">🗺️</span>
        <p className="text-sm text-gray-500">Map unavailable</p>
        <p className="text-xs text-gray-400">No API key configured</p>
      </div>
    );
  }

  return <div ref={mapContainer} className={cn("w-full h-full", className)} />;
}
