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
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "./AuthModal";
import CityPickerModal from "./CityPickerModal";
import { trpc } from "@/lib/trpc";
import { useCity } from "@/contexts/CityContext";
import type { User as DbUser } from "@/server/db/schema";

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
  const [menuMounted, setMenuMounted]       = useState(false);
  const [authModalOpen, setAuthModalOpen]   = useState(false);
  const [cityModalOpen, setCityModalOpen]   = useState(false);
  const [internalCategory, setInternalCategory] = useState("all");

  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth({ initialUser });
  const utils = trpc.useUtils();
  const { citySlug, cityName, setCitySlug } = useCity();

  const menuRef    = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const activeCategory = activeCategoryProp ?? internalCategory;
  const { data: categoriesFromDb = [] } = trpc.events.getCategories.useQuery();
  const visibleCategories = categoriesFromDb.slice(0, 8);
  const moreCategories    = categoriesFromDb.slice(8);
  const { data: cityCounts = {} } = trpc.events.getCountByCity.useQuery();

  const logoHref = citySlug ? `/${citySlug}` : "/cities";

  useEffect(() => {
    if (mobileMenuOpen) {
      setMenuMounted(true);
    } else {
      const t = setTimeout(() => setMenuMounted(false), 320);
      return () => clearTimeout(t);
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        mobileMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(t) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(t)
      ) setMobileMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow    = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow    = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow    = "";
      document.body.style.touchAction = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => { setMobileMenuOpen(false); }, [citySlug]);

  const goToSearch = (query = "") => {
    if (!citySlug) return;
    const params = new URLSearchParams();
    if (query.trim()) params.set("search", query.trim());
    params.set("category", activeCategory);
    params.set("focus", "1");
    router.push(`/${citySlug}/search?${params.toString()}`);
    setMobileMenuOpen(false);
  };

  const handleCategoryChange = (cat: string) => {
    if (onCategoryChange) onCategoryChange(cat);
    else setInternalCategory(cat);
  };

  const handleLogout = async () => {
    try {
      await logout();
      utils.auth.me.invalidate();
      router.push(citySlug ? `/${citySlug}` : "/cities");
    } catch (e) {
      console.error(e);
    }
  };

  const menuRowCls =
    "flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 active:scale-[0.98] transition-all duration-100 w-full";

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

      {/* Mobile backdrop */}
      <div
        className={`sm:hidden fixed inset-0 z-40 bg-black transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-70 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ top: 64 }}
        onClick={() => setMobileMenuOpen(false)}
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
              onClick={() => goToSearch()}
              className="hidden sm:flex flex-1 max-w-lg items-center h-10 px-4 rounded-full border border-gray-200 bg-gray-50/80 text-gray-400 text-sm hover:border-indigo-300 hover:bg-white hover:shadow-md hover:shadow-indigo-50 transition-all duration-200 group"
            >
              <span className="flex-1 text-left truncate group-hover:text-gray-500 transition-colors">
                {searchQueryProp ? searchQueryProp : `Search in ${cityName}…`}
              </span>
            </button>

            {/* Desktop right actions */}
            <div className="hidden sm:flex items-center gap-2 ml-auto">
              <button
                onClick={() => toast.info("Create Event feature coming soon!")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-indigo-200 text-indigo-700 text-sm font-medium hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-150"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                <Plus className="w-3.5 h-3.5" /> Create Event
              </button>

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
                    <DropdownMenuItem
                      onClick={() => router.push("/account/tickets")}
                      className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
                    >
                      <Ticket className="w-3.5 h-3.5 mr-2" /> Tickets
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/account/saved")}
                      className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
                    >
                      <Bookmark className="w-3.5 h-3.5 mr-2" /> Saved Events
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/account/profile")}
                      className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
                    >
                      <Settings className="w-3.5 h-3.5 mr-2" /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-red-500 hover:bg-red-50 focus:bg-red-50 hover:text-red-600 focus:text-red-600"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-2" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-indigo-700 transition-colors"
                >
                  <User className="w-4 h-4" /> Sign in
                </button>
              )}
            </div>

            {/* Mobile right actions */}
            <div className="sm:hidden flex items-center gap-1 ml-auto">
              <button
                onClick={() => goToSearch()}
                className="p-2 text-gray-500 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 active:scale-90 transition-all duration-100"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                ref={menuBtnRef}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="relative w-10 h-10 flex items-center justify-center text-gray-500 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 active:scale-90 transition-all duration-100"
                aria-label="Menu"
              >
                <span className={`absolute transition-all duration-200 ${mobileMenuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-75"}`}>
                  <X className="w-5 h-5" />
                </span>
                <span className={`absolute transition-all duration-200 ${mobileMenuOpen ? "opacity-0 -rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"}`}>
                  <Menu className="w-5 h-5" />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop category bar */}
        <div className="hidden sm:block border-t border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center overflow-x-auto scrollbar-hide">
              {visibleCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeCategory === cat.id
                      ? "border-amber-500 text-amber-600"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {cat.label}
                </button>
              ))}
              {moreCategories.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-800 whitespace-nowrap border-b-2 border-transparent"
                      style={{ fontFamily: "'Sora', sans-serif" }}
                    >
                      More <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {moreCategories.map((cat) => (
                      <DropdownMenuItem
                        key={cat.id}
                        onClick={() => handleCategoryChange(cat.id)}
                        className="cursor-pointer"
                      >
                        <span className="mr-2">{cat.icon}</span> {cat.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu — blinds animation */}
        {menuMounted && (
          <div
            ref={menuRef}
            style={{ transformOrigin: "top" }}
            className={`sm:hidden absolute left-0 right-0 top-full bg-white border-t border-gray-100 shadow-xl z-50
              transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
              ${mobileMenuOpen
                ? "opacity-100 scale-y-100 pointer-events-auto"
                : "opacity-0 scale-y-95 pointer-events-none"
              }`}
          >
            <div
              className={`px-4 py-3 flex flex-col gap-4 transition-all duration-300 delay-75 ${
                mobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
              }`}
            >

              {/* City row */}
              <button
                onClick={() => { setCityModalOpen(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 active:scale-[0.98] transition-all duration-100 w-full"
              >
                <div className="w-8 flex justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                </div>
                <span className="text-sm font-medium text-indigo-800 flex-1 truncate text-left">{cityName}</span>
                <span className="text-xs font-semibold text-indigo-500 shrink-0">Change</span>
              </button>

              {/* Account group */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account</p>
                </div>

                {isAuthenticated && user ? (
                  <div className="divide-y divide-gray-50">
                    {/* Identity — non-clickable */}
                    <div className="flex items-center gap-3 px-3 py-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {user.name?.charAt(0).toUpperCase() ?? "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                        {user.email && (
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        )}
                      </div>
                    </div>
                    <button
                      className={menuRowCls}
                      onClick={() => { router.push("/account/tickets"); setMobileMenuOpen(false); }}
                    >
                      <div className="w-8 flex justify-center shrink-0">
                        <Ticket className="w-4 h-4 text-gray-400" />
                      </div>
                      Tickets
                    </button>
                    <button
                      className={menuRowCls}
                      onClick={() => { router.push("/account/saved"); setMobileMenuOpen(false); }}
                    >
                      <div className="w-8 flex justify-center shrink-0">
                        <Bookmark className="w-4 h-4 text-gray-400" />
                      </div>
                      Saved Events
                    </button>
                    <button
                      className={menuRowCls}
                      onClick={() => { router.push("/account/profile"); setMobileMenuOpen(false); }}
                    >
                      <div className="w-8 flex justify-center shrink-0">
                        <Settings className="w-4 h-4 text-gray-400" />
                      </div>
                      Settings
                    </button>
                  </div>
                ) : (
                  <button
                    className={menuRowCls}
                    onClick={() => { setAuthModalOpen(true); setMobileMenuOpen(false); }}
                  >
                    <div className="w-8 flex justify-center shrink-0">
                      <LogIn className="w-4 h-4 text-gray-400" />
                    </div>
                    Sign in or create account
                  </button>
                )}
              </div>

              {/* Host group */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Host</p>
                </div>
                <div className="divide-y divide-gray-50">
                  <button
                    className={menuRowCls}
                    onClick={() => { toast.info("Create Event feature coming soon!"); setMobileMenuOpen(false); }}
                  >
                    <div className="w-8 flex justify-center shrink-0">
                      <Plus className="w-4 h-4 text-gray-400" />
                    </div>
                    Create an Event
                  </button>
                  <button
                    className={menuRowCls}
                    onClick={() => { router.push("/organizer/dashboard"); setMobileMenuOpen(false); }}
                  >
                    <div className="w-8 flex justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-gray-400" />
                    </div>
                    Manage Events
                  </button>
                </div>
              </div>

              {/* Sign out */}
              {isAuthenticated && user && (
                <button
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 active:bg-red-100 active:scale-[0.98] transition-all duration-100 w-full"
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                >
                  <div className="w-8 flex justify-center shrink-0">
                    <LogOut className="w-4 h-4 text-red-400" />
                  </div>
                  Sign out
                </button>
              )}

            </div>
          </div>
        )}
      </header>
    </>
  );
}
