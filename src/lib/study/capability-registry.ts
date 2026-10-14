/**
 * Bundle K — Canonical user-facing capability registry.
 * Navigation + contextual launch metadata only.
 * Does not invent engines; directPath points at existing surfaces.
 */

import { listSupportedPracticeLandscape } from "@/lib/study/practice-landscape";
import { SIX_ACTIVITIES } from "@/lib/csl/six";

export type CapabilityMaturity =
  | "full"
  | "guided"
  | "workspace"
  | "catalog";

export type StudyCapabilityId =
  | "learn"
  | "practice"
  | "quizzes"
  | "flashcards"
  | "games"
  | "coding"
  | "sql"
  | "math"
  | "labs"
  | "simulations"
  | "projects"
  | "presentations"
  | "writing"
  | "networking"
  | "language"
  | "tutor"
  | "retention"
  | "notes"
  | "six"
  | "planner"
  | "haul";

export type StudyCapability = {
  id: StudyCapabilityId;
  label: string;
  description: string;
  /** Existing product route — never a parallel engine. */
  directPath: string;
  /** Locker grouping */
  lockerGroup: "study-tools" | "activities" | "materials" | "none";
  maturity: CapabilityMaturity;
  /** Soft subject hints for contextual offer (empty = general). */
  subjectHints: readonly string[];
  requiresConcept: boolean;
  /** Show in Learning Studio capability strip when hints/forms match. */
  contextualInLearning: boolean;
};

