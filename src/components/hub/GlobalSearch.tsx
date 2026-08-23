"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { SearchResultsList } from "@/components/search/SearchResultsList";
import type { GlobalSearchResult } from "@/lib/search/global-search";

interface GlobalSearchProps {
  className?: string;
  autoFocus?: boolean;
  onNavigate?: () => void;
}

export function GlobalSearch({
  className = "",
  autoFocus = false,
  onNavigate,
}: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
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
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      void runSearch(query);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    if (!autoFocus) return;
    inputRef.current?.focus();
    setOpen(true);
  }, [autoFocus]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    function onOpenSearch() {
      setOpen(true);
    }

    input.addEventListener("global-search-open", onOpenSearch);
    return () => input.removeEventListener("global-search-open", onOpenSearch);
  }, []);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
    onNavigate?.();
    router.push(href);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }

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
      if (item) navigate(item.href);
    }
  }

  const showDropdown = open && query.trim().length >= 2;
  const searchPageHref = `/search?q=${encodeURIComponent(query.trim())}`;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          ref={inputRef}
          data-global-search-input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search classes, notes, materials…"
          className="w-full rounded-xl border border-brand bg-white py-2.5 pl-10 pr-16 text-sm text-stone-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-[color-mix(in_srgb,var(--sh-primary)_18%,transparent)]"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-brand bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-stone-500 sm:inline">
          ⌘K
        </kbd>
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand sm:right-14" />
        ) : null}
      </div>

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(24rem,70vh)] overflow-y-auto rounded-2xl border border-brand bg-white p-2 shadow-xl shadow-stone-200/40">
          {results.length === 0 && !loading ? (
            <p className="px-3 py-4 text-center text-sm text-stone-500">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <SearchResultsList
              results={results}
              activeIndex={activeIndex}
              onSelect={(item) => navigate(item.href)}
              compact
            />
          )}
          <div className="border-t border-brand px-2 pt-2">
            <Link
              href={searchPageHref}
              className="block rounded-lg px-2 py-1.5 text-xs font-semibold text-brand hover:bg-brand-soft"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
            >
              See all results
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
