/**
 * 2P-41 — Language workspace progression (English ↔ Spanish).
 */

import type { ContentProgressionEntry } from "@/lib/learning/content-progression/types";

function entry(
  partial: Omit<ContentProgressionEntry, "contentVersion" | "authorship"> & {
    authorship?: ContentProgressionEntry["authorship"];
    contentVersion?: string;
    ownerLearnerId?: string | null;
    readiness?: ContentProgressionEntry["readiness"];
  },
): ContentProgressionEntry {
  return {
    ...partial,
    authorship: partial.authorship ?? "system",
    contentVersion: partial.contentVersion ?? `v1:${partial.contentKey}`,
    ownerLearnerId: partial.ownerLearnerId ?? null,
    readiness: partial.readiness ?? "READY",
  };
}

export const LANGUAGE_WORKSPACE_PROGRESSION_ENTRIES: ContentProgressionEntry[] =
  [
    entry({
      contentKey: "lang-ws-speak-train",
      conceptKey: "english-travel-phrases",
      conceptTitle: "English travel phrases",
      stage: "PRACTICE",
      difficulty: 2,
      contextVariant: "train-station-help",
      activityKind: "language",
      contentId: "lang-speak-train-station",
      objective: "Produce the train-station help phrase.",
      domainContext: "languages",
    }),
    entry({
      contentKey: "lang-ws-speak-es-greeting",
      conceptKey: "spanish-greetings",
      conceptTitle: "Spanish greetings",
      stage: "PRACTICE",
      difficulty: 2,
      contextVariant: "es-greeting",
      activityKind: "language",
      contentId: "lang-speak-es-greeting",
      objective: "Produce a Spanish greeting response.",
      domainContext: "languages",
    }),
    entry({
      contentKey: "lang-ws-listen-store",
      conceptKey: "english-listening-comprehension",
      conceptTitle: "English listening comprehension",
      stage: "PRACTICE",
      difficulty: 2,
      contextVariant: "store-open",
      activityKind: "language",
      contentId: "lang-listen-store-hours",
      objective: "Identify the heard store-hours question.",
      domainContext: "languages",
    }),
    entry({
      contentKey: "lang-ws-listen-cognate",
      conceptKey: "spanish-english-cognates",
      conceptTitle: "Spanish–English cognates",
      stage: "APPLY",
      difficulty: 2,
      contextVariant: "cognate-informacion",
      activityKind: "language",
      contentId: "lang-listen-es-cognate",
      objective: "Recognize información via listening choice.",
      domainContext: "languages",
    }),
    entry({
      contentKey: "lang-ws-convo-greeting",
      conceptKey: "spanish-greetings",
      conceptTitle: "Spanish greetings",
      stage: "APPLY",
      difficulty: 2,
      contextVariant: "hola-como-estas",
      activityKind: "language",
      contentId: "lang-convo-es-greeting",
      objective: "Reply to Hola with an accepted greeting.",
      domainContext: "languages",
    }),
    entry({
      contentKey: "lang-ws-speak-sva",
      conceptKey: "subject-verb-agreement",
      conceptTitle: "Subject–verb agreement",
      stage: "APPLY",
      difficulty: 3,
      contextVariant: "sva-list-items",
      activityKind: "language",
      contentId: "lang-speak-sva-fix",
      objective: "Produce the corrected SVA sentence.",
      domainContext: "languages",
    }),
    entry({
      contentKey: "lang-ws-pronounce-universidad",
      conceptKey: "spanish-english-cognates",
      conceptTitle: "Spanish–English cognates",
      stage: "PRACTICE",
      difficulty: 2,
      contextVariant: "universidad-match",
      activityKind: "language",
      contentId: "lang-pronounce-cognate",
      objective: "Speech-match universidad (not phoneme scoring).",
      domainContext: "languages",
    }),
    entry({
      contentKey: "lang-ws-retain-familia",
      conceptKey: "spanish-english-cognates",
      conceptTitle: "Spanish–English cognates",
      stage: "RETAIN",
      difficulty: 1,
      contextVariant: "familia-retain",
      activityKind: "language",
      contentId: "lang-retain-familia",
      objective: "Retrieve family for familia.",
      domainContext: "languages",
    }),
  ];
