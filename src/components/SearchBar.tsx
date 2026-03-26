"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  cityName: string;
  citySlug: string;
  activeCategory?: string;
  value?: string;
  onChange?: (q: string) => void;
  onSubmit?: (q: string) => void;
  autoFocus?: boolean;
  className?: string;
}

export default function SearchBar({
  cityName,
  citySlug,
  activeCategory = "all",
  value,
  onChange,
  onSubmit,
  autoFocus = false,
  className = "",
}: SearchBarProps) {
  const [internal, setInternal] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== undefined && value !== internal) {
      setInternal(value);
    }
  }, [value, internal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setInternal(q);
    onChange?.(q);
  };

  const handleSubmit = () => {
    const q = internal.trim();
    if (onSubmit) {
      onSubmit(q);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") {
      setInternal("");
      onChange?.("");
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setInternal("");
    onChange?.("");
    inputRef.current?.focus();
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <button
        onClick={handleSubmit}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors z-10"
        aria-label="Search"
        tabIndex={-1}
      >
        <Search className="w-4 h-4 text-gray-400" />
      </button>

      <input
        ref={inputRef}
        autoFocus={autoFocus}
        value={internal}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={`Search events in ${cityName}...`}
        className="w-full pl-11 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 focus:bg-white transition-all"
      />

      {internal && (
        <button
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
          aria-label="Clear search"
          tabIndex={-1}
        >
          <X className="w-3 h-3 text-gray-500" />
        </button>
      )}
    </div>
  );
}
