import Link from "next/link";

import { hubTabPath } from "@/lib/hub/tabs";

function isAiQuotaError(message: string): boolean {
  return /quota|gemini|groq|openrouter|failover/i.test(message);
}

export function QuizGenerationError({
  error,
  className = "rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700",
}: {
  error: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p>{error}</p>
      {isAiQuotaError(error) ? (
        <p className="mt-2 text-xs text-rose-800">
          <Link href={hubTabPath("settings")} className="font-semibold underline">
            Settings → AI
          </Link>{" "}
          — add Groq or OpenRouter for failover. Topic-bank quizzes may still generate when
          free-tier AI quota is out.
        </p>
      ) : null}
    </div>
  );
}
