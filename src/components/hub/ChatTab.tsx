"use client";

import { Send, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useTheme } from "@/lib/theme/ThemeProvider";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface CourseOption {
  id: string;
  title: string;
}

const starterPrompts = [
  "What should I study today?",
  "Help me plan this week",
  "Break down my hardest assignment",
];

const gradeSchoolPrompts = [
  "Help me with my math topic",
  "Explain this in simple words",
  "Give me a fun study idea",
];

export function ChatTab({
  variant = "full",
  courses = [],
  initialCourseId = null,
  pendingPrompt,
  onPendingPromptConsumed,
}: {
  variant?: "full" | "panel";
  courses?: CourseOption[];
  initialCourseId?: string | null;
  pendingPrompt?: string | null;
  onPendingPromptConsumed?: () => void;
}) {
  const { settings } = useTheme();
  const isGradeSchool = settings.elementaryMode;

  const [courseId, setCourseId] = useState(initialCourseId ?? "");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: isGradeSchool
        ? "Hi! I'm your Study Haul helper. Ask me about your classes, topics, or how to study — I'll explain things in a way that's easy to understand."
        : "Hey — I'm your Study Haul copilot. Ask about deadlines, study plans, or how to tackle an assignment.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (initialCourseId && courses.some((course) => course.id === initialCourseId)) {
      setCourseId(initialCourseId);
    }
  }, [initialCourseId, courses]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === courseId) ?? null,
    [courses, courseId],
  );

  const heightClass =
    variant === "panel"
      ? "h-[min(640px,calc(100vh-12rem))]"
      : "h-[min(560px,calc(100vh-14rem))] md:h-[min(640px,calc(100vh-12rem))]";

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(1).slice(-8),
          ...(courseId ? { courseId } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Chat failed.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Something went wrong. Check your GEMINI_API_KEY (or OpenAI key) in .env and restart the dev server.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (!pendingPrompt?.trim()) return;
    void sendMessage(pendingPrompt);
    onPendingPromptConsumed?.();
    // Only fire when an external prompt is injected.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt]);

  return (
    <div
      className={`flex flex-col rounded-3xl border border-brand bg-white p-5 shadow-sm ${heightClass}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-100 p-2.5 text-teal-700">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-stone-900">Study Haul Chat</p>
            <p className="text-sm text-muted-soft">
              {selectedCourse
                ? `Focused on ${selectedCourse.title}`
                : "Your friendly academic assistant"}
            </p>
          </div>
        </div>
        {courses.length > 0 ? (
          <select
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            className="max-w-[10rem] rounded-xl border border-brand bg-white px-2 py-1.5 text-xs font-semibold text-stone-700"
            aria-label="Focus chat on a class"
          >
            <option value="">All classes</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed md:text-base ${
              message.role === "user"
                ? "ml-auto btn-primary text-white"
                : "bg-stone-100 text-stone-800"
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(isGradeSchool ? gradeSchoolPrompts : starterPrompts).map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => void sendMessage(prompt)}
            className="rounded-full border border-brand bg-brand-soft px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-brand-soft"
          >
            {prompt}
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void sendMessage(input);
        }}
        className="mt-4 flex gap-3"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={
            selectedCourse
              ? `Ask about ${selectedCourse.title}…`
              : "Ask about classes, deadlines, or study plans..."
          }
          className="flex-1 rounded-xl border border-brand/80 bg-white/90 px-4 py-3 text-sm text-stone-800 placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--sh-primary)_25%,transparent)] md:text-base"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-xl btn-primary px-5 text-white transition  disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
