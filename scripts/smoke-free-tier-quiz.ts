/**
 * Smoke: free-tier Gemini quiz quality (strategy #2).
 * Run: npx tsx scripts/smoke-free-tier-quiz.ts
 */
import "dotenv/config";

import { isLikelyTransientCapacityError, shouldTryNextProvider } from "../src/lib/ai/errors";
import { aiService, isAIConfigured, listConfiguredAIProviders } from "../src/lib/ai";
import { getFreeAIProviderStatus } from "../src/lib/ai/config";
import { parseAiJson } from "../src/lib/ai/parse-json-response";
import {
  preferMcAndWriteIns,
  sanitizeQuizQuestions,
} from "../src/lib/quizzes/sanitize-questions";
import { normalizeGeneratedQuestions } from "../src/lib/quizzes/types";

const QUIZ_MESSAGES = [
  {
    role: "system" as const,
    content: `You create college review quizzes. Use ONLY MULTIPLE_CHOICE (4 options, answer = exact option text never a letter), SHORT_ANSWER, FILL_IN_BLANK. No TRUE_FALSE. JSON only.`,
  },
  {
    role: "user" as const,
    content: `Create exactly 6 quiz questions about osmosis and selectively permeable membranes for intro biology.

Return ONLY JSON:
{
  "title": "...",
  "questions": [
    {
      "type": "MULTIPLE_CHOICE",
      "prompt": "...",
      "options": ["...", "...", "...", "..."],
      "correctAnswer": "...",
      "explanation": "..."
    }
  ]
}`,
  },
];

function reportQuizQuality(result: { content: string; provider?: string; model?: string }) {
  const parsed = parseAiJson<{ title?: string; questions: unknown }>(
    result.content,
    "parse failed",
  );
  const generated = normalizeGeneratedQuestions(parsed.questions, 12);
  const cleaned = preferMcAndWriteIns(sanitizeQuizQuestions(generated));

  console.log("provider:", result.provider ?? "(unknown)");
  console.log("model:", result.model);
  console.log("raw count:", generated.length);
  console.log("after sanitize:", cleaned.length);
  console.log("title:", parsed.title ?? "(none)");
  for (const q of cleaned.slice(0, 3)) {
    console.log("-", q.type, "|", q.prompt.slice(0, 90));
  }

  const ok =
    cleaned.length >= 4 &&
    cleaned.every(
      (q) =>
        q.type === "MULTIPLE_CHOICE" ||
        q.type === "SHORT_ANSWER" ||
        q.type === "FILL_IN_BLANK",
    ) &&
    cleaned
      .filter((q) => q.type === "MULTIPLE_CHOICE")
      .every(
        (q) =>
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          typeof q.correctAnswer === "string" &&
          q.options.includes(q.correctAnswer) &&
          !/^[A-D]$/i.test(q.correctAnswer),
      );

  if (!ok) {
    console.error("FAIL: quality gates");
    process.exit(1);
  }
  console.log("PASS: free-tier quiz smoke");
}

async function main() {
  const status = getFreeAIProviderStatus();
  console.log("configured:", listConfiguredAIProviders().join(", ") || "(none)");
  console.log("active chain:", status.activeChain.join(" → ") || "(none)");
  if (status.gemini && !status.groq && !status.openrouter) {
    console.warn(
      "WARN: only Gemini keyed — add GROQ_API_KEY or OPENROUTER_API_KEY for quota failover.",
    );
  }
  if (!isAIConfigured()) {
    console.error("FAIL: no AI keys");
    process.exit(1);
  }

  const maxAttempts = 6;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      if (attempt > 1) {
        const delayMs = Math.min(20_000, 2_000 * 2 ** (attempt - 2));
        console.log(`retry ${attempt}/${maxAttempts} after ${delayMs}ms…`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      const result = await aiService.complete(QUIZ_MESSAGES, {
        temperature: 0.25,
        maxTokens: 4096,
        jsonMode: true,
        includeOpenAIPro: false,
      });
      reportQuizQuality(result);
      return;
    } catch (error) {
      lastError = error;
      const retryable = shouldTryNextProvider(error);
      if (!retryable || attempt === maxAttempts) {
        throw error;
      }
      console.warn(
        `attempt ${attempt} failed (${error instanceof Error ? error.message : error}); retrying…`,
      );
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function exitCodeForError(error: unknown): number {
  if (isLikelyTransientCapacityError(error)) return 2;
  return 1;
}

main().catch((error) => {
  console.error("FAIL:", error instanceof Error ? error.message : error);
  if (isLikelyTransientCapacityError(error)) {
    console.error(
      "HINT: transient Gemini capacity — retry later or add GROQ_API_KEY / OPENROUTER_API_KEY for failover.",
    );
  }
  process.exit(exitCodeForError(error));
});
