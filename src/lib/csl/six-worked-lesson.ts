import type { SixComponent } from "@/lib/csl/six";
import { parseAiJson } from "@/lib/ai/parse-json-response";
import {
  buildLessonFromKnowledgeLibrary,
  instructionalSourceForTeaching,
  isPlaceholderScaffoldLesson,
  looksLikeStudyTopicProfileSource,
  looksLikeSyllabusProse,
} from "@/lib/learning/knowledge/instructional-library";
import { resolveTeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import { applyPersonalizationToLibraryLesson } from "@/lib/learning/personalized-teaching/apply-deterministic";
import type { PersonalizedTeachingContext } from "@/lib/learning/personalized-teaching/types";
import { enrichLessonForStudio } from "@/lib/learning/studio/enrich-lesson";
import "@/lib/learning/knowledge/packs";

/**
 * Teaching-sequence role for a lesson chunk.
 * Universal structure; subject fills the content.
 */
export type InstructionalRole =
  | "context"
  | "problem"
  | "concept"
  | "explain"
  | "visualize"
  | "worked"
  | "breakdown"
  | "guided"
  | "check"
  | "clarify"
  | "apply"
  | "next";

export interface SixLessonChunk {
  title: string;
  explanation: string;
  example: string;
  memoryTrick?: string;
  /** Where this chunk sits in the teaching sequence */
  role?: InstructionalRole;
  /** Diagram / visual the learner should understand from looking */
  representation?: string;
  /** Line-by-line or step breakdown of the example/code */
  breakdown?: string;
  /** Common misconception to address */
  misconception?: string;
  /** Quick understanding check for this chunk */
  checkPrompt?: string;
}

export interface SixWorkedLesson {
  component: SixComponent;
  topic: string;
  /** One line: you are learning X via this technique */
  learningFrame: string;
  /** Short map of the chunks/steps before detail */
  roadmap: string[];
  chunks: SixLessonChunk[];
  /** Closing mental model */
  cheatSheet: string;
  /** Practice prompts grounded in THIS lesson (not generic syllabus text) */
  practicePrompts: Array<{ title: string; prompt: string; tip: string }>;
}

/** Evidence that a lesson teaches (not merely defines). */
export type InstructionalStructureEvidence = {
  hasContextOrProblem: boolean;
  hasConceptExplanation: boolean;
  hasExample: boolean;
  hasRepresentation: boolean;
  hasWorkedExample: boolean;
  hasBreakdown: boolean;
  hasLearnerInteraction: boolean;
  hasProgression: boolean;
  /** Count of satisfied instructional components (0–8) */
  componentCount: number;
  /** True when enough teaching components are present */
  sufficient: boolean;
};

export type ProgrammingInstructionEvidence = {
  hasCodeExample: boolean;
  hasCodeExplanation: boolean;
  hasCodeBreakdown: boolean;
  hasApplication: boolean;
  sufficient: boolean;
};

const INSTRUCTIONAL_ROLES: InstructionalRole[] = [
  "context",
  "problem",
  "concept",
  "explain",
  "visualize",
  "worked",
  "breakdown",
  "guided",
  "check",
  "clarify",
  "apply",
  "next",
];

function asRole(value: unknown): InstructionalRole | undefined {
  if (typeof value !== "string") return undefined;
  const role = value.trim().toLowerCase() as InstructionalRole;
  return INSTRUCTIONAL_ROLES.includes(role) ? role : undefined;
}

type RawLesson = {
  learningFrame?: string;
  roadmap?: unknown;
  chunks?: unknown;
  cheatSheet?: string;
  practicePrompts?: unknown;
};

function asStringArray(value: unknown, limit = 8): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, limit);
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function asChunks(value: unknown): SixLessonChunk[] {
  if (!Array.isArray(value)) return [];
  const chunks: SixLessonChunk[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const title = typeof row.title === "string" ? row.title.trim() : "";
    const explanation =
      typeof row.explanation === "string" ? row.explanation.trim() : "";
    const example = typeof row.example === "string" ? row.example.trim() : "";
    if (!title || !explanation) continue;
    chunks.push({
      title,
      explanation,
      example: example || `Concrete example for “${title}”.`,
      memoryTrick: asOptionalString(row.memoryTrick),
      role: asRole(row.role),
      representation: asOptionalString(row.representation),
      breakdown: asOptionalString(row.breakdown),
      misconception: asOptionalString(row.misconception),
      checkPrompt: asOptionalString(row.checkPrompt),
    });
  }
  return chunks.slice(0, 12);
}

function asPracticePrompts(
  value: unknown,
): Array<{ title: string; prompt: string; tip: string }> {
  if (!Array.isArray(value)) return [];
  const prompts: Array<{ title: string; prompt: string; tip: string }> = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const title = typeof row.title === "string" ? row.title.trim() : "";
    const prompt = typeof row.prompt === "string" ? row.prompt.trim() : "";
    const tip = typeof row.tip === "string" ? row.tip.trim() : "";
    if (!title || !prompt) continue;
    prompts.push({
      title,
      prompt,
      tip: tip || "Use the worked example above, then cover it.",
    });
  }
  return prompts.slice(0, 4);
}

/** Syllabus admin sections that feel like “what am I studying?” — not real content. */
export function isMetaSyllabusTopic(name: string): boolean {
  const n = name.trim().toLowerCase();
  if (!n) return true;
  if (/^general$/i.test(n)) return true;
  return /^(instructor|course\s*info|course\s*information|office\s*hours|grading(\s*and\s*course\s*work)?|grading\s*policy|attendance|academic\s*(integrity|engagement|assistant)|disability|accommodation|required\s*(materials|technical)|textbook|contact|welcome|about\s*this\s*course|syllabus(\s*overview)?|important\s*dates|key\s*semester\s*dates|course\s*policies|course\s*format|course\s*outcomes|materials\s*and\s*resources|technical\s*(requirements|information)|course\s*navigation|professional\s*communication|functional\s*business\s*areas|business\s*foundations|intro(duction)?|overview|getting\s*started)\b/i.test(
    n,
  );
}

