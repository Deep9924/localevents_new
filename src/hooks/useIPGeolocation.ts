// Design: Civic Warmth — IP-based geolocation (no permission needed)
"use client";

import { useState, useEffect } from "react";
import { CITIES, City } from "@/lib/events-data";

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function findNearestCity(lat: number, lng: number): City {
  let nearest = CITIES[0];
  let minDist = Infinity;

  for (const city of CITIES) {
    const dist = haversineDistance(lat, lng, city.lat, city.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = city;
    }
  }

  return nearest;
}

export function useIPGeolocation() {
  const [city, setCity] = useState<City | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Using ipapi.co - free IP geolocation service (no API key needed)
        const response = await fetch("https://ipapi.co/json/");
        
        if (!response.ok) {
          throw new Error("Failed to detect location");
        }

        const data = await response.json();
        const { latitude, longitude } = data;

        if (latitude && longitude) {
          const nearest = findNearestCity(latitude, longitude);
          setCity(nearest);
          setError(null);
        } else {
          throw new Error("No location data received");
        }
      } catch (err) {
        console.warn("IP geolocation failed:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        // Fallback to first city
        setCity(CITIES[0]);
      } finally {
        setIsLoading(false);
      }
    };

    detectLocation();
  }, []);

  return { city, isLoading, error };
}
