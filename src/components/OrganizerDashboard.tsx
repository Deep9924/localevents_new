// src/components/OrganizerDashboard.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Calendar, Users, TrendingUp, Mail, Edit2, Trash2, Eye, LucideIcon } from "lucide-react";

type StatItem = [string, string, LucideIcon, string];

export default function OrganizerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const isOrganizer = user?.role === "admin";

  if (!isAuthenticated) { router.push("/"); return null; }

  if (!isOrganizer) return (
    <div className="min-h-screen bg-[#FAFAF8] py-12">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-3xl font-bold text-indigo-900 mb-4">Organizer Dashboard</h1>
        <p className="text-gray-600 mb-6">You don't have organizer access.</p>
        <Button onClick={() => router.push("/")} className="bg-indigo-700 hover:bg-indigo-800">Back to Home</Button>
      </div>
    </div>
  );

  const organizerEvents = [
    { id: "1", title: "Summer Music Festival", date: "2026-06-15", attendees: 450, revenue: "$4,500", status: "upcoming" },
    { id: "2", title: "Tech Conference 2026", date: "2026-05-20", attendees: 320, revenue: "$6,400", status: "upcoming" },
    { id: "3", title: "Comedy Night Special", date: "2026-04-10", attendees: 180, revenue: "$1,800", status: "past" },
  ];

  const analyticsData = [
    { month: "Jan", attendees: 120, revenue: 1200 }, { month: "Feb", attendees: 180, revenue: 1800 },
    { month: "Mar", attendees: 220, revenue: 2200 }, { month: "Apr", attendees: 280, revenue: 2800 },
    { month: "May", attendees: 350, revenue: 3500 }, { month: "Jun", attendees: 450, revenue: 4500 },
  ];

  const stats: StatItem[] = [
    ["Total Events", "3", Calendar, "indigo"],
    ["Total Attendees", "950", Users, "amber"],
    ["Total Revenue", "$12.7K", TrendingUp, "green"],
    ["Avg Rating", "4.8★", Mail, "purple"]
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">Organizer Dashboard</h1>
          <p className="text-gray-600">Manage your events, view analytics, and communicate with attendees</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map(([label, value, Icon, color]) => (
            <div key={label} className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-600 mb-1">{label}</p><p className="text-3xl font-bold text-indigo-900">{value}</p></div>
                <Icon className={`w-10 h-10 text-${color}-200`} />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-indigo-900 mb-4">Attendee Trends</h2>
            <ResponsiveContainer width="100%" height={300}><LineChart data={analyticsData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Line type="monotone" dataKey="attendees" stroke="#3730A3" strokeWidth={2} /></LineChart></ResponsiveContainer>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-indigo-900 mb-4">Revenue Trends</h2>
            <ResponsiveContainer width="100%" height={300}><BarChart data={analyticsData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Bar dataKey="revenue" fill="#F59E0B" /></BarChart></ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-indigo-900">Your Events</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{["Event Name","Date","Attendees","Revenue","Status","Actions"].map(h => <th key={h} className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{h}</th>)}</tr>
              </thead>
              <tbody>
                {organizerEvents.map((event) => (
                  <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-indigo-900">{event.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{event.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{event.attendees}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">{event.revenue}</td>
                    <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${event.status === "upcoming" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>{event.status === "upcoming" ? "Upcoming" : "Past"}</span></td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2"><button className="text-indigo-600 p-1"><Eye className="w-4 h-4" /></button><button className="text-amber-600 p-1"><Edit2 className="w-4 h-4" /></button><button className="text-red-600 p-1"><Trash2 className="w-4 h-4" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