const TEACHING_SEQUENCE_RULES = `TEACHING SEQUENCE (required — not optional fluff):
Decompose the topic into 5–10 progressive teachable concepts. Do NOT dump one definition + overview.
Each chunk MUST teach something the learner didn't know before. Order chunks like a tutor:
1) context/why (concrete situation) → 2) problem → 3) introduce concept → 4) explain → 5) visualize → 6) worked example → 7) break example apart → 8) guided practice / check → 9) clarify misconceptions → 10) apply / next.

EVERY chunk needs: title, role, explanation (3–8 sentences of real teaching), example (concrete).
Prefer also: representation (ASCII diagram / visual map / concept relationship chain), breakdown (line-by-line for code or step-by-step for math), misconception, checkPrompt.

practicePrompts MUST include at least: one Recognize (identify the concept), one Explain, and one Transfer (new situation where the learner must decide which concept applies WITHOUT being told the concept name).

NEVER make the first chunk a bare dictionary definition as the whole lesson. Start with a concrete situation or problem the concept solves.

Subject-aware modalities:
- Programming: real code, execution walkthroughs, reference/object diagrams, state changes
- Math: worked equations, step transformations, error analysis
- Biology: labeled structures, processes, cause/effect sequences
- Business: scenarios, decision models, process diagrams
- Writing: before/after, sentence breakdown, guided revision
- Languages: dialogue, vocabulary in context, usage

Teaching style changes HOW you present — never whether you teach depth.`;

export function buildSixLessonSystemPrompt(
  component: SixComponent,
  options?: {
    teachingStylePolicy?: string;
    preferenceBias?: string;
    difficultyBias?: string;
  },
): string {
  const shared = `Teach the TOPIC with this technique using concrete examples (code, scenarios, analogies). Then give practicePrompts that make the student USE what you taught — never ask them to invent content from syllabus admin headings like "Instructor & Course Information". Respond JSON only.

CRITICAL: Teach the SUBJECT MATTER of the topic (definitions, how it works, examples, vocabulary). Do NOT teach meta study skills like "state the goal", "list steps", or "mark weak spots" as the lesson content.

${TEACHING_SEQUENCE_RULES}`;

  const styleBlock = options?.teachingStylePolicy?.trim()
    ? `\n\nEXPLANATION STYLE / TEACHING MODE (must change the ACTUAL language and scaffolding — not collapse into a single definition). Keep technical accuracy; when simplifying, introduce real terminology after intuition:\n${options.teachingStylePolicy.trim()}`
    : "";

  const prefBlock = options?.preferenceBias?.trim()
    ? `\n\n${options.preferenceBias.trim()}`
    : "";

  const difficultyBlock = options?.difficultyBias?.trim()
    ? `\n\n${options.difficultyBias.trim()}\n(Difficulty = how advanced the material/tasks are. Teaching mode = how you explain. Do NOT conflate them.)`
    : "";

  const tail = `${shared}${styleBlock}${prefBlock}${difficultyBlock}`;

  switch (component) {
    case "chunking":
      return `You are Study Haul's Six coach. Teach the TOPIC using CHUNKING — break it into 5–8 progressive chunks that BUILD on each other (like a tutor), not vague syllabus headings.

Each chunk must include: role, title, explanation, concrete example, and preferably representation/breakdown/checkPrompt.

Then give practicePrompts that make the student USE those same chunks (recall titles, explain one chunk, teach the map).

${tail}`;
    case "detailed-explanation":
      return `You are Study Haul's Six coach for LEARN. Teach the TOPIC as a real lesson — not a summary card.

Use the teaching sequence. chunks[] are ordered instructional beats of the SUBJECT itself.
A definition may appear AFTER context/problem, never as the entire lesson.
When teaching mode is simplified / "like I'm 5": concrete analogies and everyday language FIRST, then correct academic terms, then real examples/code. Never replace technical truth with fake definitions.

${tail}`;
    case "feynman":
      return `You are Study Haul's Six coach. Teach the TOPIC with the FEYNMAN technique — plain language, then analogies, then where analogies break, then ask the learner to explain. Still require examples, representation, and checks.

${tail}`;
    case "visualization":
      return `You are Study Haul's Six coach. Teach the TOPIC via VISUALIZATION — prioritize diagrams/relationships in representation fields. Still explain, work an example, and check understanding.

${tail}`;
    case "hands-on-practice":
      return `You are Study Haul's Six coach. Teach enough to enable action, then let the learner perform. chunks[] include setup, worked example with breakdown, try-it, and check criteria.

${tail}`;
    case "active-recall":
      return `You are Study Haul's Six coach. Teach first (context → concept → example), then hide support and retrieve. Do not skip teaching and jump to flashcard facts.

${tail}`;
    default:
      return `You are Study Haul's Six coach for "${component}". ${tail}`;
  }
}

