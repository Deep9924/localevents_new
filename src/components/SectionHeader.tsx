// src/components/SectionHeader.tsx
"use client";

import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  viewAllLink?: string;
  icon?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  viewAllLink,
  icon,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2" style={{ fontFamily: "'Sora', sans-serif" }}>
          {icon && <span>{icon}</span>}
          {title}
        </h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {viewAllLink && (
        <Link href={viewAllLink} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
          View all →
        </Link>
      )}
    </div>
  );
}
