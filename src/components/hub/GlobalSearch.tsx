"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Search } from "lucide-react";

import { SearchResultsList } from "@/components/search/SearchResultsList";
import type { GlobalSearchResult } from "@/lib/search/global-search";
import { useClientSnapshot } from "@/hooks/useClientSnapshot";

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
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const shortcutHint = useClientSnapshot(
    () => (/Mac|iPhone|iPad/i.test(navigator.platform) ? "⌘K" : "Ctrl+K"),
    () => null as string | null,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openedAtRef = useRef(0);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
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
    openedAtRef.current = Date.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setOpen(true);
  }, [autoFocus]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    function onOpenSearch() {
      openedAtRef.current = Date.now();
      setOpen(true);
    }

    input.addEventListener("global-search-open", onOpenSearch);
    return () => input.removeEventListener("global-search-open", onOpenSearch);
  }, []);

  useLayoutEffect(() => {
    if (!open || !containerRef.current) {
      setCoords(null);
      return;
    }
    function place() {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCoords({
        top: rect.bottom + 8,
        left: Math.max(8, rect.left),
        width: Math.min(rect.width, window.innerWidth - 16),
      });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, query, results.length, loading]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (Date.now() - openedAtRef.current < 450) return;
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest?.("[data-global-search-results]")) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

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

  const trimmedQuery = query.trim();
  const showDropdown = open && trimmedQuery.length >= 2;
  const searchPageHref = `/search?q=${encodeURIComponent(trimmedQuery)}`;

  return (
    <div ref={containerRef} className={`relative z-[300] ${className}`}>
      <div className="relative">
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
          suppressHydrationWarning
          aria-hidden
        >
          <Search className="h-4 w-4 text-stone-400" />
        </span>
        <input
          ref={inputRef}
          data-global-search-input
          type="text"
          role="searchbox"
          aria-label="Search classes, notes, materials"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            openedAtRef.current = Date.now();
            setOpen(true);
          }}
          onFocus={() => {
            openedAtRef.current = Date.now();
            setOpen(true);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder="Search classes, notes, materials…"
          suppressHydrationWarning
          className="hub-search-input w-full py-2.5 pl-10 pr-16 text-sm text-stone-800 transition"
        />
        {shortcutHint ? (
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-brand bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-stone-500 sm:inline">
            {shortcutHint}
          </kbd>
        ) : null}
        {loading ? (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 sm:right-14"
            suppressHydrationWarning
            aria-hidden
          >
            <Loader2 className="h-4 w-4 animate-spin text-brand" />
          </span>
        ) : null}
      </div>

      {showDropdown && coords && typeof document !== "undefined"
        ? createPortal(
            <div
              data-global-search-results
              className="fixed z-[560] max-h-[min(24rem,70vh)] overflow-y-auto rounded-2xl border border-brand bg-white p-2 shadow-xl shadow-stone-200/40"
              style={{
                top: coords.top,
                left: coords.left,
                width: coords.width,
              }}
            >
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
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
