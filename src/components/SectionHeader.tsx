"use client";

import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  viewAllLink?: string;
  icon?: string;
  className?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  viewAllLink,
  icon,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between mb-8 px-2", className)}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {icon ? (
            <span className="text-2xl">{icon}</span>
          ) : (
            <Sparkles className="w-5 h-5 text-amber-500" />
          )}
          <h2 className="text-3xl font-bold text-stone-900 tracking-tight font-sora">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-stone-500 text-lg font-light leading-relaxed max-w-xl">
            {subtitle}
          </p>
        )}
      </div>
      
      {viewAllLink && (
        <Link 
          href={viewAllLink} 
          className="hidden sm:flex items-center gap-1 text-sm font-bold text-stone-400 hover:text-stone-900 transition-all group"
        >
          View all
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
