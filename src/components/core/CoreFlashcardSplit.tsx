"use client";

import { useState } from "react";
import { ExternalLink, Layers, X } from "lucide-react";
import Link from "next/link";

import { useTapHandler } from "@/hooks/useTapHandler";

export type CoreFlashcardCard = { front: string; back: string };

/**
 * Notes on the left, flashcard practice on the right (mirrors study split).
 */
export function CoreFlashcardSplit({
  enabled,
  title,
  cards,
  courseId,
  onClose,
  children,
}: {
  enabled: boolean;
  title: string;
  cards: CoreFlashcardCard[];
  courseId?: string | null;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const tapClose = useTapHandler(onClose);
  const tapFlip = useTapHandler(() => setFlipped((v) => !v));
  const tapPrev = useTapHandler(() => {
    setIndex((i) => Math.max(0, i - 1));
    setFlipped(false);
  });
  const tapNext = useTapHandler(() => {
    setIndex((i) => Math.min(cards.length - 1, i + 1));
    setFlipped(false);
  });

  if (!enabled || cards.length === 0) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    );
  }

  const safeIndex = Math.min(index, cards.length - 1);
  const card = cards[safeIndex]!;
  const flashcardsHref = courseId
    ? `/flashcards?courseId=${encodeURIComponent(courseId)}`
    : "/flashcards";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:w-1/2">
        {children}
      </div>
      <aside className="flex max-h-[48vh] min-h-[16rem] w-full shrink-0 flex-col overflow-hidden border-t border-orange-100 bg-orange-50/50 lg:max-h-none lg:h-full lg:w-1/2 lg:border-l lg:border-t-0">
        <div className="flex items-center gap-2 border-b border-orange-100 px-3 py-2">
          <Layers className="h-3.5 w-3.5 shrink-0 text-orange-600" />
          <p className="min-w-0 flex-1 truncate text-[11px] font-semibold text-stone-800">
            Flashcards · {title}
          </p>
          <Link
            href={flashcardsHref}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-teal-700 touch-manipulation hover:bg-white"
          >
            Full screen
            <ExternalLink className="h-3 w-3" />
          </Link>
          <button
            type="button"
            {...tapClose}
            className="rounded-lg p-1.5 text-stone-500 touch-manipulation hover:bg-white hover:text-stone-800"
            aria-label="Close flashcard split"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Card {safeIndex + 1} / {cards.length}
          </p>
          <button
            type="button"
            {...tapFlip}
            className="flex min-h-[10rem] w-full max-w-sm flex-col items-center justify-center rounded-2xl border border-orange-200 bg-white px-4 py-6 text-center shadow-sm touch-manipulation"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
              {flipped ? "Back" : "Front"} · tap to flip
            </p>
            <p className="mt-3 text-sm font-semibold text-stone-900 whitespace-pre-wrap">
              {flipped ? card.back : card.front}
            </p>
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              {...tapPrev}
              disabled={safeIndex <= 0}
              className="min-h-11 rounded-xl border border-stone-200 bg-white px-4 text-xs font-semibold text-stone-700 disabled:opacity-40 touch-manipulation"
            >
              Prev
            </button>
            <button
              type="button"
              {...tapNext}
              disabled={safeIndex >= cards.length - 1}
              className="min-h-11 rounded-xl bg-stone-900 px-4 text-xs font-semibold text-white disabled:opacity-40 touch-manipulation"
            >
              Next
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
