"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";

import type { SixComponent } from "@/lib/csl/six";
import {
  TeachingStyleSelector,
  useSessionTeachingStyle,
} from "@/components/study/TeachingStyleSelector";

type TutorMessage = { role: "user" | "assistant"; content: string };

/**
 * Live AI tutor inside a Six technique — teaches with that technique, not a generic chat dump.
 * Floating (default) or workspace (side panel / mobile sheet) layout.
 */
export function SixTutorChat({
  component,
  techniqueTitle,
  topic,
  courseId,
  materialId,
  lessonSummary,
  focusStepContext,
  learnPreferences,
  defaultOpen = false,
  openLabel = "Tutor Me",
  layout = "floating",
  open: openControlled,
  onOpenChange,
  hideTrigger = false,
}: {
  component: SixComponent;
  techniqueTitle: string;
  topic: string;
  courseId?: string;
  materialId?: string;
  lessonSummary?: string;
  /** Current chunk/code the learner is viewing — for contextual tutoring. */
  focusStepContext?: string;
  learnPreferences?: string[];
  /** Open the panel on mount (e.g. Tutor Me intent from Hub / Learn). */
  defaultOpen?: boolean;
  openLabel?: string;
  /** workspace = fill parent / mobile sheet; floating = legacy popover */
  layout?: "floating" | "workspace";
  /** Controlled open (workspace). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide the floating trigger (nav opens Tutor instead). */
  hideTrigger?: boolean;
}) {
  const [openUncontrolled, setOpenUncontrolled] = useState(defaultOpen);
  const controlled = openControlled !== undefined;
  const open = controlled ? Boolean(openControlled) : openUncontrolled;
  const setOpen = (next: boolean) => {
    if (!controlled) setOpenUncontrolled(next);
    onOpenChange?.(next);
  };

  const [seenDefaultOpen, setSeenDefaultOpen] = useState(defaultOpen);
  if (!controlled && defaultOpen && !seenDefaultOpen) {
    setSeenDefaultOpen(true);
    setOpenUncontrolled(true);
  }

  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 2P-19/20 — session-held Teaching Style; changing it must not clear messages. */
  const [teachingStyle, setTeachingStyle] = useSessionTeachingStyle("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatSessionKey = `${component}|${topic}|${courseId ?? ""}`;
  const [activeSessionKey, setActiveSessionKey] = useState(chatSessionKey);
  if (activeSessionKey !== chatSessionKey) {
    setActiveSessionKey(chatSessionKey);
    setMessages([]);
    setError(null);
  }

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  async function send() {
    const text = draft.trim();
    if (!text || loading) return;

    const nextHistory = [...messages, { role: "user" as const, content: text }];
    setMessages(nextHistory);
    setDraft("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/study/six-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          component,
          topic: topic.trim() || undefined,
          courseId: courseId || undefined,
          materialId: materialId || undefined,
          lessonSummary: lessonSummary || undefined,
          focusStepContext: focusStepContext || undefined,
          learnPreferences:
            learnPreferences && learnPreferences.length > 0
              ? learnPreferences
              : undefined,
          history: nextHistory.slice(0, -1),
          ...(teachingStyle ? { teachingStyle } : {}),
        }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        reply?: string;
        error?: string;
        offline?: boolean;
      };
      if (!response.ok || !data.success || !data.reply) {
        throw new Error(data.error ?? "Tutor could not answer.");
      }
      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply! },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tutor could not answer.");
      setMessages((current) => current.slice(0, -1));
      setDraft(text);
    } finally {
      setLoading(false);
    }
  }

  const disabled = !topic.trim();
  const isWorkspace = layout === "workspace";

  const panelBody = (
    <>
      <div className="flex items-start gap-2">
        <div className="rounded-xl bg-teal-600 p-2 text-white">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-800">
            Tutor
          </p>
          <p className="mt-0.5 text-sm text-stone-700">
            Ask about this step
            {topic.trim() ? (
              <>
                {" "}
                · <span className="font-semibold">{topic.trim()}</span>
              </>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg p-1.5 text-stone-500 hover:bg-teal-100 hover:text-stone-800 touch-manipulation"
          aria-label="Close Tutor"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {disabled ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
          Pick a study topic to unlock Tutor.
        </p>
      ) : null}

      {!isWorkspace ? (
        <div className="mt-3">
          <TeachingStyleSelector
            value={teachingStyle}
            onChange={setTeachingStyle}
            id="six-tutor-teaching-style"
          />
        </div>
      ) : null}

      <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto rounded-xl border border-teal-100 bg-white/80 px-3 py-3">
        {messages.length === 0 ? (
          <p className="text-xs text-stone-500">
            Ask about the example, code, or idea on screen — Tutor already has
            this lesson step.
          </p>
        ) : (
          messages.map((item, index) => (
            <div
              key={`${item.role}-${index}`}
              className={`rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                item.role === "user"
                  ? "ml-4 bg-stone-900 text-white"
                  : "mr-2 border border-teal-100 bg-teal-50/80 text-stone-800"
              }`}
            >
              {item.content}
            </div>
          ))
        )}
        {loading ? (
          <p className="inline-flex items-center gap-2 text-xs text-teal-800">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Tutor is thinking…
          </p>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <p className="mt-2 text-xs font-medium text-rose-700">{error}</p>
      ) : null}

      <div className="mt-3 flex gap-2">
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
          disabled={disabled || loading}
          placeholder={
            disabled ? "Choose a topic first…" : "Ask about this step…"
          }
          className="min-w-0 flex-1 rounded-xl border border-teal-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-400 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={disabled || loading || !draft.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-60 touch-manipulation"
          aria-label="Send to Tutor"
        >
          {loading ? (
            <Loader2 className="h-4 w-4" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </>
  );

  if (isWorkspace) {
    if (!open) return null;
    return (
      <aside
        id="six-tutor-panel"
        data-learn-tutor-workspace
        className="flex h-full min-h-[18rem] w-full flex-col overflow-hidden border-t border-teal-200 bg-gradient-to-br from-teal-50 to-white p-4 lg:min-h-0 lg:border-l lg:border-t-0"
      >
        {panelBody}
      </aside>
    );
  }

  return (
    <div className="relative z-20 flex flex-col items-end gap-2">
      {!hideTrigger ? (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md touch-manipulation hover:bg-teal-600"
          aria-expanded={open}
          aria-controls="six-tutor-panel"
        >
          <MessageCircle className="h-4 w-4" />
          {openLabel}
        </button>
      ) : null}

      {open ? (
        <section
          id="six-tutor-panel"
          className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 flex max-h-[min(70vh,28rem)] flex-col rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-4 shadow-xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[min(100vw-2rem,22rem)] sm:max-h-[min(70vh,32rem)]"
        >
          {panelBody}
        </section>
      ) : null}
    </div>
  );
}
