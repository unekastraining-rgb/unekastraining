/**
 * Bundle I — Build interactive activities from canonical Knowledge Library fields.
 * Only uses authored content; never invents examples / misconceptions / diagrams.
 */

import { findInstructionalConceptById } from "@/lib/learning/knowledge/instructional-library";
import type {
  InteractiveActivity,
  InteractiveForm,
} from "@/lib/learning/activity/runtime/types";
import type { LearningActivityType } from "@/lib/learning/activity/framework/types";
import { buildExtendedInteractiveForm } from "@/lib/learning/activity/runtime/build-extended-forms";

function hashPick(seed: string, size: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % Math.max(size, 1);
}

function shuffle<T>(items: T[], seed: string): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = hashPick(`${seed}:${i}`, i + 1);
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

function firstMisconception(concept: {
  misconceptionDetails?: Array<{
    misconception: string;
    correction?: string;
    contrast?: string;
  }>;
  misconception?: string;
  misconceptions?: string[];
}): InteractiveActivity["authoredMisconception"] | undefined {
  const d = concept.misconceptionDetails?.[0];
  if (d?.misconception) {
    return {
      misconception: d.misconception,
      correction: d.correction,
      contrast: d.contrast,
    };
  }
  const m = concept.misconception ?? concept.misconceptions?.[0];
  if (m) return { misconception: m };
  return undefined;
}

/** Parse “Solve 2x + 3 = 11 → … → x = 4” into equation + answer when present. */
export function parseEquationFromExample(
  example: string | undefined,
): { equation: string; answer: string } | null {
  if (!example?.trim()) return null;
  const solveMatch = example.match(
    /Solve\s+(.+?)\s*→(?:.+\s*→)?\s*x\s*=\s*([-\d.\/]+)/i,
  );
  if (solveMatch?.[1] && solveMatch[2]) {
    return { equation: solveMatch[1].trim(), answer: solveMatch[2].trim() };
  }
  const eq = example.match(
    /^(.+?=\s*[^\n→]+)\s*→(?:.+\s*→)?\s*x\s*=\s*([-\d.\/]+)/i,
  );
  if (eq?.[1] && eq[2]) {
    return { equation: eq[1].trim(), answer: eq[2].trim() };
  }
  return null;
}

function recognitionFromConcept(input: {
  conceptId: string;
  title: string;
  relatedTitles: string[];
  activityType: LearningActivityType;
  subject?: string;
  domain?: string;
  misconception?: InteractiveActivity["authoredMisconception"];
  relatedConceptIds: string[];
}): InteractiveActivity {
  const distractors = input.relatedTitles
    .filter((t) => t.toLowerCase() !== input.title.toLowerCase())
    .slice(0, 3);
  while (distractors.length < 2) {
    distractors.push(
      distractors.length === 0
        ? "A related but different idea"
        : "An outcome, not this concept",
    );
  }
  const choices = shuffle([input.title, ...distractors.slice(0, 3)], input.conceptId);
  const correctIndex = choices.findIndex(
    (c) => c.toLowerCase() === input.title.toLowerCase(),
  );
  return {
    id: `${input.conceptId}:recognize`,
    conceptId: input.conceptId,
    conceptTitle: input.title,
    subject: input.subject,
    domain: input.domain,
    form: "multiple_choice",
    activityType: input.activityType,
    prompt: `Which idea are you practicing?`,
    label: "Recognition",
    choices,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    relatedConceptIds: input.relatedConceptIds,
    authoredMisconception: input.misconception,
    revealAnswerPolicy: "never_auto",
  };
}

/**
 * Prefer a subject-aware form when KL practiceForms + fields support it.
 * Falls back to recognition / explain — never fabricates richness.
 */
