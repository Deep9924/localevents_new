// src/app/account/layout.tsx
"use client";

import { useState } from "react";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}