export function buildSixLessonUserPrompt(input: {
  component: SixComponent;
  topic: string;
  courseTitle?: string;
  sourceText?: string;
  teachingStyle?: string;
  teachingStylePolicy?: string;
  preferenceBias?: string;
  difficultyBias?: string;
  /** Original LMS/week label when different from topic. */
  organizationalLabel?: string | null;
  /** Concepts derived from source — teach these; do not invent others. */
  concepts?: string[];
  /**
   * Phase 3B-2: structured Knowledge Library grounding for the Teaching Engine.
   * Distinct from course/PDF source text.
   */
  knowledgeLibraryBlock?: string | null;
  /**
   * Phase 4B: evidence-backed learner interaction context.
   * Distinct from Knowledge Library, target, and instructional source.
   */
  learnerContextBlock?: string | null;
}): string {
  const sourceRaw = input.sourceText?.trim() ?? "";
  const instructional = instructionalSourceForTeaching(sourceRaw);
  // StudyTopicProfile JSON is organizational planning — never dump it into the prompt.
  const isStudyTopicOrg =
    sourceRaw.length > 0 && looksLikeStudyTopicProfileSource(sourceRaw);

  const libraryBlock = input.knowledgeLibraryBlock?.trim()
    ? `\n${input.knowledgeLibraryBlock.trim()}\n`
    : "";

  const learnerBlock = input.learnerContextBlock?.trim()
    ? `\n${input.learnerContextBlock.trim()}\n`
    : "";

  const groundingBlock = instructional
    ? `\n## OPTIONAL INSTRUCTIONAL GROUNDING
Use only as supporting evidence for terminology, examples, definitions, and alignment with course materials.
Do NOT replace the canonical learning target with a chapter title, heading, or neighboring concept from this text.
If this material is insufficient for a claim, do not invent that the source contains it.
When KNOWLEDGE LIBRARY CONTEXT is also present, prefer Library knowledge for core teaching and use this material for course terminology alignment.
${instructional.slice(0, 9000)}
`
    : isStudyTopicOrg
      ? `\n## OPTIONAL INSTRUCTIONAL GROUNDING
None attached. Study-plan / topic-breakdown metadata is organizational only — teach the canonical learning target from subject knowledge${
          libraryBlock ? " and KNOWLEDGE LIBRARY CONTEXT" : ""
        }.
`
      : sourceRaw
        ? `\n## COURSE / ORGANIZATIONAL CONTEXT
Metadata only (schedule, objectives labels, module names). Do NOT quote or paraphrase this as lesson prose. Teach the canonical learning target from subject knowledge${
            libraryBlock ? " and KNOWLEDGE LIBRARY CONTEXT" : ""
          }.
${sourceRaw.slice(0, 1200)}
`
        : libraryBlock
          ? `\n## OPTIONAL INSTRUCTIONAL GROUNDING
None attached — teach from KNOWLEDGE LIBRARY CONTEXT for this target.
`
          : `\n## OPTIONAL INSTRUCTIONAL GROUNDING
None attached — teach the canonical learning target from solid subject knowledge.
`;

  const styleLine = input.teachingStyle?.trim()
    ? `Teaching mode (explanation style): ${input.teachingStyle.trim()}${
        input.teachingStylePolicy?.trim()
          ? `\nStyle guidance: ${input.teachingStylePolicy.trim()}`
          : ""
      }\n`
    : "";

  const prefLine = input.preferenceBias?.trim()
    ? `${input.preferenceBias.trim()}\n`
    : "";
  const difficultyLine = input.difficultyBias?.trim()
    ? `${input.difficultyBias.trim()}\n`
    : "";

  const orgLine = input.organizationalLabel?.trim()
    ? `Organizational LMS/module label (metadata only — NOT the lesson title): ${input.organizationalLabel.trim()}\n`
    : "";

  const conceptLine =
    input.concepts && input.concepts.length > 0
      ? `Related concept candidates (grounding hints only — ignore schedule/admin wording; do not replace the canonical target):\n- ${input.concepts.slice(0, 10).join("\n- ")}\n`
      : "";

  return `Technique: ${input.component}

## CANONICAL LEARNING TARGET
${input.topic}
This target is authoritative. Teach it directly. Do not replace it with a chapter title, OCR heading, study-plan subtopic (e.g. "Core concepts"), or a neighboring idea from source material.

## COURSE / ORGANIZATIONAL CONTEXT
Course: ${input.courseTitle || "General"}
${orgLine}${conceptLine}${styleLine}${prefLine}${difficultyLine}${libraryBlock}${learnerBlock}${groundingBlock}
CRITICAL RULES:
- The canonical learning target is authoritative — preserve the requested subject/domain.
- When KNOWLEDGE LIBRARY CONTEXT is present, stay faithful to that domain/subject and concept content; do not switch to a different language or topic.
- When LEARNER CONTEXT is present, adapt presentation only (depth of definition, application emphasis, misconception contrast). Do not claim mastery, weakness, or invent learner traits. Do not expose raw learner-state counts or familiarity labels to the learner.
- Do not turn the lesson into a lesson about studying / meta study skills.
- Do not teach a neighboring concept merely because it appears in the source.
- A syllabus / StudyTopicProfile / module schedule is NOT instructional knowledge.
- Do NOT title chunks "${input.organizationalLabel || input.topic} — part 1".
- Chunk titles must be real instructional concepts about ${input.topic}.
- If instructional grounding is missing or is only organizational metadata, still teach ${input.topic} from subject knowledge${
    libraryBlock ? " (prefer KNOWLEDGE LIBRARY CONTEXT)" : ""
  }.
Return JSON with a FULL teaching sequence (5–10 chunks). First chunk = concrete context/problem, NOT a bare definition.
{
  "learningFrame": "One sentence framing the lesson journey for ${input.topic}",
  "roadmap": ["Why we need this", "The problem", "Meet the concept", "..."],
  "chunks": [
    {
      "title": "Short instructional concept title (NOT a week/date label, NOT part N)",
      "role": "context|problem|concept|explain|visualize|worked|breakdown|guided|check|clarify|apply|next",
      "explanation": "Real teaching (3–8 sentences). Answer why / how / what it looks like — not only a definition.",
      "example": "Concrete scenario, code block, equation, or dialogue",
      "representation": "Optional ASCII diagram the learner can learn from",
      "breakdown": "Optional line-by-line or step-by-step unpacking of the example",
      "misconception": "Optional common mistake to clarify",
      "checkPrompt": "Optional quick question to check understanding",
      "memoryTrick": "Optional sticky mnemonic"
    }
  ],
  "cheatSheet": "Closing mental model / chain the student should remember",
  "practicePrompts": [
    {
      "title": "Recognize it",
      "prompt": "A recognition or identification prompt for ${input.topic}.",
      "tip": "Use the worked example above."
    },
    {
      "title": "Explain it",
      "prompt": "Ask the learner to explain a key idea from the lesson in their own words.",
      "tip": "If stuck, reopen one chunk — then retry."
    },
    {
      "title": "Apply it",
      "prompt": "A short application task using what was taught about ${input.topic}.",
      "tip": "Change one detail from the worked example."
    }
  ]
}`;
}

export function parseSixWorkedLesson(
  content: string,
  input: { component: SixComponent; topic: string },
): SixWorkedLesson {
  const raw = parseAiJson<RawLesson>(content, "Could not read the Six lesson.");
  const chunks = asChunks(raw.chunks);
  if (chunks.length < 3) {
    throw new Error("Lesson needs at least 3 taught chunks.");
  }

  const roadmap = asStringArray(raw.roadmap, 12);
  const practicePrompts = asPracticePrompts(raw.practicePrompts);

  return {
    component: input.component,
    topic: input.topic,
    learningFrame:
      (typeof raw.learningFrame === "string" && raw.learningFrame.trim()) ||
      `You're learning ${input.topic} via ${input.component} — small pieces that build on each other.`,
    roadmap: roadmap.length > 0 ? roadmap : chunks.map((chunk) => chunk.title),
    chunks,
    cheatSheet:
      (typeof raw.cheatSheet === "string" && raw.cheatSheet.trim()) ||
      chunks.map((chunk) => chunk.title).join(" → "),
    practicePrompts:
      practicePrompts.length >= 2
        ? practicePrompts
        : defaultPracticePrompts(input.topic, chunks),
  };
}

/**
 * Measure instructional components — not word count.
 * A definition-only lesson fails; a progressive teaching sequence passes.
 */
