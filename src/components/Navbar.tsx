"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  MapPin,
  Plus,
  User,
  Menu,
  X,
  LogOut,
  Settings,
  LogIn,
  Calendar,
  Search,
  Bookmark,
  Ticket
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "./AuthModal";
import CityPickerModal from "./CityPickerModal";
import { trpc } from "@/lib/trpc";
import { useCity } from "@/contexts/CityContext";
import type { User as DbUser } from "@/server/db/schema";
import { cn } from "@/lib/utils";

interface NavbarProps {
  initialUser?: DbUser | null;
  activeCategory?: string;
  onCategoryChange?: (cat: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export default function Navbar({
  initialUser,
  activeCategory: activeCategoryProp,
  onCategoryChange,
  searchQuery: searchQueryProp,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen]   = useState(false);
  const [cityModalOpen, setCityModalOpen]   = useState(false);

  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth({ initialUser });
  const utils = trpc.useUtils();
  const { citySlug, cityName, setCitySlug } = useCity();

  const { data: cityCounts = {} } = trpc.events.getCountByCity.useQuery();
  const logoHref = citySlug ? `/${citySlug}` : "/cities";

  const handleLogout = async () => {
    try {
      await logout();
      utils.auth.me.invalidate();
      router.push(citySlug ? `/${citySlug}` : "/cities");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />
      <CityPickerModal
        open={cityModalOpen}
        currentCitySlug={citySlug ?? ""}
        onSelect={(slug) => {
          setCitySlug(slug);
          router.push(`/${slug}`);
          setCityModalOpen(false);
          setMobileMenuOpen(false);
        }}
        onClose={() => setCityModalOpen(false)}
        eventCounts={cityCounts}
      />

      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-3">

            {/* Logo */}
            <Link href={logoHref} className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-700 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">LE</span>
              </div>
              <span className="font-bold text-indigo-900 text-lg" style={{ fontFamily: "'Sora', sans-serif" }}>
                LocalEvents
              </span>
            </Link>

            {/* Desktop city picker */}
            <button
              onClick={() => setCityModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-150 text-sm font-medium text-gray-700 shrink-0"
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-500" />
              <span className="max-w-[100px] truncate">{cityName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {/* Desktop search bar */}
            <button
              onClick={() => router.push(`/${citySlug}/search`)}
              className="hidden sm:flex flex-1 max-w-lg items-center h-10 px-4 rounded-full border border-gray-200 bg-gray-50/80 text-gray-400 text-sm hover:border-indigo-300 hover:bg-white hover:shadow-md hover:shadow-indigo-50 transition-all duration-200 group"
            >
              <span className="flex-1 text-left truncate group-hover:text-gray-500 transition-colors">
                {searchQueryProp ? searchQueryProp : `Search in ${cityName}…`}
              </span>
            </button>

            {/* Desktop right actions */}
            <div className="hidden sm:flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                onClick={() => toast.info("Create Event feature coming soon!")}
                className="rounded-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Event
              </Button>

              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-gray-100 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {user.name?.charAt(0).toUpperCase() ?? "U"}
                      </div>
                      <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                        {user.name}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => router.push("/account/tickets")} className="cursor-pointer">
                      <Ticket className="w-3.5 h-3.5 mr-2" /> Tickets
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/account/saved")} className="cursor-pointer">
                      <Bookmark className="w-3.5 h-3.5 mr-2" /> Saved Events
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/account/profile")} className="cursor-pointer">
                      <Settings className="w-3.5 h-3.5 mr-2" /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 hover:bg-red-50 focus:bg-red-50">
                      <LogOut className="w-3.5 h-3.5 mr-2" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => setAuthModalOpen(true)}
                  className="text-gray-600 hover:text-indigo-700"
                >
                  <User className="w-4 h-4 mr-1.5" /> Sign in
                </Button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="sm:hidden flex items-center gap-1 ml-auto">
              <button
                onClick={() => router.push(`/${citySlug}/search`)}
                className="p-2 text-gray-500 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-500 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 p-4 space-y-4 shadow-lg animate-in slide-in-from-top duration-200">
            <button
              onClick={() => setCityModalOpen(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 text-gray-700 font-medium"
            >
              <MapPin className="w-5 h-5 text-indigo-500" />
              {cityName}
              <ChevronDown className="w-4 h-4 ml-auto text-gray-400" />
            </button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => { setAuthModalOpen(true); setMobileMenuOpen(false); }}
              >
                <User className="w-4 h-4 mr-2" /> Sign in
              </Button>
              <Button
                className="w-full justify-start bg-indigo-700 hover:bg-indigo-800"
                onClick={() => toast.info("Coming soon!")}
              >
                <Plus className="w-4 h-4 mr-2" /> Create
              </Button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
