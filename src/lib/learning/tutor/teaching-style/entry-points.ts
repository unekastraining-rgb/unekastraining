/**
 * 2P-20 — Teaching Style entry-point inventory (audit aid).
 * Does not invoke Tutor or write evidence.
 */

export type TeachingStyleEntryStatus =
  | "SUPPORTED"
  | "PARTIAL"
  | "NOT_APPLICABLE"
  | "MISSING";

export type TeachingStyleEntryPoint = {
  id: string;
  label: string;
  status: TeachingStyleEntryStatus;
  path: string;
  notes: string;
};

/**
 * Living inventory of Unified Tutor / related surfaces for Teaching Style.
 * Update when wiring changes.
 */
export const TEACHING_STYLE_ENTRY_POINTS: readonly TeachingStyleEntryPoint[] = [
  {
    id: "foundation_tutor",
    label: "Foundation Tutor API",
    status: "SUPPORTED",
    path: "app/api/study/tutor/route.ts → runTutor",
    notes: "Accepts teachingStyle; NL hint extract when body omits style.",
  },
  {
    id: "six_tutor",
    label: "SIX Tutor",
    status: "SUPPORTED",
    path: "SixTutorChat → /api/study/six-tutor → toTutorRequestFromSixTutor → runTutor",
    notes: "UI selector + sessionStorage; adapter passthrough when unified flag ON.",
  },
  {
    id: "core_assist",
    label: "CORE Assist / Source Chat",
    status: "SUPPORTED",
    path: "CoreSourceChat → /api/core/chat → toTutorRequestFromCoreAssist → runTutor",
    notes:
      "2P-20: optional teachingStyle + selector; does not write Note.contentJson. Unified flag required.",
  },
  {
    id: "teach_me",
    label: "Teach Me (evaluate)",
    status: "SUPPORTED",
    path: "GuidedStudyActivity(teach-me) → /api/study/evaluate → toTutorRequestFromTeachMe → runTutor",
    notes:
      "2P-20: optional style for feedback phrasing only; score/evidence still via evaluate-bridge. Unified flag required.",
  },
  {
    id: "facade_legacy_chat",
    label: "Facade toTutorRequestFromLegacyChat",
    status: "SUPPORTED",
    path: "src/lib/learning/tutor/facade.ts",
    notes: "Optional teachingStyle on constructor for future callers.",
  },
  {
    id: "facade_demonstration",
    label: "Facade toTutorRequestFromDemonstration",
    status: "SUPPORTED",
    path: "src/lib/learning/tutor/facade.ts",
    notes: "Optional teachingStyle on constructor; evidence still demonstration-gated.",
  },
  {
    id: "adaptive_tutor_step",
    label: "Adaptive sequence step",
    status: "NOT_APPLICABLE",
    path: "sequence/coordinator (no runTutor)",
    notes:
      "Adaptive selects interventions; does not call Unified Tutor directly. SIX Tutor style applies when learner opens SIX Tutor UI.",
  },
  {
    id: "lucky",
    label: "LUCKY retention",
    status: "NOT_APPLICABLE",
    path: "app/api/study/lucky/route.ts",
    notes: "Retention scoring; not a Unified Tutor entry. No style system.",
  },
  {
    id: "blurting_evaluate",
    label: "Blurting evaluate",
    status: "NOT_APPLICABLE",
    path: "app/api/study/evaluate (mode=blurting)",
    notes: "Does not use runTutor; legacy/offline evaluation path.",
  },
  {
    id: "six_step_evaluate",
    label: "SIX step evaluate",
    status: "NOT_APPLICABLE",
    path: "app/api/study/evaluate (mode=six)",
    notes: "Step scoring; not Unified Tutor. Live SIX Tutor chat is separate (SUPPORTED).",
  },
  {
    id: "hub_chat",
    label: "Hub Chat",
    status: "NOT_APPLICABLE",
    path: "hub ChatTab",
    notes: "Not migrated through runTutor in current architecture.",
  },
] as const;

export function listTeachingStyleEntryPoints(): readonly TeachingStyleEntryPoint[] {
  return TEACHING_STYLE_ENTRY_POINTS;
}

export function getTeachingStyleEntryPoint(
  id: string,
): TeachingStyleEntryPoint | null {
  return TEACHING_STYLE_ENTRY_POINTS.find((e) => e.id === id) ?? null;
}

export function teachingStylePropagationTruthSummary(): {
  noSecondTutor: true;
  noTeachingStyleEngine: true;
  styleOptional: true;
  doesNotAlterDiagnosis: true;
  doesNotWriteNoteContentJson: true;
  doesNotAlterLuckyRetention: true;
} {
  return {
    noSecondTutor: true,
    noTeachingStyleEngine: true,
    styleOptional: true,
    doesNotAlterDiagnosis: true,
    doesNotWriteNoteContentJson: true,
    doesNotAlterLuckyRetention: true,
  };
}
