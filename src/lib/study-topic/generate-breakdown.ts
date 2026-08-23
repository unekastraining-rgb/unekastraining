import { aiService } from "@/lib/ai";
import { parseAiJson } from "@/lib/ai/parse-json-response";

import type { StudyTopicProfile, StudyTopicSubtopic } from "./types";

function fallbackBreakdown(input: {
  title: string;
  focus?: string | null;
  subject?: string | null;
}): Pick<StudyTopicProfile, "summary" | "subtopics" | "suggestedTechniques"> {
  const focus = input.focus?.trim() || input.title;
  return {
    summary: `Build understanding of ${input.title}${input.focus ? ` — especially ${input.focus}` : ""}.`,
    subtopics: [
      { name: "Core concepts", description: `What ${input.title} is and why it matters` },
      { name: "Key vocabulary", description: "Terms and ideas you need to recognize" },
      { name: "Practice & application", description: `Apply ${focus} with examples` },
      { name: "Check understanding", description: "Explain it back and test yourself" },
    ],
    suggestedTechniques: [
      "Teach it back in simple words",
      "Flashcards for terms",
      "Short quiz to check gaps",
      "Notes in Core with your sources",
    ],
  };
}

export async function generateStudyTopicBreakdown(input: {
  title: string;
  focus?: string | null;
  subject?: string | null;
}): Promise<Pick<StudyTopicProfile, "summary" | "subtopics" | "suggestedTechniques">> {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Title is required.");
  }

  try {
    const result = await aiService.complete(
      [
        {
          role: "system",
          content:
            "You help college and adult learners break down topics to study. Respond with JSON only.",
        },
        {
          role: "user",
          content: `Break down this study topic for a learner.

Title: ${title}
${input.subject ? `Subject area: ${input.subject}` : ""}
${input.focus ? `What they want to understand / struggling with: ${input.focus}` : ""}

Return ONLY JSON:
{
  "summary": "2 sentences on how to approach studying this",
  "subtopics": [{ "name": "string", "description": "one sentence" }],
  "suggestedTechniques": ["flashcards", "teach-back", "quiz", etc — 3-5 short strings"]
}

Rules:
- 4-6 subtopics from foundations to application.
- Techniques should map to: notes, flashcards, quiz, explain simply, practice problems.`,
        },
      ],
      { temperature: 0.35, maxTokens: 2048, jsonMode: true },
    );

    const parsed = parseAiJson<{
      summary: string;
      subtopics: StudyTopicSubtopic[];
      suggestedTechniques: string[];
    }>(result.content);

    if (!parsed.summary || !parsed.subtopics?.length) {
      return fallbackBreakdown(input);
    }

    return {
      summary: parsed.summary.trim(),
      subtopics: parsed.subtopics.slice(0, 8),
      suggestedTechniques: (parsed.suggestedTechniques ?? []).slice(0, 6),
    };
  } catch {
    return fallbackBreakdown(input);
  }
}
