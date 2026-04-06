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

interface NavbarProps {
  activeCategory?: string;
  onCategoryChange?: (cat: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}




export default function Navbar({
  activeCategory: activeCategoryProp,
  onCategoryChange,
  searchQuery: searchQueryProp,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [internalCategory, setInternalCategory] = useState("all");

  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();
  const { citySlug, cityName, setCitySlug } = useCity();

  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const activeCategory = activeCategoryProp ?? internalCategory;
  const { data: categoriesFromDb = [] } = trpc.events.getCategories.useQuery();
  const visibleCategories = categoriesFromDb.slice(0, 8);
  const moreCategories = categoriesFromDb.slice(8);

  const { data: cityCounts = {} } = trpc.events.getCountByCity.useQuery();

  // Logo href — go to current city if known, else cities picker
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
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [citySlug]);

  const goToSearch = (query = "") => {
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
      // After logout, go to city if known, else cities picker
      router.push(citySlug ? `/${citySlug}` : "/cities");
    } catch (e) {
      console.error(e);
    }
  };

  const menuRowCls =
    "flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-indigo-50/60 active:bg-indigo-100 active:scale-[0.98] transition-all duration-150 text-left w-full";

  return (
    <>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => utils.auth.me.invalidate()}
      />
      <CityPickerModal
        open={cityModalOpen}
        currentCitySlug={citySlug}
        onSelect={(slug) => {
          setCitySlug(slug);
          router.push(`/${slug}`);
          setCityModalOpen(false);
          setMobileMenuOpen(false);
        }}
        onClose={() => setCityModalOpen(false)}
        eventCounts={cityCounts}
      />

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

            {/* Logo — goes to current city or /cities if none set */}
            <Link href={logoHref} className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-700 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">LE</span>
              </div>
              <span
                className="font-bold text-indigo-900 text-lg"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                LocalEvents
              </span>
            </Link>

            <button
              onClick={() => setCityModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-150 text-sm font-medium text-gray-700 shrink-0"
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-500" />
              <span className="max-w-[100px] truncate">{cityName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            <button
              onClick={() => goToSearch()}
              className="hidden sm:flex flex-1 max-w-lg items-center h-10 px-4 rounded-full border border-gray-200 bg-gray-50/80 text-gray-400 text-sm hover:border-indigo-300 hover:bg-white hover:shadow-md hover:shadow-indigo-50 transition-all duration-200 group"
            >
              <span className="flex-1 text-left truncate group-hover:text-gray-500 transition-colors">
                {searchQueryProp ? searchQueryProp : `Search in ${cityName}…`}
              </span>
              <span className="hidden lg:flex items-center gap-0.5 ml-2 shrink-0">
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-100 text-gray-400 border border-gray-200 group-hover:bg-indigo-50 group-hover:border-indigo-200 group-hover:text-indigo-400 transition-colors">
                  ⌘
                </kbd>
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-100 text-gray-400 border border-gray-200 group-hover:bg-indigo-50 group-hover:border-indigo-200 group-hover:text-indigo-400 transition-colors">
                  K
                </kbd>
              </span>
            </button>

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
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem disabled className="text-xs text-gray-400">
                      {user.email ?? user.name}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => router.push("/account/saved")}
                      className="cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 mr-2" /> Saved Events
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/account/profile")}
                      className="cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 mr-2" /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-red-600"
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
                className="p-2 text-gray-500 hover:text-gray-800 rounded-xl hover:bg-gray-100 active:scale-90 transition-all duration-100 relative w-9 h-9 flex items-center justify-center"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Menu"
              >
                <span
                  className={`absolute transition-all duration-200 ${
                    mobileMenuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-75"
                  }`}
                >
                  <X className="w-5 h-5" />
                </span>
                <span
                  className={`absolute transition-all duration-200 ${
                    mobileMenuOpen ? "opacity-0 -rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
                  }`}
                >
                  <Menu className="w-5 h-5" />
                </span>
              </button>
            </div>
          </div>
        </div>

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

        {menuMounted && (
          <div
            ref={menuRef}
            className={`sm:hidden absolute left-0 right-0 top-full bg-white border-t border-gray-100 shadow-xl z-50 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              mobileMenuOpen
                ? "max-h-[520px] opacity-100 translate-y-0"
                : "max-h-0 opacity-0 -translate-y-2"
            }`}
          >
            <div
              className={`px-5 py-4 flex flex-col gap-1.5 transition-all duration-300 ${
                mobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
              }`}
            >
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50/70 border border-indigo-100/80">
                <MapPin className="w-[18px] h-[18px] text-indigo-500 shrink-0" />
                <span className="text-sm font-medium text-gray-800 flex-1 truncate">
                  {cityName}
                </span>
                <button
                  onClick={() => {
                    setCityModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 active:scale-95 transition-all duration-100 shrink-0"
                >
                  Change City
                </button>
              </div>

              <button
                className={menuRowCls}
                onClick={() => {
                  if (isAuthenticated && user) {
                    router.push("/account/profile");
                    setMobileMenuOpen(false);
                  } else {
                    setAuthModalOpen(true);
                    setMobileMenuOpen(false);
                  }
                }}
              >
                {isAuthenticated && user ? (
                  <div className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-indigo-500 to-amber-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                    {user.name?.charAt(0).toUpperCase() ?? "U"}
                  </div>
                ) : (
                  <LogIn className="w-[18px] h-[18px] text-gray-500 shrink-0" />
                )}
                <span className="text-sm text-gray-900 truncate">
                  {isAuthenticated && user ? user.name : "Login"}
                </span>
              </button>

              <div className="h-px bg-gray-100 my-0.5" />

              <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Host Control
              </p>

              <button
                className={menuRowCls}
                onClick={() => {
                  toast.info("Create Event feature coming soon!");
                  setMobileMenuOpen(false);
                }}
              >
                <div className="w-[18px] h-[18px] rounded border border-gray-300 flex items-center justify-center shrink-0">
                  <Plus className="w-3 h-3 text-gray-500" />
                </div>
                <span className="text-sm text-gray-900">Create an event</span>
              </button>

              <button
                className={menuRowCls}
                onClick={() => {
                  router.push("/organizer/dashboard");
                  setMobileMenuOpen(false);
                }}
              >
                <div className="w-[18px] h-[18px] rounded border border-gray-300 flex items-center justify-center shrink-0">
                  <Calendar className="w-3 h-3 text-gray-500" />
                </div>
                <span className="text-sm text-gray-900">Manage events</span>
              </button>

              {isAuthenticated && user && (
                <>
                  <div className="h-px bg-gray-100 my-0.5" />
                  <button
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent hover:border-red-100 hover:bg-red-50 active:bg-red-100 active:scale-[0.98] transition-all duration-150 text-left w-full"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-[18px] h-[18px] text-red-400 shrink-0" />
                    <span className="text-sm font-semibold text-red-500">Sign out</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
                  }
