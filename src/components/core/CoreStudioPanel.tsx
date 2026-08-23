"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import type { CoreStudioType } from "@/lib/core/studio-types";

const STUDIO_ITEMS: Array<{
  type: CoreStudioType;
  emoji: string;
  label: string;
  description: string;
}> = [
  {
    type: "briefing",
    emoji: "📰",
    label: "Briefing",
    description: "Executive summary with key terms",
  },
  {
    type: "study-guide",
    emoji: "📋",
    label: "Study guide",
    description: "Sections, bullets, self-check questions",
  },
  {
    type: "faq",
    emoji: "❓",
    label: "FAQ",
    description: "Question and answer pairs from sources",
  },
  {
    type: "timeline",
    emoji: "📅",
    label: "Timeline",
    description: "Chronological events and dates",
  },
  {
    type: "flashcards",
    emoji: "🎴",
    label: "Flashcard deck",
    description: "Front/back cards you can study",
  },
];

interface FlashcardPayload {
  title: string;
  cards: Array<{ front: string; back: string }>;
}

export function CoreStudioPanel({
  courseId,
  materialId,
  topic,
  onInsert,
}: {
  courseId: string;
  materialId: string | null;
  topic: string;
  onInsert: (payload: {
    title: string;
    text: string;
    type: CoreStudioType;
    structured?: Record<string, unknown>;
  }) => void;
}) {
  const [loadingType, setLoadingType] = useState<CoreStudioType | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashcardDeck, setFlashcardDeck] = useState<FlashcardPayload | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  async function generate(type: CoreStudioType) {
    if (!courseId && !materialId) {
      setError("Select a course or material first.");
      return;
    }

    setLoadingType(type);
    setError(null);
    setImportMessage(null);
    setFlashcardDeck(null);
    try {
      const response = await fetch("/api/core/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, courseId: courseId || undefined, materialId, topic }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error ?? "Generation failed.");
      onInsert({
        title: data.data.title,
        text: data.data.noteText,
        type,
        structured: data.data.structured,
      });
      if (type === "flashcards") {
        const structured = data.data.structured as {
          title?: string;
          cards?: Array<{ front: string; back: string }>;
        };
        setFlashcardDeck({
          title: structured.title ?? data.data.title,
          cards: structured.cards ?? [],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setLoadingType(null);
    }
  }

  async function importToLucky() {
    if (!flashcardDeck || !courseId) return;
    setImporting(true);
    setError(null);
    try {
      const response = await fetch("/api/flashcards/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          deckTitle: flashcardDeck.title,
          cards: flashcardDeck.cards,
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error ?? "Import failed.");
      setImportMessage(
        `Added ${data.data.imported} cards to Lucky. Review them in Flashcards.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-violet-50/60 to-white p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-600" />
        <p className="text-sm font-bold text-stone-900">Studio</p>
      </div>
      <p className="mt-1 text-xs text-stone-500">
        Notebook-style outputs grounded in your sources.
      </p>

      <div className="mt-3 space-y-2">
        {STUDIO_ITEMS.map((item) => (
          <button
            key={item.type}
            type="button"
            disabled={loadingType !== null}
            onClick={() => void generate(item.type)}
            className="flex w-full items-start gap-3 rounded-xl border border-orange-100 bg-white p-3 text-left transition hover:border-violet-200 hover:bg-violet-50/40 disabled:opacity-60"
          >
            <span className="text-lg">{item.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                {item.label}
                {loadingType === item.type ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-600" />
                ) : null}
              </span>
              <span className="mt-0.5 block text-xs text-stone-500">{item.description}</span>
            </span>
          </button>
        ))}
      </div>

      {flashcardDeck && flashcardDeck.cards.length > 0 ? (
        <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50/50 p-3">
          <p className="text-xs font-bold text-violet-800">
            {flashcardDeck.cards.length} cards ready
          </p>
          <button
            type="button"
            onClick={() => void importToLucky()}
            disabled={importing || !courseId}
            className="mt-2 w-full rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
          >
            {importing ? "Adding to Lucky…" : "Add deck to Lucky"}
          </button>
          <Link
            href="/flashcards"
            className="mt-2 block text-center text-xs font-semibold text-violet-700 hover:underline"
          >
            Open flashcards →
          </Link>
        </div>
      ) : null}

      {importMessage ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {importMessage}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