const CAPABILITIES: StudyCapability[] = [
  {
    id: "learn",
    label: "Learn",
    description: "Guided teaching for a topic — Adaptive decides what to show next.",
    directPath: "/study/teach-me",
    lockerGroup: "study-tools",
    maturity: "full",
    subjectHints: [],
    requiresConcept: false,
    contextualInLearning: false,
  },
  {
    id: "practice",
    label: "Practice",
    description: "Choose how you want to practice — coding, labs, games, and more.",
    directPath: "/study/practice-hub",
    lockerGroup: "study-tools",
    maturity: "catalog",
    subjectHints: [],
    requiresConcept: false,
    contextualInLearning: true,
  },
  // /study/choose — interactive form chooser (Quick Check, Match It, …) is linked from practice-hub.
  {
    id: "quizzes",
    label: "Quizzes",
    description: "Check what you know with a quiz.",
    directPath: "/quizzes",
    lockerGroup: "study-tools",
    maturity: "full",
    subjectHints: [],
    requiresConcept: false,
    contextualInLearning: true,
  },
  {
    id: "flashcards",
    label: "Flashcards",
    description: "Spaced review cards.",
    directPath: "/flashcards",
    lockerGroup: "study-tools",
    maturity: "full",
    subjectHints: [],
    requiresConcept: false,
    contextualInLearning: true,
  },
  {
    id: "retention",
    label: "Lucky",
    description: "Scheduled retention and recall practice.",
    directPath: "/study/lucky",
    lockerGroup: "study-tools",
    maturity: "full",
    subjectHints: [],
    requiresConcept: false,
    contextualInLearning: true,
  },
  {
    id: "notes",
    label: "Core Notes",
    description: "Notebook, ink, and academic creation.",
    directPath: "/core",
    lockerGroup: "study-tools",
    maturity: "full",
    subjectHints: [],
    requiresConcept: false,
    contextualInLearning: false,
  },
  {
    id: "haul",
    label: "The Haul",
    description: "Structured writing: plan, draft, feedback, revise.",
    directPath: "/haul",
    lockerGroup: "study-tools",
    maturity: "full",
    subjectHints: ["writing", "essay", "thesis", "rhetoric", "composition"],
    requiresConcept: false,
    contextualInLearning: true,
  },
  {
    id: "six",
    label: "Six Techniques",
    description: "Chunking, Feynman, visualization, and other guided methods.",
    directPath: "/study/six",
    lockerGroup: "study-tools",
    maturity: "full",
    subjectHints: [],
    requiresConcept: false,
    contextualInLearning: true,
  },
  {
    id: "tutor",
    label: "Tutor",
    description: "Talk through what you're learning.",
    directPath: "/dashboard?tab=chat",
    lockerGroup: "study-tools",
    maturity: "full",
    subjectHints: [],
    requiresConcept: false,
    contextualInLearning: true,
  },
  {
    id: "planner",
    label: "Planner",
    description: "Upcoming study, assignments, and scheduled reviews.",
    directPath: "/planner",
    lockerGroup: "none",
    maturity: "workspace",
    subjectHints: [],
    requiresConcept: false,
    contextualInLearning: false,
  },
  {
    id: "games",
    label: "Games",
    description: "Short learning games — match, classify, challenge rounds.",
    directPath: "/study/games",
    lockerGroup: "activities",
    maturity: "guided",
    subjectHints: ["vocab", "biology", "network", "match"],
    requiresConcept: false,
    contextualInLearning: true,
  },
  {
    id: "coding",
    label: "Coding",
    description: "Guided coding practice with tests where supported.",
    directPath: "/study/activities/coding",
    lockerGroup: "activities",
    maturity: "guided",
    subjectHints: ["java", "python", "javascript", "code", "programming", "oop"],
    requiresConcept: true,
    contextualInLearning: true,
  },
  {
    id: "sql",
    label: "SQL",
    description: "SQL writing practice with schema context.",
    directPath: "/study/activities/sql",
    lockerGroup: "activities",
    maturity: "guided",
    subjectHints: ["sql", "database", "query", "join"],
    requiresConcept: true,
    contextualInLearning: true,
  },
  {
    id: "math",
    label: "Math",
    description: "Guided math workspace.",
    directPath: "/study/activities/math",
    lockerGroup: "activities",
    maturity: "full",
    subjectHints: ["math", "algebra", "equation", "calculus"],
    requiresConcept: true,
    contextualInLearning: true,
  },
  {
    id: "labs",
    label: "Labs",
    description: "Staged guided labs — observe, record, explain.",
    directPath: "/study/activities/lab",
    lockerGroup: "activities",
    maturity: "guided",
    subjectHints: ["lab", "biology", "physics", "experiment", "observe"],
    requiresConcept: true,
    contextualInLearning: true,
  },
  {
    id: "simulations",
    label: "Simulations",
    description: "Scenarios with controls, outcomes, and reflection.",
    directPath: "/study/activities/simulation",
    lockerGroup: "activities",
    maturity: "guided",
    subjectHints: ["simulation", "market", "economy", "supply", "demand", "network"],
    requiresConcept: true,
    contextualInLearning: true,
  },
  {
    id: "projects",
    label: "Projects",
    description: "Project brief, plan, work, and review.",
    directPath: "/study/activities/project",
    lockerGroup: "activities",
    maturity: "workspace",
    subjectHints: ["project", "build", "feature", "plan"],
    requiresConcept: true,
    contextualInLearning: true,
  },
  {
    id: "presentations",
    label: "Presentations",
    description: "Presentation builder — guided draft (outline + talking points).",
    directPath: "/study/activities/presentation",
    lockerGroup: "activities",
    maturity: "guided",
    subjectHints: ["presentation", "speech", "outline", "talk"],
    requiresConcept: true,
    contextualInLearning: true,
  },
  {
    id: "writing",
    label: "Writing practice",
    description: "Short writing exercises with structured feedback.",
    directPath: "/study/activities/writing",
    lockerGroup: "activities",
    maturity: "guided",
    subjectHints: ["writing", "essay", "explain"],
    requiresConcept: true,
    contextualInLearning: true,
  },
  {
    id: "networking",
    label: "Networking",
    description: "Troubleshoot network scenarios in a guided workspace.",
    directPath: "/study/activities/networking",
    lockerGroup: "activities",
    maturity: "full",
    subjectHints: ["network", "dns", "dhcp", "routing"],
    requiresConcept: true,
    contextualInLearning: true,
  },
  {
    id: "language",
    label: "Language",
    description: "Speaking, listening, and conversation practice.",
    directPath: "/study/activities/language",
    lockerGroup: "activities",
    maturity: "guided",
    subjectHints: ["language", "spanish", "french", "conversation"],
    requiresConcept: true,
    contextualInLearning: true,
  },
];

export function listStudyCapabilities(): readonly StudyCapability[] {
  return CAPABILITIES;
}

export function getStudyCapability(
  id: StudyCapabilityId | string,
): StudyCapability | null {
  return CAPABILITIES.find((c) => c.id === id) ?? null;
}

export function listLockerCapabilities(group?: StudyCapability["lockerGroup"]) {
  return CAPABILITIES.filter((c) => {
    if (c.lockerGroup === "none") return false;
    if (group) return c.lockerGroup === group;
    return true;
  });
}