export function assessInstructionalStructure(
  lesson: SixWorkedLesson,
): InstructionalStructureEvidence {
  const roles = new Set(
    lesson.chunks.map((c) => c.role).filter(Boolean) as InstructionalRole[],
  );
  const blob = lesson.chunks
    .map(
      (c) =>
        `${c.title}\n${c.explanation}\n${c.example}\n${c.representation ?? ""}\n${c.breakdown ?? ""}\n${c.checkPrompt ?? ""}`,
    )
    .join("\n")
    .toLowerCase();

  const hasContextOrProblem =
    roles.has("context") ||
    roles.has("problem") ||
    /why (do|we|does)|imagine |scenario|the problem|need (classes|this)|concrete situation/.test(
      blob,
    );

  const hasConceptExplanation =
    roles.has("concept") ||
    roles.has("explain") ||
    lesson.chunks.some((c) => c.explanation.trim().length >= 80);

  const hasExample = lesson.chunks.some(
    (c) => c.example.trim().length >= 12 && !/^concrete example for/i.test(c.example),
  );

  const hasRepresentation =
    roles.has("visualize") ||
    lesson.chunks.some((c) => Boolean(c.representation?.trim()));

  const hasWorkedExample =
    roles.has("worked") ||
    /worked|step[-\s]?by[-\s]?step|walkthrough|let's (create|build|write)|class \w+|=\s*new\s+\w+/.test(
      blob,
    );

  const hasBreakdown =
    roles.has("breakdown") ||
    lesson.chunks.some((c) => Boolean(c.breakdown?.trim()));

  const hasLearnerInteraction =
    roles.has("check") ||
    roles.has("guided") ||
    lesson.chunks.some((c) => Boolean(c.checkPrompt?.trim())) ||
    lesson.practicePrompts.length >= 2;

  const hasProgression =
    lesson.chunks.length >= 4 &&
    (lesson.roadmap.length >= 3 || roles.size >= 3);

  const flags = [
    hasContextOrProblem,
    hasConceptExplanation,
    hasExample,
    hasRepresentation,
    hasWorkedExample,
    hasBreakdown,
    hasLearnerInteraction,
    hasProgression,
  ];
  const componentCount = flags.filter(Boolean).length;

  return {
    hasContextOrProblem,
    hasConceptExplanation,
    hasExample,
    hasRepresentation,
    hasWorkedExample,
    hasBreakdown,
    hasLearnerInteraction,
    hasProgression,
    componentCount,
    // Need real teaching arc: context + explain + example + progression + interaction (5+),
    // or 6 of 8 components including progression.
    sufficient:
      componentCount >= 6 ||
      (hasContextOrProblem &&
        hasConceptExplanation &&
        hasExample &&
        hasProgression &&
        hasLearnerInteraction &&
        (hasWorkedExample || hasBreakdown || hasRepresentation)),
  };
}

