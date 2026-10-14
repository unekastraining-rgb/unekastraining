"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Touch-friendly horizontal card rail for Study Haul galleries.
 * Contained overflow — does not scroll the page sideways.
 */
export function StudyHaulCardRail({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.min(280, el.clientWidth * 0.75);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  return (
    <div data-study-haul-rail className="relative">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-stone-800">{label}</p>
        <div className="hidden gap-1 sm:flex">
          <button
            type="button"
            aria-label="Scroll activities left"
            onClick={() => scrollByDir(-1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 touch-manipulation hover:bg-stone-50"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Scroll activities right"
            onClick={() => scrollByDir(1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 touch-manipulation hover:bg-stone-50"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        role="list"
        tabIndex={0}
        aria-label={label}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 [-ms-overflow-style:none] [scrollbar-width:thin] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 [&::-webkit-scrollbar]:h-1.5"
      >
        {children}
      </div>
    </div>
  );
}
