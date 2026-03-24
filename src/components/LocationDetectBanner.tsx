// Design: Civic Warmth — Location permission prompt banner
import { MapPin, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface LocationDetectBannerProps {
  onDetect: () => void;
  permissionDenied: boolean;
}

export default function LocationDetectBanner({ onDetect, permissionDenied }: LocationDetectBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-amber-50 border-b border-indigo-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <MapPin className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-indigo-900">
              {permissionDenied
                ? "Location access was denied"
                : "Find events near you"}
            </p>
            <p className="text-xs text-indigo-700 mt-0.5">
              {permissionDenied
                ? "Showing events for a default city. You can manually select a city from the dropdown."
                : "Enable location to automatically see events in your city."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!permissionDenied && (
            <Button
              size="sm"
              onClick={onDetect}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-4 border-0 font-medium"
            >
              Use my location
            </Button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-indigo-400 hover:text-indigo-600 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
