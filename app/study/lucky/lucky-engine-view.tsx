"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Play, Sparkles } from "lucide-react";

import {
  LUCKY_STORAGE_KEY,
  saveStudySession,
} from "@/components/study/StudySessionRunner";
import { LUCKY_PROCESS } from "@/lib/csl/lucky";
import type { StudyBlock } from "@/lib/csl/study-now";

export function LuckyEngineView() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState("");
  const [blocks, setBlocks] = useState<Array<StudyBlock & { phase?: string }>>([]);

  useEffect(() => {
    void fetch("/api/study/lucky")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setSummary(data.data.summary);
          setBlocks(data.data.blocks);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function startSession() {
    saveStudySession(
      {
        summary,
        totalMinutes: 45,
        blocks,
      },
      LUCKY_STORAGE_KEY,
    );
    window.location.href = "/study/lucky/session";
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
          Lucky · Retain
        </p>
        <h1 className="mt-1 text-3xl font-black text-stone-900">Lucky Engine</h1>
        <p className="mt-2 text-stone-600">
          One guided loop through the full retention cycle — adapted to your gaps.
        </p>
        <p className="mt-3 text-xs font-medium text-violet-700">
          {LUCKY_PROCESS.join(" → ")}
        </p>
      </div>

      <p className="rounded-2xl border border-violet-100 bg-violet-50/50 px-4 py-3 text-sm text-stone-700">
        {summary}
      </p>

      <ul className="space-y-2">
        {blocks.map((block) => (
          <li
            key={block.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-violet-100 bg-white px-4 py-3"
          >
            <div>
              {"phase" in block && block.phase ? (
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                  {block.phase}
                </p>
              ) : null}
              <p className="font-semibold text-stone-900">{block.label}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-500">{block.minutes} min</p>
              {block.href ? (
                <Link href={block.href} className="text-xs font-semibold text-violet-600 hover:underline">
                  Open →
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={startSession}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500"
      >
        <Play className="h-4 w-4" />
        Start Lucky session
      </button>

      <Link
        href="/study"
        className="block text-center text-sm font-semibold text-stone-500 hover:text-violet-600"
      >
        ← Back to Study Hub
      </Link>
    </div>
  );
}
