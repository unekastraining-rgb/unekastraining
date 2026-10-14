import { parseLuckyQuizSourceBadge } from "@/lib/quizzes/generate";

export function QuizSourceBadge({
  description,
  variant = "list",
}: {
  description: string | null | undefined;
  variant?: "list" | "detail";
}) {
  const badge = parseLuckyQuizSourceBadge(description);
  if (!badge) return null;

  const sizeClass = variant === "detail" ? "text-[11px]" : "text-[10px]";

  if (badge.kind === "ai") {
    return (
      <p
        className={`mt-2 inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 font-bold uppercase tracking-wider text-violet-800 ${sizeClass}`}
      >
        Free-tier AI · {badge.provider}
        {variant === "detail" ? " · Core → Six → Lucky" : null}
      </p>
    );
  }

  return (
    <p
      className={`mt-2 inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 font-bold uppercase tracking-wider text-stone-600 ${sizeClass}`}
    >
      Offline topic bank · add{" "}
      {variant === "detail" ? "Gemini/" : ""}
      Groq/OpenRouter for tutor-level items
    </p>
  );
}
