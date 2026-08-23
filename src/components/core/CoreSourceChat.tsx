"use client";

import { useState } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";

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
}: {
  courseId: string;
  materialId: string | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const text = input.trim();
    if (!text) return;
    if (!courseId && !materialId) {
      setError("Select a course or material first.");
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/core/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          courseId: courseId || undefined,
          materialId,
          history: nextMessages.slice(-8),
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
        Ask questions grounded in your uploaded materials.
      </p>

      <div className="mt-3 max-h-56 space-y-3 overflow-y-auto rounded-xl border border-orange-50 bg-orange-50/30 p-3">
        {messages.length === 0 ? (
          <p className="text-xs text-stone-500">
            e.g. &quot;What are the main topics on the midterm?&quot;
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
          placeholder="Ask about your sources..."
          className="min-w-0 flex-1 rounded-xl border border-orange-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={loading}
          className="rounded-xl bg-teal-600 p-2.5 text-white hover:bg-teal-500 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>

      {error ? (
        <p className="mt-2 text-xs text-rose-700">{error}</p>
      ) : null}
    </div>
  );
}
