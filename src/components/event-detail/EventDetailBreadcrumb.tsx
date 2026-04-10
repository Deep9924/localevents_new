"use client";
import { useRouter } from "next/navigation";
import { Home, ChevronRight } from "lucide-react";

export function EventDetailBreadcrumb({ citySlug, cityName, eventTitle }: {
  citySlug: string; cityName: string; eventTitle: string;
}) {
  const router = useRouter();
  return (
    <nav className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
      <button onClick={() => router.push("/")} className="flex items-center gap-1 hover:text-indigo-600 transition-colors font-medium">
        <Home className="w-3 h-3" />Home
      </button>
      <ChevronRight className="w-3 h-3 shrink-0" />
      <button onClick={() => router.push(`/${citySlug}`)} className="hover:text-indigo-600 transition-colors font-medium capitalize">
        {cityName}
      </button>
      <ChevronRight className="w-3 h-3 shrink-0" />
      <span className="text-gray-500 font-medium truncate max-w-[180px] sm:max-w-xs">{eventTitle}</span>
    </nav>
  );
}