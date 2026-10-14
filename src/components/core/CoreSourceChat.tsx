"use client";

import { useState } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";

import { detectCoreStudyIntent } from "@/lib/core/study-intent";
import {
  buildCoreNotebookActionContext,
  type CoreNotebookActionContext,
} from "@/lib/core/notebook-action-context";
import type { ChapterStudyExtract } from "@/lib/core/chapter-study-extract";
import { formatExtractCoverageLines } from "@/lib/core/chapter-study-extract";
import {
  TeachingStyleSelector,
  useSessionTeachingStyle,
} from "@/components/study/TeachingStyleSelector";

interface Citation {
  label: string;
  excerpt: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

export function CoreSourceChat({
  courseId,
  materialId,
  studyExtract = null,
  pageSourceText = "",
  onNotebookAction,
}: {
  courseId: string;
  materialId: string | null;
  /** Current notebook's With-AI extract when available. */
  studyExtract?: ChapterStudyExtract | null;
  pageSourceText?: string;
  onNotebookAction?: (
    ctx: CoreNotebookActionContext,
  ) => Promise<string | void>;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 2P-20 — session-held style; changing it must not clear chat or notes. */
  const [teachingStyle, setTeachingStyle] = useSessionTeachingStyle("");

  async function send() {
    const text = input.trim();
    if (!text) return;
    const hasPageSource = pageSourceText.trim().length > 0;
    if (!courseId && !materialId && !hasPageSource && !studyExtract) {
      setError("Select a course or material first, or paste source into this notebook.");
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    const coreStudyIntent = detectCoreStudyIntent(text);
    if (coreStudyIntent && onNotebookAction) {
      try {
        const ctx = buildCoreNotebookActionContext(coreStudyIntent);
        const confirmation = await onNotebookAction(ctx);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              confirmation ||
              "Done — that is now editable Core content. Your source page was not replaced.",
          },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not apply that to the notebook.");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const response = await fetch("/api/core/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          courseId: courseId || undefined,
          materialId,
          history: nextMessages.slice(-8),
          studyExtract: studyExtract ?? undefined,
          sourceText: hasPageSource ? pageSourceText : undefined,
          ...(teachingStyle ? { teachingStyle } : {}),
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error ?? "Chat failed.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.data.answer,
          citations: data.data.citations,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-teal-600" />
        <p className="text-sm font-bold text-stone-900">Source chat</p>
      </div>
      <p className="mt-1 text-xs text-stone-500">
        {studyExtract
          ? "Uses your With-AI study extract first (testable concepts), then the raw material. Try “create study guide” to lay it out on the canvas."
          : "Ask questions grounded in your uploaded or pasted materials. Run Import with AI or Study this page to prioritize exam-worthy content."}
      </p>
      {studyExtract ? (
        <div className="mt-2 space-y-0.5 rounded-xl border border-teal-100 bg-teal-50/50 px-2.5 py-2">
          {formatExtractCoverageLines(studyExtract).map((line) => (
            <p key={line} className="text-[10px] leading-snug text-teal-800">
              {line}
            </p>
          ))}
        </div>
      ) : null}

      <div className="mt-3">
        <TeachingStyleSelector
          value={teachingStyle}
          onChange={setTeachingStyle}
          id="core-source-teaching-style"
        />
      </div>

      <div className="mt-3 max-h-56 space-y-3 overflow-y-auto rounded-xl border border-orange-50 bg-orange-50/30 p-3">
        {messages.length === 0 ? (
          <p className="text-xs text-stone-500">
            e.g. &quot;Create a study guide&quot; or &quot;Quiz me on what&apos;s most likely on the test.&quot;
          </p>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`text-sm ${
                message.role === "user" ? "text-stone-800" : "text-stone-700"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                {message.role === "user" ? "You" : "Core"}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap">{message.content}</p>
              {message.citations && message.citations.length > 0 ? (
                <ul className="mt-2 space-y-1 border-l-2 border-teal-200 pl-2 text-xs text-stone-600">
                  {message.citations.map((citation) => (
                    <li key={`${citation.label}-${citation.excerpt}`}>
                      <span className="font-semibold text-teal-700">{citation.label}:</span>{" "}
                      &ldquo;{citation.excerpt}&rdquo;
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
          placeholder="Ask about this material…"
          className="min-w-0 flex-1 rounded-xl border border-orange-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-xl bg-teal-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
