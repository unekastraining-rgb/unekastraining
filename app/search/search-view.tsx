"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { SearchResultsList } from "@/components/search/SearchResultsList";
import type { GlobalSearchResult } from "@/lib/search/global-search";

export function SearchView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const runSearch = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(trimmed)}&limit=50`,
      );
      const data = await response.json();
      if (data.success) {
        setResults(data.results ?? []);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setActiveIndex(-1);
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      void runSearch(query);
      const next = new URLSearchParams();
      next.set("q", trimmed);
      router.replace(`/search?${next.toString()}`, { scroll: false });
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, runSearch, router]);

  function handleSelect(item: GlobalSearchResult) {
    router.push(item.href);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const item = results[activeIndex];
      if (item) handleSelect(item);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <h1 className="mb-6 text-2xl font-bold text-stone-900">Search</h1>

      <div className="relative mb-8">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder="Search classes, notes, materials, study sessions…"
          className="w-full rounded-2xl border border-orange-200 bg-white py-3.5 pl-12 pr-4 text-base text-stone-800 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
        />
        {loading ? (
          <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-orange-500" />
        ) : null}
      </div>

      {query.trim().length < 2 ? (
        <p className="text-sm text-stone-500">Type at least 2 characters to search.</p>
      ) : loading ? (
        <p className="text-sm text-stone-500">Searching…</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-stone-500">No results for &ldquo;{query}&rdquo;</p>
      ) : (
        <div className="rounded-2xl border border-orange-100 bg-white p-3 shadow-sm">
          <p className="mb-3 px-2 text-sm text-stone-500">
            {results.length} result{results.length === 1 ? "" : "s"}
          </p>
          <SearchResultsList
            results={results}
            activeIndex={activeIndex}
            onSelect={handleSelect}
            grouped={false}
          />
        </div>
      )}
    </div>
  );
}
