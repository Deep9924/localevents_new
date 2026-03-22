// src/components/AccountProfile.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AccountProfile() {
  const { user, loading, isAuthenticated, logout } = useAuth({ redirectOnUnauthenticated: true });
  const router = useRouter();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push("/")} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader><CardTitle>Profile Information</CardTitle><CardDescription>Your account details and preferences</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-amber-500 flex items-center justify-center text-white font-bold text-xl">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{user.name || "User"}</h2>
                <p className="text-sm text-slate-600">{user.email || "No email provided"}</p>
              </div>
            </div>
            <div className="space-y-4 pt-4 border-t border-slate-200">
              {[["Full Name", user.name], ["Email Address", user.email], ["Account Type", user.role], ["Member Since", user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"]].map(([label, value]) => (
                <div key={label as string}>
                  <label className="text-sm font-medium text-slate-700">{label as string}</label>
                  <p className="mt-1 text-slate-900 capitalize">{value as string || "—"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader><CardTitle>Preferences</CardTitle><CardDescription>Manage your account preferences</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div><p className="font-medium text-slate-900">Email Notifications</p><p className="text-sm text-slate-600">Receive event recommendations</p></div>
              <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">Manage</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div><p className="font-medium text-slate-900">Saved Events</p><p className="text-sm text-slate-600">View your bookmarked events</p></div>
              <button onClick={() => router.push("/account/saved")} className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">View</button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader><CardTitle className="text-red-900">Danger Zone</CardTitle><CardDescription className="text-red-800">Irreversible actions</CardDescription></CardHeader>
          <CardContent>
            <Button onClick={logout} variant="outline" className="w-full border-red-300 text-red-700 hover:bg-red-100">
              <LogOut className="w-4 h-4 mr-2" />Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