/** Extra checks for programming lessons (code + breakdown + application). */
export function assessProgrammingInstruction(
  lesson: SixWorkedLesson,
): ProgrammingInstructionEvidence {
  const codeLike =
    /class\s+\w+|void\s+\w+\s*\(|new\s+\w+\s*\(|;\s*$|\{[\s\S]*\}/m;
  const hasCodeExample = lesson.chunks.some((c) => codeLike.test(c.example));
  const hasCodeExplanation = lesson.chunks.some(
    (c) =>
      codeLike.test(c.example) &&
      c.explanation.length >= 60 &&
      /(means|creates|stores|calls|reference|object|field|method)/i.test(
        c.explanation,
      ),
  );
  const hasCodeBreakdown = lesson.chunks.some(
    (c) =>
      Boolean(c.breakdown?.trim()) ||
      (codeLike.test(c.example) &&
        /line|→|creates|reference|variable|type/i.test(
          `${c.explanation}\n${c.breakdown ?? ""}`,
        )),
  );
  const hasApplication =
    lesson.chunks.some((c) => c.role === "apply" || c.role === "guided") ||
    lesson.practicePrompts.some((p) =>
      /apply|write|create|build|try/i.test(`${p.title} ${p.prompt}`),
    );

  return {
    hasCodeExample,
    hasCodeExplanation,
    hasCodeBreakdown,
    hasApplication,
    sufficient:
      hasCodeExample &&
      hasCodeExplanation &&
      hasCodeBreakdown &&
      hasApplication,
  };
}

export function defaultPracticePrompts(
  topic: string,
  chunks: SixLessonChunk[],
): Array<{ title: string; prompt: string; tip: string }> {
  const titles = chunks.map((chunk) => chunk.title).join(", ");
  return [
    {
      title: "Recall the map",
      prompt: `Cover the worked example. List the chunks of ${topic} in order from memory (there were ${chunks.length}).`,
      tip: `Target titles include: ${titles}`,
    },
    {
      title: "Explain one chunk",
      prompt: `Pick one chunk of ${topic} and explain it with a concrete example — no notes.`,
      tip: "If you only remember the title, reopen that chunk once, then retry from memory.",
    },
    {
      title: "Teach the whole idea",
      prompt: `Teach ${topic} in 6–8 sentences using your chunks as the outline.`,
      tip: "End with the mental model from the cheat sheet.",
    },
  ];
}

/** Offline / AI-fail fallback so Study still teaches something usable. */
export function buildDeterministicChunkingLesson(topic: string): SixWorkedLesson {
  return buildDeterministicSixLesson("chunking", topic);
}

/**
 * Subject-aware offline lesson when AI fails.
 * Returns null when we cannot teach the topic itself (caller should show retry).
 * Never returns meta study-skill outlines for detailed-explanation.
 */
export function buildSubjectAwareFallbackLesson(
  component: SixComponent,
  topic: string,
  options?: {
    sourceText?: string;
    concepts?: string[];
    courseTitle?: string | null;
    /** Phase 4B — presentation adaptation for Knowledge Library lessons only. */
    personalizedTeaching?: PersonalizedTeachingContext | null;
    /** Phase 5 — Orchestrator reteach emphasis. */
    reteachEmphasis?: boolean;
  },
): SixWorkedLesson | null {
  const clean = topic.trim() || "this topic";

  // 1) Preserve specialized high-quality paths (OOD, BST, …).
  // Do NOT route specialized lessons through learner personalization.
  const specialized = specializedChunkingLesson(clean);
  if (specialized) {
    return {
      ...specialized,
      component,
      learningFrame: learningFrameFor(component, specialized.topic),
    };
  }

  // 2) Instructional Knowledge Library packs (Exception Handling, mortgages, …).
  const fromLibrary = buildLessonFromKnowledgeLibrary(component, clean, {
    courseTitle: options?.courseTitle,
  });
  if (fromLibrary && !isPlaceholderScaffoldLesson(fromLibrary)) {
    const personalized = applyPersonalizationToLibraryLesson(
      {
        ...fromLibrary,
        component,
        learningFrame: learningFrameFor(component, clean),
      },
      options?.personalizedTeaching,
      { reteachEmphasis: options?.reteachEmphasis },
    );
    // Additive: push Library structure into Studio enrichment when context resolves.
    const tkc = resolveTeachingKnowledgeContext(clean);
    if (tkc?.primaryConcept || (tkc?.concepts?.length ?? 0) > 0) {
      return enrichLessonForStudio({
        lesson: personalized,
        scope:
          (tkc!.concepts.length >= 3 ? "concept-family" : "focused-concept"),
        focusConcept: tkc!.primaryConcept ?? tkc!.concepts[0] ?? null,
        pathTitles:
          tkc!.concepts.length > 1
            ? tkc!.concepts.map((c) => c.title)
            : undefined,
        pathIndex: 0,
        domain: tkc!.domain,
        deepenIfThin: true,
      });
    }
    return personalized;
  }

  // 3) Usable course material only — never syllabus prose as the lesson.
  const instructional = instructionalSourceForTeaching(options?.sourceText);
  if (instructional) {
    const fromSource = lessonFromSourceText(component, clean, instructional, {
      concepts: options?.concepts,
    });
    if (fromSource && !isPlaceholderScaffoldLesson(fromSource)) {
      return {
        ...fromSource,
        learningFrame: learningFrameFor(component, clean),
      };
    }
  }

  // 4) Learn must NOT serve generic synthesizer scaffolding as a successful lesson.
  // Other SIX techniques return null so callers can use technique skeletons.
  return null;
}

/**
 * Deterministic offline lesson.
 * For detailed-explanation: only subject-aware content (never meta Goal/Steps outline).
 * Other techniques may use technique skeletons when no subject-aware content exists.
 */
export function buildDeterministicSixLesson(
  component: SixComponent,
  topic: string,
  options?: {
    sourceText?: string;
    personalizedTeaching?: PersonalizedTeachingContext | null;
    reteachEmphasis?: boolean;
  },
): SixWorkedLesson {
  const clean = topic.trim() || "this topic";
  const subjectAware = buildSubjectAwareFallbackLesson(component, clean, {
    sourceText: options?.sourceText,
    personalizedTeaching: options?.personalizedTeaching,
    reteachEmphasis: options?.reteachEmphasis,
  });
  if (subjectAware) return subjectAware;

  if (component === "detailed-explanation") {
    // Honest empty — callers of Teach Me must not soft-succeed with meta outlines.
    // Kept for non-Teach callers that still invoke this helper: return minimal
    // subject stub only when we truly have nothing better (tests may still call).
    // Prefer null via buildSubjectAwareFallbackLesson for Teach Me API path.
  }

  if (component === "chunking") {
    // specialized already tried above
  }

  const chunks = techniqueSkeletonChunks(component, clean);
  return {
    component,
    topic: clean,
    learningFrame: learningFrameFor(component, clean),
    roadmap: chunks.map((chunk) => chunk.title),
    chunks,
    cheatSheet: chunks.map((chunk) => chunk.title).join(" → "),
    practicePrompts: defaultPracticePrompts(clean, chunks),
  };
}

/** True when a detailed-explanation lesson is the banned meta study outline. */
export function isMetaStudySkillOutlineLesson(lesson: SixWorkedLesson): boolean {
  if (lesson.component !== "detailed-explanation") return false;
  const titles = lesson.chunks.map((c) => c.title.toLowerCase());
  const hasGoal = titles.some((t) => t.startsWith("goal of "));
  const hasSteps = titles.some((t) => t.includes("step-by-step"));
  const hasWhy = titles.some((t) => t.includes("why each step"));
  const hasWeak = titles.some((t) => t.includes("weak-spot"));
  return hasGoal && hasSteps && (hasWhy || hasWeak);
}

function lessonFromSourceText(
  component: SixComponent,
  topic: string,
  sourceText?: string,
  options?: { concepts?: string[] },
): SixWorkedLesson | null {
  const raw = sourceText?.trim();
  if (!raw || raw.length < 120) return null;
  if (looksLikeSyllabusProse(raw.slice(0, 1200))) return null;

  const concepts = (options?.concepts ?? [])
    .map((c) => c.trim())
    .filter((c) => c.length >= 3)
    .filter((c) => !looksLikeSyllabusProse(c))
    .filter((c) => !/^module\s+\d+/i.test(c))
    .filter((c) => !/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/i.test(c))
    .slice(0, 8);

  // Prefer concept-shaped curriculum over pagination slices — but only when
  // snippets are instructional, not syllabus LO fragments.
  if (concepts.length >= 2) {
    const chunks: SixLessonChunk[] = [];
    for (let index = 0; index < concepts.length; index++) {
      const concept = concepts[index]!;
      const snippet = findSourceSnippetForConcept(raw, concept);
      if (snippet && looksLikeSyllabusProse(snippet)) continue;
      const explanation =
        snippet && !looksLikeSyllabusProse(snippet)
          ? snippet.slice(0, 700)
          : `Study “${concept}” as part of ${topic}: what it is, why it matters, and how it is used.`;
      if (looksLikeSyllabusProse(explanation)) continue;
      chunks.push({
        title: concept,
        role: index === 0 ? "context" : index === concepts.length - 1 ? "apply" : "explain",
        explanation,
        example:
          snippet && snippet.length > 40 && !looksLikeSyllabusProse(snippet)
            ? `From your material: “${snippet.slice(0, 160)}${snippet.length > 160 ? "…" : ""}”`
            : `Concrete example involving ${concept}.`,
        checkPrompt: `In one sentence, what should you remember about ${concept}?`,
      });
    }
    if (chunks.length >= 3) {
      return {
        component,
        topic,
        learningFrame: `You're learning ${topic} grounded in your course material — teaching subject concepts, not the syllabus schedule.`,
        roadmap: chunks.map((c) => c.title),
        chunks,
        cheatSheet: chunks.map((c) => c.title).join(" → "),
        practicePrompts: defaultPracticePrompts(topic, chunks),
      };
    }
  }

  const paragraphs = raw
    .split(/\n{2,}|\r\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length >= 40)
    .filter((p) => !looksLikeSyllabusProse(p))
    .slice(0, 8);

  const chunks: SixLessonChunk[] = [];
  for (let index = 0; index < paragraphs.length; index++) {
    const para = paragraphs[index]!;
    if (chunks.length >= 6) break;
    const title = titleFromParagraph(para);
    if (!title || looksLikeSyllabusProse(title)) continue;
    chunks.push({
      title,
      role: chunks.length === 0 ? "context" : "explain",
      explanation: para.slice(0, 700),
      example: `From your material: “${para.slice(0, 140)}${para.length > 140 ? "…" : ""}”`,
      checkPrompt: `What is the main idea of “${title}”?`,
    });
  }

  if (chunks.length >= 3) {
    return {
      component,
      topic,
      learningFrame: `You're learning ${topic} from instructional course material — key points drawn from usable source text.`,
      roadmap: chunks.map((c) => c.title),
      chunks,
      cheatSheet: chunks.map((c) => c.title).join(" → "),
      practicePrompts: defaultPracticePrompts(topic, chunks),
    };
  }

  // Honest empty: do not invent "topic — part N" and never use syllabus as lesson.
  return null;
}

function headingTitleFromParagraph(para: string): string | null {
  const heading =
    para.match(/^(?:LO\s*[\d\-–.]+\s*[:.\-–—]?\s*)(.{8,70}?)(?:[.:]|\s—\s)/i) ??
    para.match(/^(.{8,55}?)([.:]|\s—\s)/);
  const candidate = heading?.[1]?.trim();
  if (!candidate || candidate.length >= 56) return null;
  if (/^part\s+\d+$/i.test(candidate)) return null;
  if (/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/i.test(candidate)) {
    return null;
  }
  return candidate;
}

/** Prefer heading; else a short clause from the paragraph — never "topic — part N". */
function titleFromParagraph(para: string): string | null {
  const heading = headingTitleFromParagraph(para);
  if (heading) return heading;
  const first = para.split(/[.!?]/)[0]?.trim() ?? "";
  if (first.length >= 12 && first.length <= 72) return first;
  const words = first.split(/\s+/).filter(Boolean).slice(0, 7).join(" ");
  if (words.length >= 10 && words.length <= 72) return words;
  return null;
}

function findSourceSnippetForConcept(
  sourceText: string,
  concept: string,
): string | null {
  const needle = concept.slice(0, 40).toLowerCase();
  if (needle.length < 3) return null;
  const normalized = sourceText.replace(/\s+/g, " ");
  const idx = normalized.toLowerCase().indexOf(needle);
  if (idx < 0) return null;
  const start = Math.max(0, idx - 40);
  return normalized.slice(start, start + 420).trim();
}

function learningFrameFor(component: SixComponent, topic: string): string {
  switch (component) {
    case "chunking":
      return `You're learning ${topic} via chunking — small labeled pieces that build on each other, not one giant reread.`;
    case "detailed-explanation":
      return `You're learning ${topic} via detailed explanation — step-by-step until each part makes sense.`;
    case "feynman":
      return `You're learning ${topic} via Feynman — explain it in plain words as if teaching a friend.`;
    case "visualization":
      return `You're learning ${topic} via visualization — turn the idea into a map you can redraw.`;
    case "hands-on-practice":
      return `You're learning ${topic} via hands-on practice — apply it to a tiny problem, then try one yourself.`;
    case "active-recall":
      return `You're learning ${topic} via active recall — see the answer key briefly, then retrieve from memory.`;
    default:
      return `You're learning ${topic} with a Six technique.`;
  }
}

function techniqueSkeletonChunks(
  component: SixComponent,
  topic: string,
): SixLessonChunk[] {
  switch (component) {
    case "detailed-explanation":
      return [
        {
          title: `Goal of ${topic}`,
          explanation: `State what ${topic} is trying to accomplish in one sentence before diving into mechanics.`,
          example: `“${topic} exists so that ___.”`,
          memoryTrick: "Why before how",
        },
        {
          title: "Step-by-step parts",
          explanation: `List the ordered parts or steps of ${topic}. Each step should be something you could explain in ~2 minutes.`,
          example: `1) … 2) … 3) … for ${topic}`,
          memoryTrick: "Number the steps",
        },
        {
          title: "Why each step matters",
          explanation: `Under each step, add a short “why this matters” note so the chain isn’t just memorized labels.`,
          example: `Step 2 matters because without it, ___ fails.`,
          memoryTrick: "Label → reason",
        },
        {
          title: "Weak-spot check",
          explanation: `Mark any step you’d skip when explaining — that’s your study target.`,
          example: `I’d skip ___ → rewrite that step from the book once, then re-explain.`,
          memoryTrick: "Skipped = weak",
        },
      ];
    case "feynman":
      return [
        {
          title: "Plain-language core",
          explanation: `Explain ${topic} in 3–5 sentences with no jargon — as if the listener never took the class.`,
          example: `Say ${topic} out loud for 60 seconds using only everyday words.`,
          memoryTrick: "If you can’t say it simply, you don’t own it yet",
        },
        {
          title: "Jargon to translate",
          explanation: `List the jargon words that usually appear with ${topic} and define each in plain language.`,
          example: `Term → “in normal words, this means ___.”`,
          memoryTrick: "Circle every fancy word",
        },
        {
          title: "Analogy",
          explanation: `Pick one real-world analogy that maps to the core idea of ${topic}.`,
          example: `${topic} is like ___ because ___.`,
          memoryTrick: "Analogy = sticky picture",
        },
        {
          title: "Where the analogy breaks",
          explanation: `Note where the analogy fails so you don’t learn a misconception.`,
          example: `Unlike ___, ${topic} actually ___.`,
          memoryTrick: "Break points = exam traps",
        },
      ];
    case "visualization":
      return [
        {
          title: "Center node",
          explanation: `Put the main idea of ${topic} in the center of a page — one short label.`,
          example: `Center: ${topic}`,
          memoryTrick: "One center, not five",
        },
        {
          title: "Branches",
          explanation: `Add branches for definitions, examples, causes/effects, and contrasts related to ${topic}.`,
          example: `Branch: definition · Branch: example · Branch: vs ___`,
          memoryTrick: "At least 4 branches",
        },
        {
          title: "Arrows / relationships",
          explanation: `Draw arrows that show “leads to,” “vs,” or “includes” so relationships are visible.`,
          example: `A → B (causes) · A vs C (contrast)`,
          memoryTrick: "Arrows beat bullet lists",
        },
        {
          title: "Redraw from memory",
          explanation: `Cover labels and redraw the map for ${topic} from memory.`,
          example: `Blank page → center → branches → check`,
          memoryTrick: "Redraw = proof",
        },
      ];
    case "hands-on-practice":
      return [
        {
          title: "Setup",
          explanation: `State the skill you’re practicing for ${topic} in one line.`,
          example: `I will solve one mini problem about ${topic}.`,
          memoryTrick: "Name the skill",
        },
        {
          title: "Worked example",
          explanation: `Walk a tiny solved example of ${topic} step by step.`,
          example: `Given … → do … → result …`,
          memoryTrick: "Watch once",
        },
        {
          title: "Try it",
          explanation: `Change one number/detail and solve a similar item without peeking at the worked path.`,
          example: `Same pattern, new inputs for ${topic}.`,
          memoryTrick: "Change one thing",
        },
        {
          title: "Check criteria",
          explanation: `Write 2–3 checks you’d use to know the answer is right.`,
          example: `Check: units · edge case · matches definition of ${topic}`,
          memoryTrick: "Checks > vibes",
        },
      ];
    case "active-recall":
      return [
        {
          title: "Must-know #1",
          explanation: `Write the single most exam-likely fact or definition for ${topic}.`,
          example: `${topic}: ___`,
          memoryTrick: "One sentence answer key",
        },
        {
          title: "Must-know #2–3",
          explanation: `Add two more facts/examples you must be able to retrieve cold.`,
          example: `Fact · Example · Contrast`,
          memoryTrick: "Three bullets max",
        },
        {
          title: "Blurt",
          explanation: `Hide the key. Blurt everything you remember about ${topic} for 2–3 minutes.`,
          example: `Timer on → write → then uncover`,
          memoryTrick: "Retrieval > reread",
        },
        {
          title: "Gap cards",
          explanation: `Turn anything you missed into a flashcard or quiz question.`,
          example: `Q: …? A: … (from the gap)`,
          memoryTrick: "Missed → card",
        },
      ];
    case "chunking":
    default:
      return [
        {
          title: `What ${cleanTopic(topic)} is`,
          explanation: `${topic} is the core idea you'll use on exams. Start by stating what it is in one plain sentence, then what problem it solves.`,
          example: `Write: “${topic} means ___ so that ___.”`,
          memoryTrick: "Name it → define it → say why it exists.",
        },
        {
          title: "Key parts",
          explanation: `Break ${topic} into 2–4 labeled parts (definitions, pieces, or steps). Each part should be teachable in about two minutes.`,
          example: `List Part A / Part B / Part C for ${topic} with one phrase each.`,
          memoryTrick: "If a part needs more than ~2 minutes, split it.",
        },
        {
          title: "How the parts connect",
          explanation: `Order the parts: what must you understand before the next idea? Relationships matter more than isolated facts.`,
          example: `Draw arrows: Part A → Part B → outcome.`,
          memoryTrick: "Foundations first, then interactions.",
        },
        {
          title: "One worked example",
          explanation: `Apply ${topic} to a tiny concrete scenario (code, case, or story) so the labels stick.`,
          example: `Invent one mini scenario and label which part of ${topic} each moment uses.`,
          memoryTrick: "Example beats reread.",
        },
        {
          title: "Check yourself",
          explanation: `Cover notes and restate ${topic} using only your chunk titles as prompts.`,
          example: `Say each title, then one sentence — no peeking.`,
          memoryTrick: "Blank title = weak chunk.",
        },
      ];
  }
}

function cleanTopic(topic: string): string {
  return topic.trim() || "this topic";
}

/** High-quality offline lessons for common CS topics when free-tier AI is exhausted. */
function specializedChunkingLesson(topic: string): SixWorkedLesson | null {
  const key = topic.toLowerCase();
  if (
    /object[-\s]?oriented|oop\b|ood\b|classes?\s*&\s*objects|objects?\s+and\s+classes?|classes?\s+and\s+objects?|encapsulation|polymorphism/.test(
      key,
    ) && !/polymorphism\s+only/.test(key)
  ) {
    const chunks: SixLessonChunk[] = [
      {
        title: "Why do we need classes?",
        role: "context",
        explanation:
          "Imagine you're building a program for a car dealership. The dealership has hundreds of cars. Every car has a model, a color, a year, and a speed. Every car can accelerate, brake, and display its information. Without a shared pattern, you'd copy-paste the same variables and functions for every single car — and one typo would break only some of them.",
        example:
          "Dealership inventory: Toyota red 2020, Honda blue 2019, Ford black 2021 — same shape of data and behavior, repeated hundreds of times.",
        representation:
          "Car A: model, color, year, speed, accelerate()\nCar B: model, color, year, speed, accelerate()\nCar C: … (hundreds more — same shape)",
        checkPrompt:
          "In one sentence: what is awkward about describing hundreds of cars without a shared pattern?",
      },
      {
        title: "The problem",
        role: "problem",
        explanation:
          "We need one place that describes what EVERY car has and can do — then create many individual cars from that description. That shared description is a class. Each actual car in the program is an object created from the class.",
        example:
          "Problem: How could we represent all of these cars in Java without rewriting the same fields and methods for each one?",
        misconception:
          "A class is not one car. A class is the shared recipe; objects are the actual cars.",
      },
      {
        title: "Meet the class",
        role: "concept",
        explanation:
          "In Java, a class is a blueprint. It names the type and can later hold fields (data) and methods (behavior). An empty class still defines a new type you can create objects from. The word class introduces the blueprint; Car is the type name.",
        example: "class Car {\n}",
        representation:
          "Class Car  (blueprint)\n   │\n   └── can create → objects (actual cars)",
        breakdown:
          "class → keyword that starts a blueprint\nCar → the type name\n{ } → body (empty for now; fields and methods go here)",
        memoryTrick: "CLASS = cookie cutter · OBJECT = cookie",
        checkPrompt: "What does the name Car refer to in `class Car { }` — one car, or a type?",
      },
      {
        title: "Fields — what an object knows",
        role: "explain",
        explanation:
          "Fields are variables declared inside the class. They describe the data every Car object will have. Each object gets its own copy of those fields. Adding model, color, and speed to the class means every Car instance can store those values independently.",
        example:
          "class Car {\n    String model;\n    String color;\n    int speed;\n}",
        representation:
          "Car (class)\n├── model : String\n├── color : String\n└── speed : int",
        breakdown:
          "String model; → text field for the car model\nString color; → text field for color\nint speed; → whole-number field for current speed\nThese live inside the class so every object has them.",
        memoryTrick: "Fields = what the object KNOWS",
      },
      {
        title: "Methods — what an object does",
        role: "explain",
        explanation:
          "Methods are behaviors. When accelerate runs on a particular object, it changes THAT object's speed. The method body uses the object's own fields. Calling accelerate does not create a new car — it updates state on the car you call it on.",
        example:
          "void accelerate() {\n    speed += 10;\n}",
        breakdown:
          "void → method returns nothing\naccelerate() → name of the behavior\nspeed += 10; → increase this object's speed by 10 when the method runs",
        memoryTrick: "Fields = HAS · Methods = DOES",
        checkPrompt: "If car1.accelerate() runs, whose speed changes — car1's, car2's, or both?",
      },
      {
        title: "Create an object with new",
        role: "worked",
        explanation:
          "An object is a live instance built from the class. The new keyword asks Java to create that instance in memory. The variable (car1) holds a reference — a way to find that object later. The type on the left (Car) must match the class you construct.",
        example: "Car car1 = new Car();",
        representation:
          "car1  ──reference──►  [ Car object ]\n                      model=?\n                      color=?\n                      speed=?",
        breakdown:
          "Car → type (must match the class)\ncar1 → reference variable (name you use later)\nnew Car() → creates a brand-new Car object in memory\n= → stores the reference to that object in car1",
        misconception:
          "new Car() does not only declare a variable — it creates the object. The variable holds a reference to it.",
        checkPrompt: "In `Car car1 = new Car();`, what does `new Car()` do?",
      },
      {
        title: "Two objects, two identities",
        role: "visualize",
        explanation:
          "Creating a second object with new Car() builds a separate instance. car1 and car2 are different references to different objects. Changing one object's fields does not change the other's — that is object state.",
        example:
          'Car car1 = new Car();\nCar car2 = new Car();\ncar1.color = "Red";\ncar2.color = "Blue";',
        representation:
          "car1 → [Car] color=Red\ncar2 → [Car] color=Blue\n\nSame class, different objects, different state.",
        breakdown:
          "new Car() twice → two separate objects\ncar1.color = \"Red\" → only the first object's color field\ncar2.color = \"Blue\" → only the second object's color field",
        checkPrompt:
          "After setting car1.color to Red and car2.color to Blue, what is car1.color?",
      },
      {
        title: "Why constructors exist",
        role: "clarify",
        explanation:
          "So far we created empty objects and set fields afterward. That is easy to forget a field. A constructor runs automatically when new creates the object. It sets up initial state so a Car starts valid — with a model and color already assigned.",
        example: 'Car car1 = new Car("Toyota", "Red");',
        breakdown:
          "new Car(\"Toyota\", \"Red\") → create object AND pass starting values\nConstructor parameters map into fields inside the class\nAfter this line, car1 already has model and color set",
        misconception:
          "Constructors are not optional magic — they exist to initialize objects safely at creation time.",
      },
      {
        title: "Your turn — recognize and apply",
        role: "guided",
        explanation:
          "You should now recognize: class = blueprint, object = instance, field = data, method = behavior, new = create, reference = variable pointing at the object, constructor = initialize on create. Next, apply it: invent one more field or method for Car and say what changes when you call it on car1 only.",
        example:
          "// Sketch:\n// class Car { String model; String color; int speed;\n//   void brake() { speed = Math.max(0, speed - 10); }\n// }\n// Car mine = new Car(\"Honda\", \"Silver\");",
        checkPrompt:
          "Write one sentence: what is the difference between the Car class and the object referenced by car1?",
        representation:
          "Class Car\n├── fields: model, color, speed\n├── methods: accelerate(), brake()\n└── creates → car1, car2, … (each with own state)",
      },
      {
        title: "Encapsulation (next concept)",
        role: "next",
        explanation:
          "Once you can create objects and change their state, the next idea is protecting that state: private fields and public methods (encapsulation) so invalid values cannot sneak in from outside code.",
        example:
          "private double balance;\npublic double getBalance() { return balance; }",
        memoryTrick: "Encapsulation = PROTECT THE DATA",
      },
    ];

    return {
      component: "chunking",
      topic,
      learningFrame:
        "You're learning Classes & Objects through a real teaching sequence — dealership problem → class → fields → methods → new → state → constructors.",
      roadmap: chunks.map((chunk) => chunk.title),
      chunks,
      cheatSheet:
        "WHY (many similar things) → CLASS (blueprint) → FIELDS (knows) → METHODS (does) → new (create) → REFERENCES (point at objects) → STATE (each object independent) → CONSTRUCTOR (initialize) → next: encapsulation",
      practicePrompts: [
        {
          title: "Recognize it",
          prompt:
            "Look at `Car c = new Car();` — name the type, the reference variable, and what creates the object.",
          tip: "Type · variable · new ClassName()",
        },
        {
          title: "Explain it",
          prompt:
            "In your own words: why does changing car1.color not change car2.color?",
          tip: "Two objects → two separate states.",
        },
        {
          title: "Apply it",
          prompt:
            "Add a field year and a method displayInfo() that prints model and color. Create two Car objects with different values.",
          tip: "Start from the class body, then new twice.",
        },
      ],
    };
  }

  if (/binary search tree|\bbst\b/.test(key)) {
    const chunks: SixLessonChunk[] = [
      {
        title: "What a BST is",
        explanation:
          "A binary search tree stores comparable keys so left children are smaller and right children are larger than the parent — search can skip half the tree each step when balanced.",
        example: "Insert 8, then 3, then 10 → 3 goes left of 8, 10 goes right.",
        memoryTrick: "Left smaller · right larger",
      },
      {
        title: "Search",
        explanation:
          "Compare the target to the current node; go left or right until you find it or hit null.",
        example: "Looking for 3 in tree rooted at 8 → go left → found.",
        memoryTrick: "Ask: smaller or larger?",
      },
      {
        title: "Insert",
        explanation:
          "Walk like search until you find an empty spot, then attach the new node there.",
        example: "Insert 6 under 3 → 6 > 3 so go right of 3.",
        memoryTrick: "Search path → empty link → hang new node",
      },
      {
        title: "Traversals",
        explanation:
          "Inorder visits left-root-right and yields sorted keys. Preorder/postorder serve copy and delete patterns.",
        example: "Inorder on a BST prints keys ascending.",
        memoryTrick: "Inorder = sorted tour",
      },
      {
        title: "Balance & cost",
        explanation:
          "Ideal height is ~log n. A skewed tree becomes a linked list and search costs O(n).",
        example: "Insert 1,2,3,4 in order with no rotations → a stick to the right.",
        memoryTrick: "Skinny tree = slow tree",
      },
    ];
    return {
      component: "chunking",
      topic,
      learningFrame:
        "You're learning Binary Search Trees via chunking — structure, search/insert, traversals, then why balance matters.",
      roadmap: chunks.map((chunk) => chunk.title),
      chunks,
      cheatSheet: "BST rule → search → insert → inorder sorted → balance = speed",
      practicePrompts: defaultPracticePrompts(topic, chunks),
    };
  }

  return null;
}
