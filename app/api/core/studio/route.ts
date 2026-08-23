import { NextResponse } from "next/server";

import { aiService } from "@/lib/ai";
import { loadCourseSourceText, loadMaterialSourceText } from "@/lib/ai/course-source";
import { getOrCreateDefaultUser } from "@/lib/user";

import type { CoreStudioType } from "@/lib/core/studio-types";

function parseJson(content: string) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse((fenced?.[1] ?? content).trim());
}

const PROMPTS: Record<
  CoreStudioType,
  { system: string; user: (source: string, topic: string) => string }
> = {
  briefing: {
    system:
      "You create concise course briefings grounded in source material. Respond JSON only.",
    user: (source, topic) => `Topic focus: ${topic || "Full course"}

SOURCE:
${source}

Return ONLY JSON:
{
  "title": "Briefing title",
  "summary": "2-3 paragraph executive summary",
  "keyTakeaways": ["..."],
  "termsToKnow": [{"term":"...","definition":"..."}]
}`,
  },
  "study-guide": {
    system:
      "You create structured study guides like NotebookLM. Respond JSON only.",
    user: (source, topic) => `Topic focus: ${topic || "Full course"}

SOURCE:
${source}

Return ONLY JSON:
{
  "title": "Study guide title",
  "sections": [
    {
      "heading": "Section name",
      "summary": "short paragraph",
      "bullets": ["key point"],
      "checkYourself": ["self-test question"]
    }
  ]
}`,
  },
  faq: {
    system: "You generate FAQ documents from course sources. Respond JSON only.",
    user: (source, topic) => `Topic focus: ${topic || "Full course"}

SOURCE:
${source}

Return ONLY JSON:
{
  "title": "FAQ title",
  "pairs": [{"question":"...","answer":"..."}]
}`,
  },
  timeline: {
    system: "You extract timelines from course material. Respond JSON only.",
    user: (source, topic) => `Topic focus: ${topic || "Full course"}

SOURCE:
${source}

Return ONLY JSON:
{
  "title": "Timeline title",
  "events": [{"date":"when","label":"what happened","detail":"optional context"}]
}`,
  },
  flashcards: {
    system: "You create flashcard decks from course sources. Respond JSON only.",
    user: (source, topic) => `Topic focus: ${topic || "Full course"}

SOURCE:
${source}

Return ONLY JSON:
{
  "title": "Deck title",
  "cards": [{"front":"...","back":"..."}]
}`,
  },
};

function formatAsNote(type: CoreStudioType, data: Record<string, unknown>): string {
  switch (type) {
    case "briefing": {
      const terms = (data.termsToKnow as Array<{ term: string; definition: string }>) ?? [];
      return `# ${data.title}\n\n${data.summary}\n\n## Key takeaways\n${((data.keyTakeaways as string[]) ?? []).map((item) => `- ${item}`).join("\n")}\n\n## Terms\n${terms.map((item) => `- **${item.term}**: ${item.definition}`).join("\n")}`;
    }
    case "study-guide": {
      const sections =
        (data.sections as Array<{
          heading: string;
          summary: string;
          bullets: string[];
          checkYourself: string[];
        }>) ?? [];
      return sections
        .map(
          (section) =>
            `## ${section.heading}\n\n${section.summary}\n\n${section.bullets.map((b) => `- ${b}`).join("\n")}\n\n**Check yourself:**\n${section.checkYourself.map((q) => `- ${q}`).join("\n")}`,
        )
        .join("\n\n");
    }
    case "faq": {
      const pairs = (data.pairs as Array<{ question: string; answer: string }>) ?? [];
      return pairs.map((pair) => `**Q:** ${pair.question}\n\n**A:** ${pair.answer}`).join("\n\n---\n\n");
    }
    case "timeline": {
      const events =
        (data.events as Array<{ date: string; label: string; detail?: string }>) ?? [];
      return events
        .map((event) => `### ${event.date} — ${event.label}\n${event.detail ?? ""}`)
        .join("\n\n");
    }
    case "flashcards": {
      const cards = (data.cards as Array<{ front: string; back: string }>) ?? [];
      return cards.map((card, index) => `${index + 1}. **${card.front}**\n   → ${card.back}`).join("\n\n");
    }
    default:
      return JSON.stringify(data, null, 2);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const type = body.type as CoreStudioType;
    const courseId = body.courseId as string | undefined;
    const materialId = body.materialId as string | undefined;
    const topic = (body.topic as string | undefined)?.trim() ?? "";

    if (!type || !PROMPTS[type]) {
      return NextResponse.json(
        { success: false, error: "Valid type is required." },
        { status: 400 },
      );
    }

    if (!courseId && !materialId) {
      return NextResponse.json(
        { success: false, error: "Select a course or material first." },
        { status: 400 },
      );
    }

    const source = materialId
      ? await loadMaterialSourceText(user.id, materialId)
      : await loadCourseSourceText(user.id, courseId, 12000);

    if (!source?.text?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "No source text found. Upload a syllabus or PDF on Courses first.",
        },
        { status: 400 },
      );
    }

    const prompt = PROMPTS[type];
    const result = await aiService.complete(
      [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user(source.text, topic) },
      ],
      { temperature: 0.3, maxTokens: 4096 },
    );

    const data = parseJson(result.content) as Record<string, unknown>;
    const noteText = formatAsNote(type, data);

    return NextResponse.json({
      success: true,
      data: {
        type,
        structured: data,
        noteText,
        title: (data.title as string) ?? `Generated ${type}`,
        courseTitle: source.courseTitle,
      },
    });
  } catch (error) {
    console.error("Core studio generation failed:", error);
    const message = error instanceof Error ? error.message : "Generation failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