export function buildInteractiveActivityForConcept(
  conceptId: string,
  preferredForm?: InteractiveForm,
): InteractiveActivity | null {
  const hit = findInstructionalConceptById(conceptId);
  if (!hit) return null;
  const c = hit.concept;
  const forms = (c.practiceForms ?? []).map((f) => f.toLowerCase());
  const relatedIds = [
    ...(c.relatedConcepts ?? []),
    ...(c.relationships?.map((r) => r.targetConceptId) ?? []),
  ].filter(Boolean);
  const relatedTitles = relatedIds
    .map((id) => findInstructionalConceptById(id)?.concept.title)
    .filter((t): t is string => Boolean(t));
  const misconception = firstMisconception(c);
  const base = {
    conceptId: c.id,
    title: c.title,
    relatedTitles,
    subject: hit.pack.subject,
    domain: hit.pack.domain,
    misconception,
    relatedConceptIds: relatedIds.slice(0, 6),
  };

  const want = preferredForm;

  // Bundle J — extended recognition forms when explicitly requested
  if (
    want === "true_false" ||
    want === "multi_select" ||
    want === "matching"
  ) {
    const extended = buildExtendedInteractiveForm(conceptId, want);
    if (extended?.form === want) return extended;
    return null;
  }

  // Math equation solve from authored example
  if (
    (want === "equation_solve" ||
      forms.some((f) => /solve|check|compute/.test(f)) ||
      hit.pack.domain === "math") &&
    (want === "equation_solve" || want == null || want === "fill_in")
  ) {
    const parsed = parseEquationFromExample(c.example);
    if (parsed) {
      return {
        id: `${c.id}:equation`,
        conceptId: c.id,
        conceptTitle: c.title,
        subject: hit.pack.subject,
        domain: hit.pack.domain,
        form: "equation_solve",
        activityType: "problem-solving",
        prompt: `Solve for x:\n\n${parsed.equation}`,
        label: "Equation",
        expectedAnswer: parsed.answer,
        answerAliases: [parsed.answer, `x=${parsed.answer}`, `x = ${parsed.answer}`],
        relatedConceptIds: relatedIds.slice(0, 6),
        authoredMisconception: misconception,
        revealAnswerPolicy: "never_auto",
      };
    }
  }

  // Java / programming — predict from authored code example
  if (
    (want === "code_predict" ||
      want === "code_trace" ||
      forms.some((f) => /predict|trace|code/.test(f)) ||
      hit.pack.domain === "programming") &&
    c.example &&
    /[{;]|System\.out|public |class |void /.test(c.example)
  ) {
    if (want == null || want === "code_predict" || want === "code_trace") {
      const neighbors = relatedTitles.slice(0, 3);
      if (neighbors.length >= 1 && forms.some((f) => /predict|identify/.test(f))) {
        const choices = shuffle(
          [c.title, ...neighbors].slice(0, 4),
          `${c.id}:code`,
        );
        return {
          id: `${c.id}:code-predict`,
          conceptId: c.id,
          conceptTitle: c.title,
          subject: hit.pack.subject,
          domain: hit.pack.domain,
          form: "code_predict",
          activityType: "coding",
          prompt:
            "Inspect this code. Which concept best explains what it demonstrates?",
          label: "Code inspect",
          codeSnippet: c.example,
          choices,
          correctIndex: choices.findIndex(
            (x) => x.toLowerCase() === c.title.toLowerCase(),
          ),
          relatedConceptIds: relatedIds.slice(0, 6),
          authoredMisconception: misconception,
          revealAnswerPolicy: "never_auto",
        };
      }
      return {
        id: `${c.id}:code-explain`,
        conceptId: c.id,
        conceptTitle: c.title,
        subject: hit.pack.subject,
        domain: hit.pack.domain,
        form: "code_write",
        activityType: "coding",
        prompt:
          "Explain what this code does, or write a short variant that uses the same idea.",
        label: "Code apply",
        codeSnippet: c.example,
        relatedConceptIds: relatedIds.slice(0, 6),
        authoredMisconception: misconception,
        revealAnswerPolicy: "never_auto",
      };
    }
  }

  // SQL write — only for SQL family / sql practiceForms (not generic "write")
  const isSqlConcept =
    c.id.startsWith("sql-") ||
    hit.pack.subject === "sql" ||
    (hit.pack.domain === "programming" && hit.pack.subject === "sql") ||
    forms.some((f) => /sql|join|query/.test(f));
  if (
    isSqlConcept &&
    (want === "sql_write" || want == null)
  ) {
    const tables =
      c.representation?.includes("customers") || c.example?.includes("FROM")
        ? "Tables (from teaching example):\ncustomers(id, name)\norders(id, customer_id)"
        : c.representation?.trim() || undefined;
    return {
      id: `${c.id}:sql`,
      conceptId: c.id,
      conceptTitle: c.title,
      subject: hit.pack.subject,
      domain: hit.pack.domain,
      form: "sql_write",
      activityType: "sql",
      prompt:
        c.checkPrompt?.trim() ||
        `Write a SQL query that demonstrates ${c.title}.`,
      label: "SQL",
      codeSnippet: c.example,
      tablesPreview: tables,
      expectedAnswer: undefined, // open educational write — scored as attempted/completed
      relatedConceptIds: relatedIds.slice(0, 6),
      authoredMisconception: misconception,
      revealAnswerPolicy: "never_auto",
    };
  }

  // Biology / science diagram label from authored representation
  if (
    (want === "diagram_label" ||
      forms.some((f) => /diagram|label|model/.test(f)) ||
      hit.pack.domain === "science" ||
      hit.pack.subject === "biology") &&
    (c.representation || (c.visualModels && c.visualModels.length > 0)) &&
    (want == null || want === "diagram_label")
  ) {
    const diagram = c.representation ?? c.visualModels?.[0];
    if (diagram) {
      return {
        id: `${c.id}:diagram`,
        conceptId: c.id,
        conceptTitle: c.title,
        subject: hit.pack.subject,
        domain: hit.pack.domain,
        form: "diagram_label",
        activityType: "visual",
        prompt: `Using this model, name the process or structure being described.`,
        label: "Diagram",
        diagramHint: diagram,
        expectedAnswer: c.title,
        answerAliases: [c.title, ...(c.aliases ?? []).slice(0, 3)],
        relatedConceptIds: relatedIds.slice(0, 6),
        authoredMisconception: misconception,
        revealAnswerPolicy: "never_auto",
      };
    }
  }

  // Economics / scenario / prediction — only when domain or practiceForms support it
  const supportsScenario =
    forms.some((f) => /scenario|predict|interpret|apply/.test(f)) ||
    hit.pack.subject === "economics" ||
    c.id.startsWith("economics-") ||
    (hit.pack.domain === "business" &&
      /econ|market|supply|demand/.test(
        `${hit.pack.subject} ${c.id} ${c.title}`.toLowerCase(),
      ));
  if (
    supportsScenario &&
    (want === "prediction" || want === "scenario" || want == null)
  ) {
    const graph = c.representation?.trim();
    const scenarioStem =
      c.examples?.[0] ??
      c.example ??
      c.checkPrompt ??
      `Apply ${c.title} to a market situation.`;
    if (relatedTitles.length >= 1) {
      const choices = shuffle(
        [c.title, ...relatedTitles].slice(0, 4),
        `${c.id}:econ`,
      );
      return {
        id: `${c.id}:scenario`,
        conceptId: c.id,
        conceptTitle: c.title,
        subject: hit.pack.subject,
        domain: hit.pack.domain,
        form: "prediction",
        activityType: "simulation",
        prompt: `${scenarioStem.slice(0, 320)}\n\nWhich concept should guide your prediction?`,
        label: "Scenario",
        graphHint: graph,
        choices,
        correctIndex: choices.findIndex(
          (x) => x.toLowerCase() === c.title.toLowerCase(),
        ),
        relatedConceptIds: relatedIds.slice(0, 6),
        authoredMisconception: misconception,
        revealAnswerPolicy: "never_auto",
      };
    }
    return {
      id: `${c.id}:scenario-open`,
      conceptId: c.id,
      conceptTitle: c.title,
      subject: hit.pack.subject,
      domain: hit.pack.domain,
      form: "scenario",
      activityType: "simulation",
      prompt: scenarioStem.slice(0, 400),
      label: "Scenario",
      graphHint: graph,
      relatedConceptIds: relatedIds.slice(0, 6),
      authoredMisconception: misconception,
      revealAnswerPolicy: "never_auto",
    };
  }

  // Writing — distinguish / identify from related titles
  if (
    (want === "multiple_choice" ||
      forms.some((f) => /identify|compare|diagnose|distinguish/.test(f)) ||
      c.id.startsWith("writing-")) &&
    relatedTitles.length >= 1 &&
    (want == null || want === "multiple_choice")
  ) {
    return recognitionFromConcept({
      ...base,
      activityType: "writing",
    });
  }

  // Ordering from procedures when authored
  if (
    (want === "ordering" || forms.some((f) => /order|sequence|procedure/.test(f))) &&
    (c.procedures?.length ?? 0) >= 3 &&
    (want == null || want === "ordering")
  ) {
    const correctOrder = c.procedures!.slice(0, 5);
    return {
      id: `${c.id}:order`,
      conceptId: c.id,
      conceptTitle: c.title,
      subject: hit.pack.subject,
      domain: hit.pack.domain,
      form: "ordering",
      activityType: "practice",
      prompt: `Put these steps for ${c.title} in a sensible order.`,
      label: "Ordering",
      orderItems: shuffle(correctOrder, `${c.id}:order`),
      correctOrder,
      relatedConceptIds: relatedIds.slice(0, 6),
      authoredMisconception: misconception,
      revealAnswerPolicy: "never_auto",
    };
  }

  // Explain / teach-back
  if (
    want === "explain" ||
    forms.some((f) => /explain|teach-back|write/.test(f)) ||
    want == null
  ) {
    if (want === "explain" || forms.some((f) => /explain|teach-back/.test(f))) {
      return {
        id: `${c.id}:explain`,
        conceptId: c.id,
        conceptTitle: c.title,
        subject: hit.pack.subject,
        domain: hit.pack.domain,
        form: "explain",
        activityType: "practice",
        prompt:
          c.checkPrompt?.trim() ||
          `In your own words, explain ${c.title} and give one concrete example.`,
        label: "Explain",
        relatedConceptIds: relatedIds.slice(0, 6),
        authoredMisconception: misconception,
        revealAnswerPolicy: "never_auto",
      };
    }
  }

  return recognitionFromConcept({
    ...base,
    activityType: "practice",
  });
}

/**
 * List interactive forms that can actually be built for a concept (no fakes).
 */
export function listAvailableInteractiveForms(
  conceptId: string,
): InteractiveForm[] {
  const forms: InteractiveForm[] = [];
  const candidates: InteractiveForm[] = [
    "equation_solve",
    "code_predict",
    "sql_write",
    "diagram_label",
    "prediction",
    "ordering",
    "true_false",
    "multi_select",
    "matching",
    "multiple_choice",
    "explain",
  ];
  for (const form of candidates) {
    const built = buildInteractiveActivityForConcept(conceptId, form);
    if (built?.form === form) forms.push(form);
  }
  if (forms.length === 0) {
    const fallback = buildInteractiveActivityForConcept(conceptId);
    if (fallback) forms.push(fallback.form);
  }
  return forms;
}