/** Capabilities relevant for a topic/subject string + optional KL practiceForms. */
export function listContextualCapabilities(input: {
  topicOrSubject?: string | null;
  practiceForms?: readonly string[] | null;
}): StudyCapability[] {
  const hay = (input.topicOrSubject ?? "").toLowerCase();
  const forms = (input.practiceForms ?? []).map((f) => f.toLowerCase());
  return CAPABILITIES.filter((cap) => {
    if (!cap.contextualInLearning) return false;
    if (cap.subjectHints.length === 0 && !forms.length) {
      return (
        cap.id === "practice" ||
        cap.id === "quizzes" ||
        cap.id === "flashcards" ||
        cap.id === "six" ||
        cap.id === "retention"
      );
    }
    const hintHit =
      cap.subjectHints.length === 0 ||
      cap.subjectHints.some((h) => hay.includes(h));
    const formHit =
      forms.length === 0 ||
      (cap.id === "coding" && forms.some((f) => /code|debug|implement/.test(f))) ||
      (cap.id === "sql" && forms.some((f) => /sql|query|join/.test(f))) ||
      (cap.id === "math" && forms.some((f) => /solve|compute|equation/.test(f))) ||
      (cap.id === "haul" && forms.some((f) => /write|outline|revise|essay/.test(f))) ||
      (cap.id === "labs" && forms.some((f) => /lab|observe|diagram|label/.test(f))) ||
      (cap.id === "simulations" && forms.some((f) => /scenario|simulat|predict/.test(f))) ||
      (cap.id === "games" && forms.some((f) => /match|identify|classify/.test(f))) ||
      (cap.id === "presentations" && forms.some((f) => /present|outline|speak/.test(f))) ||
      (cap.id === "projects" && forms.some((f) => /project|build/.test(f))) ||
      ["practice", "quizzes", "flashcards", "six", "retention", "tutor"].includes(
        cap.id,
      );
    return hintHit || formHit;
  });
}

export function buildCapabilityHref(
  capability: StudyCapability,
  ctx?: {
    courseId?: string | null;
    topic?: string | null;
    conceptId?: string | null;
    materialId?: string | null;
    /** Bundle M — preserve catalog/Learning deep-link into activity workspaces. */
    challengeId?: string | null;
  },
): string {
  // Games with an explicit challenge → open that game workspace directly.
  if (
    capability.id === "games" &&
    ctx?.challengeId?.trim()
  ) {
    const params = new URLSearchParams();
    params.set("challengeId", ctx.challengeId.trim());
    if (ctx.courseId) params.set("courseId", ctx.courseId);
    if (ctx.topic) params.set("topic", ctx.topic);
    if (ctx.conceptId) params.set("conceptId", ctx.conceptId);
    if (ctx.materialId) params.set("materialId", ctx.materialId);
    return `/study/activities/game?${params.toString()}`;
  }
  const params = new URLSearchParams();
  if (ctx?.courseId) params.set("courseId", ctx.courseId);
  if (ctx?.topic) params.set("topic", ctx.topic);
  if (ctx?.conceptId) params.set("conceptId", ctx.conceptId);
  if (ctx?.materialId) params.set("materialId", ctx.materialId);
  if (ctx?.challengeId) params.set("challengeId", ctx.challengeId);
  const qs = params.toString();
  if (!qs) return capability.directPath;
  return capability.directPath.includes("?")
    ? `${capability.directPath}&${qs}`
    : `${capability.directPath}?${qs}`;
}

/** Integrity: practice landscape activity keys stay aligned with registry activities. */
export function practiceLandscapeAlignsWithRegistry(): boolean {
  const landscape = listSupportedPracticeLandscape();
  for (const item of landscape) {
    if (!item.activityKey) continue;
    const cap = CAPABILITIES.find(
      (c) =>
        c.directPath === `/study/activities/${item.activityKey}` ||
        (item.activityKey === "lab" && c.id === "labs") ||
        (item.activityKey === "simulation" && c.id === "simulations") ||
        (item.activityKey === "project" && c.id === "projects") ||
        (item.activityKey === "presentation" && c.id === "presentations") ||
        (item.activityKey === "game" && c.id === "games") ||
        c.id === item.activityKey,
    );
    if (!cap) return false;
  }
  return SIX_ACTIVITIES.length === 6;
}
