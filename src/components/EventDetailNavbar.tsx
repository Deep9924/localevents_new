"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, MapPin, Plus, User, Menu, X, LogOut, Settings } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface EventDetailNavbarProps {
  cityName: string;
  citySlug: string;
}

export default function EventDetailNavbar({ cityName, citySlug }: EventDetailNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const resolvedCityName = cityName;

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/${citySlug}?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">LE</span>
            </div>
            <span className="font-bold text-indigo-900 text-lg hidden sm:block" style={{ fontFamily: "'Sora', sans-serif" }}>
              LocalEvents
            </span>
          </Link>

          {/* Locked city pill — same color as Navbar */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 shrink-0 cursor-default">
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            <span className="max-w-[100px] truncate">{resolvedCityName}</span>
          </div>

          {/* Search bar */}
          <div className="flex-1 relative max-w-lg hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder={`Search events in ${resolvedCityName}...`}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 focus:bg-white transition-all"
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Create Event — same as Navbar */}
            <button
              onClick={() => toast.info("Create Event feature coming soon!")}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full border border-indigo-200 text-indigo-700 text-sm font-medium hover:bg-indigo-50 transition-colors"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              <Plus className="w-3.5 h-3.5" />
              Create Event
            </button>

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-gray-100 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-amber-500 flex items-center justify-center text-white text-xs font-bold">
                      {user.name?.charAt(0).toUpperCase() ?? "U"}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium text-gray-700 max-w-[100px] truncate">
                      {user.name}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem disabled className="text-xs text-gray-400">
                    {user.email ?? user.name}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/account/saved")} className="cursor-pointer">
                    <User className="w-3.5 h-3.5 mr-2" /> Saved Events
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/account/profile")} className="cursor-pointer">
                    <Settings className="w-3.5 h-3.5 mr-2" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="w-3.5 h-3.5 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-indigo-700 transition-colors"
              >
                <User className="w-4 h-4" /> Sign in
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              className="sm:hidden p-2 text-gray-500 hover:text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden pb-3 pt-1 border-t border-gray-100">
          <div className="relative mb-3 mt-2 px-4">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder={`Search events in ${resolvedCityName}...`}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div className="flex gap-2 px-4">
            <button
              onClick={() => toast.info("Create Event feature coming soon!")}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-full border border-indigo-200 text-indigo-700 text-sm font-medium hover:bg-indigo-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Create
            </button>
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
                    <User className="w-3.5 h-3.5" /> Account
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => router.push("/account/saved")} className="cursor-pointer">
                    <User className="w-3.5 h-3.5 mr-2" /> Saved Events
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/account/profile")} className="cursor-pointer">
                    <Settings className="w-3.5 h-3.5 mr-2" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="w-3.5 h-3.5 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
              >
                <User className="w-3.5 h-3.5" /> Sign in
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
