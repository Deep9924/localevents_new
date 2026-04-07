"use client";

import dynamic from "next/dynamic";

const AccountTickets = dynamic(() => import("@/components/AccountTickets"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium">Loading your tickets...</p>
      </div>
    </div>
  ),
});

export default function AccountTicketsWrapper() {
  return <AccountTickets />;
}
