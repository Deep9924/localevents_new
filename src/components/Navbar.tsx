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
  Ticket,
  Sparkles
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
  const [scrolled, setScrolled] = useState(false);

  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth({ initialUser });
  const utils = trpc.useUtils();
  const { citySlug, cityName, setCitySlug } = useCity();

  const { data: cityCounts = {} } = trpc.events.getCountByCity.useQuery();
  const logoHref = citySlug ? `/${citySlug}` : "/cities";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        }}
        onClose={() => setCityModalOpen(false)}
        eventCounts={cityCounts}
      />

      <header 
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled 
            ? "bg-white/80 backdrop-blur-xl border-b border-stone-100 py-2 shadow-sm" 
            : "bg-stone-50/50 py-4"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">

            {/* Logo */}
            <Link href={logoHref} className="flex items-center gap-2.5 group shrink-0">
              <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center shadow-lg shadow-stone-200 transition-transform group-hover:scale-105 group-active:scale-95">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <span className="font-bold text-stone-900 text-xl tracking-tight hidden sm:block">
                LocalEvents
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6 flex-1 max-w-2xl justify-center">
              <button
                onClick={() => setCityModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-100 shadow-sm hover:border-amber-200 hover:shadow-md transition-all text-sm font-semibold text-stone-700"
              >
                <MapPin className="w-4 h-4 text-amber-500" />
                <span className="truncate max-w-[120px]">{cityName}</span>
                <ChevronDown className="w-4 h-4 text-stone-400" />
              </button>

              <button
                onClick={() => router.push(`/${citySlug}/search`)}
                className="flex items-center gap-3 px-5 py-2 rounded-full bg-stone-100/50 border border-transparent hover:bg-white hover:border-stone-200 hover:shadow-sm transition-all text-stone-400 text-sm flex-1 group"
              >
                <Search className="w-4 h-4 group-hover:text-stone-600 transition-colors" />
                <span className="group-hover:text-stone-600 transition-colors">
                  {searchQueryProp || `Search events in ${cityName}...`}
                </span>
              </button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="hidden lg:flex rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-semibold"
                onClick={() => toast.info("Coming soon!")}
              >
                <Plus className="w-4 h-4 mr-2" /> List Event
              </Button>

              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1 pr-3 rounded-full bg-white border border-stone-100 shadow-sm hover:shadow-md transition-all">
                      <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-amber-400 text-xs font-bold">
                        {user.name?.charAt(0).toUpperCase() ?? "U"}
                      </div>
                      <span className="text-sm font-bold text-stone-700 hidden sm:block">
                        {user.name?.split(' ')[0]}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-stone-100 shadow-xl">
                    <DropdownMenuItem onClick={() => router.push("/account/tickets")} className="rounded-xl py-2.5 cursor-pointer">
                      <Ticket className="w-4 h-4 mr-3 text-stone-400" /> Tickets
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/account/saved")} className="rounded-xl py-2.5 cursor-pointer">
                      <Bookmark className="w-4 h-4 mr-3 text-stone-400" /> Saved
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-2 bg-stone-50" />
                    <DropdownMenuItem onClick={handleLogout} className="rounded-xl py-2.5 cursor-pointer text-rose-500 focus:text-rose-500 focus:bg-rose-50">
                      <LogOut className="w-4 h-4 mr-3" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => setAuthModalOpen(true)}
                  className="rounded-full bg-stone-900 hover:bg-stone-800 text-white font-bold px-6"
                >
                  Sign in
                </Button>
              )}

              {/* Mobile Menu Toggle */}
              <button 
                className="md:hidden p-2 rounded-xl bg-stone-100 text-stone-600"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-stone-100 p-4 space-y-4 shadow-xl animate-in slide-in-from-top duration-200">
            <button
              onClick={() => { setCityModalOpen(true); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-stone-50 text-stone-700 font-bold"
            >
              <MapPin className="w-5 h-5 text-amber-500" />
              {cityName}
              <ChevronDown className="w-4 h-4 ml-auto text-stone-400" />
            </button>
            <button
              onClick={() => { router.push(`/${citySlug}/search`); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-stone-50 text-stone-400"
            >
              <Search className="w-5 h-5" />
              Search events...
            </button>
          </div>
        )}
      </header>
    </>
  );
}
