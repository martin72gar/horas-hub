"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition, useEffect, useState, useRef } from "react";
import { Search } from "lucide-react";

export default function SearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentQuery = searchParams.get("q") || "";
  const [value, setValue] = useState(currentQuery);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state if URL parameters change (e.g., page navigation, history back/forward)
  useEffect(() => {
    setValue(currentQuery);
  }, [currentQuery]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Cancel any pending timeout to debounce
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule the search update
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (newValue) {
        params.set("q", newValue);
      } else {
        params.delete("q");
      }
      
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 300);
  };

  return (
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Cari nama KK, istri, sektor, pomparan..."
        className="pl-9 pr-4 py-2 w-full border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-red-800 bg-white"
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <svg className="animate-spin h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}
    </div>
  );
}
