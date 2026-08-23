import { aiService } from "@/lib/ai";
import { parseAiJson } from "@/lib/ai/parse-json-response";

export interface ThinkingFeedback {
  summary: string;
  encouragement: string;
  onTrack: boolean;
  hint?: string | null;
}

export async function evaluateGradeSchoolThinking(input: {
  passage?: string | null;
  question: string;
  userAnswer: string;
  gradeLevel?: string | null;
  subject?: string | null;
  mode: "reading" | "writing";
  sampleAnswer?: string | null;
}): Promise<ThinkingFeedback> {
  const grade = input.gradeLevel?.trim() || "elementary";
  const subject = input.subject?.trim() || "general";

  const context =
    input.mode === "reading"
      ? `Reading passage:\n${input.passage ?? "(none)"}\n\nComprehension question: ${input.question}`
      : `Writing prompt: ${input.question}${
          input.sampleAnswer ? `\nModel answer (guide only): ${input.sampleAnswer}` : ""
        }`;

  const result = await aiService.complete(
    [
      {
        role: "system",
        content:
          "You coach K-8 students. Give warm, specific feedback on their thinking. Never shame them. Respond with JSON only.",
      },
      {
        role: "user",
        content: `Grade: ${grade}
Subject: ${subject}
Activity: ${input.mode === "reading" ? "reading comprehension" : "writing"}

${context}

Student answer:
${input.userAnswer}

Return ONLY JSON:
{
  "summary": "1-2 short sentences explaining what they got right or what to try",
  "encouragement": "one upbeat sentence",
  "onTrack": true or false,
  "hint": "optional gentle hint string or null"
}

Rules:
- onTrack is true if they show reasonable understanding, even if incomplete.
- Use simple words for the grade level.
- Do not repeat the full passage.`,
      },
    ],
    { temperature: 0.3, maxTokens: 1024, jsonMode: true },
  );

  const parsed = parseAiJson<ThinkingFeedback>(
    result.content,
    "Could not evaluate your answer. Please try again.",
  );

  if (!parsed.summary?.trim() || !parsed.encouragement?.trim()) {
    throw new Error("Could not evaluate your answer. Please try again.");
  }

  return {
    summary: parsed.summary.trim(),
    encouragement: parsed.encouragement.trim(),
    onTrack: Boolean(parsed.onTrack),
    hint: parsed.hint?.trim() || null,
  };
}
