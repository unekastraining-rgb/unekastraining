import { NextResponse } from "next/server";

import { MaterialType } from "@/generated/prisma";
import { aiService } from "@/lib/ai";
import { isAIConfigured } from "@/lib/ai/is-configured";
import { parseAiJson } from "@/lib/ai/parse-json-response";
import {
  loadChapterStudySourceText,
  loadCourseSourceText,
  loadMaterialSourceText,
} from "@/lib/ai/course-source";
import {
  attachPackedCoverage,
  formatChapterStudyAsNote,
  normalizeChapterStudyExtract,
} from "@/lib/core/chapter-study-extract";
import {
  buildDeterministicColdStartExtract,
  canBuildDeterministicColdStart,
} from "@/lib/core/build-cold-start-chapter-extract";
import { runChapterStudyPipeline } from "@/lib/core/run-chapter-study";
import { formatPackedCoverage, packBalancedStudySource, type PackedStudySource } from "@/lib/core/pack-study-source";
import type { CoreStudioType } from "@/lib/core/studio-types";
import { isMetaSyllabusTopic } from "@/lib/csl/six-worked-lesson";
import { db } from "@/lib/db";
import { aiSourceInstruction, getUserAppSettings } from "@/lib/settings/app-settings";
import { backfillCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";
import { getOrCreateDefaultUser } from "@/lib/user";

function parseJson(content: string) {
  return parseAiJson<Record<string, unknown>>(
    content,
    "Could not read that study extract. Try again — code listings sometimes confuse the model.",
  );
}

const CHAPTER_JSON_SCHEMA = `{
  "title": "Chapter or reading title",
  "chapterOverview": "2-4 sentences: what this chapter is about and how the LOs fit together",
  "learningObjectives": [
    {
      "code": "LO 1-2",
      "statement": "Explain how entrepreneurship and the other factors of production contribute to the creation of wealth.",
      "keyPoints": [
        "Exam-ready point the student must be able to explain",
        "Another concrete point tied to this LO"
      ]
    }
  ],
  "definitions": [{"term":"...","definition":"..."}],
  "frameworks": [
    {
      "name": "Five factors of production",
      "items": ["Land", "Labor", "Capital", "Entrepreneurship", "Knowledge"]
    }
  ],
  "comparisons": [
    {
      "topic": "Being an entrepreneur",
      "positives": ["..."],
      "negatives": ["..."]
    }
  ],
  "mustKnow": ["Short exam-ready bullets only — no fluff"],
  "studyToRemember": ["Optional memory hooks — keep short"],
  "testYourself": [{"question":"LO 1-3: ...","answer":"model answer"}],
  "processesOrSteps": [{"name":"Fetch-decode-execute","steps":["fetch","decode","execute"]}],
  "workedExamples": [
    {
      "title": "Convert binary 1101 to decimal",
      "purpose": "What this walkthrough teaches",
      "setup": "Starting value or situation",
      "steps": ["step 1", "step 2"],
      "result": "What you should get"
    }
  ],
  "recommendedFormats": ["OUTLINE","CONCEPT_DEFINITION","CHARTING","TWO_COLUMN"],
  "coverageNotes": "Which SOURCE COVERAGE headings you captured, and any you could not fill"
}`;

const CHAPTER_STUDY_SYSTEM = `You build exam-ready study notes for college students from a textbook chapter or lecture reading.

Hard rules:
1. Learning objectives are the SPINE when the source lists them. Extract every LO code + statement. For each LO, write keyPoints a student must explain on a test.
2. Cover EVERY major numbered section listed under SOURCE COVERAGE. If a heading appears there, it must show up in definitions, processesOrSteps, comparisons, frameworks, or workedExamples.
3. Teaching procedures, conversions, cycles, and in-text walkthroughs ARE required content (how to convert binary, fetch-decode-execute, using IDLE or a tool). Do not skip them as decorative examples. Skip only author bios, motivational filler, page numbers, and "the chapter begins…".
4. Capture ALL named comparisons (not only the first) and ALL processes. Do not collapse four contrasts into one.
5. testYourself should check those teaching points. Do not replace missing procedures with a short generated quiz.
6. coverageNotes: list SOURCE COVERAGE headings you filled, and any you could not.
7. Never invent fake page citations. Respond JSON only.`;

const SYLLABUS_STUDY_SYSTEM = `You extract what a student actually needs to know and do from a COURSE SYLLABUS (not a textbook chapter).

Hard rules:
1. Prioritize: course/learning objectives, grading structure, exams, assignments, major projects, important dates, required materials/readings, policies that can affect the grade (attendance, late work, academic integrity), modules/topics, instructor expectations.
2. Do NOT turn administrative filler into study items (e.g. "check your email regularly").
3. Map into the same JSON schema used for chapter study:
   - learningObjectives = course outcomes / LOs
   - frameworks = grading breakdown (category + weight), topic modules
   - mustKnow = testable syllabus facts (e.g. "Midterm = 25% of final grade")
   - processesOrSteps = course sequence / module order when present
   - testYourself = quiz-style questions a student might ask about the syllabus (weights, due patterns, required texts)
   - definitions = only policy or course terms that matter academically
4. Exclude fluff. Respond JSON only.`;

const FORMAT_HINT = `recommendedFormats must be chosen only from:
OUTLINE, HIERARCHY, CORNELL, TWO_COLUMN, CONCEPT_DEFINITION, QA, TIMELINE, PROGRESSIVE, PROBLEM_SOLUTION, CHARTING, MIND_MAP, FLOW, PROCESS_FLOW

Prefer OUTLINE when learningObjectives exist, CONCEPT_DEFINITION for terms, CHARTING for frameworks/lists, TWO_COLUMN for pros/cons, TIMELINE or PROCESS_FLOW for sequences.`;

type StudioPrompt = {
  system: string;
  user: (source: string, topic: string) => string;
  maxSourceChars?: number;
};

const PROMPTS: Record<CoreStudioType, StudioPrompt> = {
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
    system: `${CHAPTER_STUDY_SYSTEM}

Also organize output as a concept-based study guide (not a paragraph-by-paragraph summary). Prefer headings like KEY CONCEPTS, KEY TERMS, IMPORTANT DISTINCTIONS, PROCESSES, POSSIBLE TEST AREAS when they fit the material.`,
    maxSourceChars: 90000,
    user: (source, topic) => `Topic focus: ${topic || "Entire provided chapter or reading"}

SOURCE:
${source}

Return the SAME exam-ready JSON schema as chapter study (not a generic summary):
${CHAPTER_JSON_SCHEMA}

${FORMAT_HINT}`,
  },
  "chapter-study": {
    system: CHAPTER_STUDY_SYSTEM,
    maxSourceChars: 90000,
    user: (source, topic) => `Chapter / topic focus: ${topic || "Entire provided chapter or reading"}

SOURCE (syllabus may appear first — use it for learning objectives and textbook title):
${source}

Build study notes a student could pass a chapter quiz with. Return ONLY JSON:
${CHAPTER_JSON_SCHEMA}

${FORMAT_HINT}`,
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
    system:
      "You create high-value study flashcards from academically testable content only. Skip page numbers, fluff, and administrative filler. Respond JSON only.",
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

const SYLLABUS_CHAPTER_PROMPT: StudioPrompt = {
  system: SYLLABUS_STUDY_SYSTEM,
  maxSourceChars: 24000,
  user: (source, topic) => `Focus: ${topic || "This course syllabus"}

SOURCE:
${source}

Return ONLY JSON using the chapter-study schema (mapped for syllabus content):
${CHAPTER_JSON_SCHEMA}

${FORMAT_HINT}
For a syllabus, prefer recommendedFormats: ["OUTLINE","CHARTING","CORNELL"].`,
};

function formatAsNote(type: CoreStudioType, data: Record<string, unknown>): string {
  switch (type) {
    case "briefing": {
      const terms = (data.termsToKnow as Array<{ term: string; definition: string }>) ?? [];
      return `# ${data.title}\n\n${data.summary}\n\n## Key takeaways\n${((data.keyTakeaways as string[]) ?? []).map((item) => `- ${item}`).join("\n")}\n\n## Terms\n${terms.map((item) => `- **${item.term}**: ${item.definition}`).join("\n")}`;
    }
    case "study-guide":
    case "chapter-study":
      return formatChapterStudyAsNote(normalizeChapterStudyExtract(data));
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

async function resolveMaterialType(
  userId: string,
  materialId: string | undefined,
): Promise<MaterialType | null> {
  if (!materialId) return null;
  const material = await db.courseMaterial.findFirst({
    where: { id: materialId, course: { userId } },
    select: { type: true },
  });
  return material?.type ?? null;
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const type = body.type as CoreStudioType;
    const courseId = body.courseId as string | undefined;
    const materialId = body.materialId as string | undefined;
    const topic = (body.topic as string | undefined)?.trim() ?? "";
    const pastedSource =
      typeof body.sourceText === "string" ? body.sourceText.trim() : "";

    if (!type || !PROMPTS[type]) {
      return NextResponse.json(
        { success: false, error: "Valid type is required." },
        { status: 400 },
      );
    }

    if (!courseId && !materialId && !pastedSource) {
      return NextResponse.json(
        { success: false, error: "Select a course or material first, or paste source into the notebook." },
        { status: 400 },
      );
    }

    if (courseId) {
      await backfillCourseTopicsIfEmpty(courseId);
    }

    const courseTopics = courseId
      ? await db.topic.findMany({
          where: {
            courseId,
            course: { userId: user.id },
          },
          orderBy: { sortOrder: "asc" },
          take: 30,
          select: { name: true, description: true },
        })
      : [];
    const usableCourseTopics = courseTopics.filter(
      (topic) =>
        topic.name.trim() &&
        !/^general$/i.test(topic.name) &&
        !isMetaSyllabusTopic(topic.name),
    );

    const materialType = await resolveMaterialType(user.id, materialId);
    const isSyllabusMode =
      (type === "chapter-study" || type === "study-guide") &&
      materialType === MaterialType.SYLLABUS;

    const prompt: StudioPrompt = isSyllabusMode
      ? SYLLABUS_CHAPTER_PROMPT
      : PROMPTS[type];

    const settings = await getUserAppSettings(user.id);
    const maxChars = prompt.maxSourceChars ?? 12000;
    const usesChapterSource =
      type === "chapter-study" || type === "study-guide";
    const source = pastedSource
      ? (() => {
          const packed = packBalancedStudySource(pastedSource, maxChars);
          return {
            text: `## SOURCE COVERAGE\n${formatPackedCoverage(packed)}\n\n## PRIMARY READING / MATERIAL\n${packed.text}`,
            courseTitle: topic || "Notebook page",
            coverage: packed,
          };
        })()
      : usesChapterSource && materialId
        ? await loadChapterStudySourceText(user.id, materialId, maxChars)
        : materialId
          ? await loadMaterialSourceText(user.id, materialId, maxChars)
          : await loadCourseSourceText(user.id, courseId, maxChars);

    if (!source?.text?.trim() && usableCourseTopics.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No source yet. Add course topics, connect LMS/syllabus, or paste a chapter — then try Study chapter again.",
        },
        { status: 400 },
      );
    }

    const isTopicColdStart =
      Boolean((source as { coldStart?: boolean } | null)?.coldStart) ||
      usableCourseTopics.length >= 1 ||
      (!pastedSource &&
        !materialId &&
        Boolean(source?.text?.includes("Study focus: use these course topics")));

    const canDeterministic =
      (type === "chapter-study" || type === "study-guide") &&
      canBuildDeterministicColdStart(source?.text ?? "", usableCourseTopics) &&
      (isTopicColdStart || isSyllabusMode);

    // LMS module / syllabus outline packs do not need a live AI key.
    if (!canDeterministic && !isAIConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "AI is not configured. Add GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY, or choose Import without AI.",
        },
        { status: 503 },
      );
    }

    const grounding =
      type === "chapter-study" || type === "study-guide"
        ? `\n\nGrounding policy: ${aiSourceInstruction(settings.aiSourceMode)} ${
            isSyllabusMode
              ? "This is SYLLABUS mode — extract course requirements and outcomes, not textbook fluff."
              : isTopicColdStart && usableCourseTopics.length >= 1
                ? "COLD START from LMS/course module topics: teach ONLY these modules. Do not invent unrelated chapters or fake textbook citations."
                : isTopicColdStart
                  ? "COLD START (no chapter upload): use the course topic outline to build an exam-ready study pack. Do not invent a fake textbook citation."
                  : "If learning objectives appear in the syllabus but the primary upload is incomplete, cover those LOs when general knowledge is allowed, and list gaps in coverageNotes. Never claim you read a copyrighted textbook that was not uploaded."
          }`
        : "";

    let data: Record<string, unknown>;
    let usedDeterministic = false;
    const topicsForPack =
      usableCourseTopics.length >= 1 ? usableCourseTopics : undefined;
    if (canDeterministic && isAIConfigured()) {
      // Free-tier AI when keys exist; deterministic LMS outline is offline fallback.
      try {
        const sourceText =
          source?.text?.trim() ||
          usableCourseTopics.map((item) => `- ${item.name}`).join("\n");
        data = (await runChapterStudyPipeline({
          sourceText,
          topic,
          grounding,
          coverage: (source as { coverage?: PackedStudySource } | null)?.coverage,
          studyGuide: type === "study-guide",
          includeOpenAIPro: settings.aiUseOpenAIPro,
        })) as unknown as Record<string, unknown>;
      } catch (aiError) {
        console.warn(
          "Cold-start AI pack failed; using deterministic LMS outline fallback.",
          aiError,
        );
        data = buildDeterministicColdStartExtract({
          sourceText: source?.text ?? "",
          courseTitle: source?.courseTitle ?? (topic || "Course"),
          topicFocus: topic,
          topics: topicsForPack,
        }) as unknown as Record<string, unknown>;
        usedDeterministic = true;
      }
    } else if (canDeterministic) {
      data = buildDeterministicColdStartExtract({
        sourceText: source?.text ?? "",
        courseTitle: source?.courseTitle ?? (topic || "Course"),
        topicFocus: topic,
        topics: topicsForPack,
      }) as unknown as Record<string, unknown>;
      usedDeterministic = true;
    } else if ((type === "chapter-study" || type === "study-guide") && !isSyllabusMode) {
      data = (await runChapterStudyPipeline({
        sourceText: source!.text,
        topic,
        grounding,
        coverage: (source as { coverage?: PackedStudySource }).coverage,
        studyGuide: type === "study-guide",
        includeOpenAIPro: settings.aiUseOpenAIPro,
      })) as unknown as Record<string, unknown>;
    } else {
      const result = await aiService.complete(
        [
          { role: "system", content: prompt.system + grounding },
          { role: "user", content: prompt.user(source!.text, topic) },
        ],
        {
          temperature:
            type === "chapter-study" || type === "study-guide" ? 0.15 : 0.3,
          maxTokens:
            type === "chapter-study" || type === "study-guide" ? 12288 : 4096,
          includeOpenAIPro: settings.aiUseOpenAIPro,
        },
      );
      data = parseJson(result.content) as Record<string, unknown>;
      if (type === "chapter-study" || type === "study-guide") {
        data = attachPackedCoverage(
          normalizeChapterStudyExtract(data),
          (source as { coverage?: PackedStudySource }).coverage,
        ) as unknown as Record<string, unknown>;
      }
    }
    const noteText = formatAsNote(type, data);

    return NextResponse.json({
      success: true,
      data: {
        type,
        mode: isSyllabusMode ? "syllabus" : "chapter",
        structured: data,
        noteText,
        title: (data.title as string) ?? `Generated ${type}`,
        courseTitle: source?.courseTitle ?? (topic || "Course"),
        coldStart: isTopicColdStart,
        deterministic: usedDeterministic,
        topicCount: usableCourseTopics.length,
      },
    });
  } catch (error) {
    console.error("Core studio generation failed:", error);
    const raw = error instanceof Error ? error.message : "Generation failed.";
    const lower = raw.toLowerCase();
    const message =
      lower.includes("503") || lower.includes("high demand") || lower.includes("overloaded")
        ? "The AI model is busy right now (high demand). Tap Try again in a moment."
        : /unexpected token|is not valid json|public class/i.test(raw)
          ? "Could not read that study extract. Try again — code listings sometimes confuse the model."
          : raw;
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
