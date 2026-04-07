"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, LogOut, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AccountProfile() {
  const { user, loading, isAuthenticated, logout } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }
  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Top bar */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors -ml-2"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900">
            Account Settings
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        {/* Profile card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Manage your basic account info</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-indigo-500 to-amber-500 flex items-center justify-center text-white font-bold text-xl">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">
                  {user.name || "User"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 truncate">
                  {user.email || "No email provided"}
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200">
              {[
                ["Full Name", user.name || "—"],
                ["Email Address", user.email || "—"],
                ["Account Type", user.role || "—"],
                [
                  "Member Since",
                  user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "—",
                ],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-xs font-medium text-slate-600">
                    {label as string}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-900 break-words">
                    {value as string}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your activity</CardTitle>
            <CardDescription>Tickets and saved events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Tickets row: whole row clickable */}
            <button
              type="button"
              onClick={() => router.push("/account/tickets")}
              className="flex w-full items-center justify-between p-3 bg-slate-50 rounded-lg text-left hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <div>
                <p className="font-medium text-slate-900">Tickets</p>
                <p className="text-sm text-slate-600">
                  View events you’ve purchased tickets for
                </p>
              </div>
              <span className="text-indigo-600 font-medium text-sm">
                View
              </span>
            </button>

            {/* Saved events row: whole row clickable */}
            <button
              type="button"
              onClick={() => router.push("/account/saved")}
              className="flex w-full items-center justify-between p-3 bg-slate-50 rounded-lg text-left hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <div>
                <p className="font-medium text-slate-900">Saved Events</p>
                <p className="text-sm text-slate-600">
                  View and manage your bookmarks
                </p>
              </div>
              <span className="text-indigo-600 font-medium text-sm">
                View
              </span>
            </button>
          </CardContent>
        </Card>

        {/* Preferences card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Manage your account preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">
                  Email Notifications
                </p>
                <p className="text-sm text-slate-600">
                  Receive event recommendations
                </p>
              </div>
              <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                Manage
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Standalone sign-out button */}
        <div className="mt-8">
          <Button
            onClick={logout}
            variant="outline"
            className="w-full border-red-300 text-red-700 hover:bg-red-100"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}