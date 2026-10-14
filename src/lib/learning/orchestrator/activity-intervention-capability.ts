/**
 * 2G-72 — Activity intervention capability registry.
 *
 * Answers: "Can this activity legally serve as an Orchestrator intervention?"
 * Does NOT answer: "What does the learner need?" (that is diagnosis).
 *
 * PRODUCT-READY ≠ ORCHESTRATOR-SELECTABLE.
 */

import type { LearningIntentPurpose } from "@/lib/learning/intent/types";
import type { OrchestratorDiagnosis } from "@/lib/learning/orchestrator/diagnose";
import type {
  LearningObjectTypeName,
  MasteryFacetName,
} from "@/lib/learning/types";

/** How the activity relates to Orchestrator / Assessment / CREATE. */
export type ActivityInterventionRole =
  | "canonical_six"
  | "intervention_capable"
  | "assessment_only"
  | "create_only"
  | "specialized_workflow"
  | "foundation_not_selectable";

/**
 * Reusable learning characteristics an activity mechanism can support.
 * Describes the *mechanism*, not a subject taxonomy.
 * Does not independently select interventions — Orchestrator + policy still decide.
 */
export type ActivityLearningCharacteristic =
  | "practice"
  | "application"
  | "problem_solving"
  | "troubleshooting"
  | "decision_making"
  | "procedural_execution"
  | "configuration"
  | "calculation"
  | "construction"
  | "analysis"
  | "communication"
  | "creation"
  | "demonstration"
  | "recall"
  | "recognition"
  | "explanation"
  | "scenario_reasoning";

export type ActivityInterventionCapability = {
  /** Stable key used in adapter/href paths (e.g. "coding"). */
  adapterKey: string;
  activityType: LearningObjectTypeName;
  role: ActivityInterventionRole;
  /** May appear in Orchestrator activityIntervention when legal + available. */
  interventionEligible: boolean;
  assessmentOnly: boolean;
  createOnly: boolean;
  performCapable: boolean;
  /** Diagnoses this activity may support — empty ⇒ never for diagnosis gaps. */
  supportedDiagnoses: readonly OrchestratorDiagnosis[];
  /** Soft intents that unlock preference (never override diagnosis legality). */
  supportedIntents: readonly LearningIntentPurpose[];
  /** When true, PRACTICE (or listed intent) must be present to auto-select. */
  requiresExplicitIntent: boolean;
  supportedFacets: readonly MasteryFacetName[];
  evidenceFacetsProduced: readonly MasteryFacetName[];
  /**
   * Learning characteristics this *mechanism* can support (domain-agnostic).
   * Informational for productization — selection still uses diagnoses/intents/hints.
   */
  supportsLearningCharacteristics: readonly ActivityLearningCharacteristic[];
  /** Concept/topic text must match contextHints when non-empty. */
  requiresConceptContext: boolean;
  contextHints: readonly string[];
  /** Integration gates for automatic selection. */
  launchIntegrated: boolean;
  evidenceIntegrated: boolean;
  adaptiveBindIntegrated: boolean;
  learnerTitle: string;
  pathKind: string;
};

/**
 * Declarative registry — extend by adding entries, not giant switches.
 * SIX is not listed here; it remains the canonical `intervention` field.
 */
export const ACTIVITY_INTERVENTION_CAPABILITIES: readonly ActivityInterventionCapability[] =
  [
    {
      adapterKey: "coding",
      activityType: "CODING_CHALLENGE",
      role: "intervention_capable",
      interventionEligible: true,
      assessmentOnly: false,
      createOnly: false,
      performCapable: true,
      supportedDiagnoses: ["APPLICATION_GAP"],
      supportedIntents: ["PRACTICE"],
      requiresExplicitIntent: true,
      supportedFacets: ["APPLY", "PERFORM", "SOLVE"],
      evidenceFacetsProduced: ["PERFORM"],
      supportsLearningCharacteristics: [
        "practice",
        "application",
        "problem_solving",
        "construction",
        "configuration",
        "demonstration",
      ],
      requiresConceptContext: true,
      contextHints: [
        "code",
        "coding",
        "program",
        "programming",
        "javascript",
        "python",
        "java",
        "software",
        "algorithm",
        "function",
        "cs",
        "computer science",
        "class",
        "object",
        "oriented",
        "oop",
        "constructor",
      ],
      launchIntegrated: true,
      evidenceIntegrated: true,
      adaptiveBindIntegrated: true,
      learnerTitle: "Coding practice",
      pathKind: "coding",
    },
    {
      adapterKey: "sql",
      activityType: "SQL_CHALLENGE",
      role: "intervention_capable",
      interventionEligible: true,
      assessmentOnly: false,
      createOnly: false,
      performCapable: true,
      supportedDiagnoses: ["APPLICATION_GAP"],
      supportedIntents: ["PRACTICE"],
      requiresExplicitIntent: true,
      supportedFacets: ["APPLY", "PERFORM"],
      evidenceFacetsProduced: ["PERFORM"],
      supportsLearningCharacteristics: [
        "practice",
        "application",
        "problem_solving",
        "analysis",
        "demonstration",
      ],
      requiresConceptContext: true,
      contextHints: ["sql", "query", "database", "select", "relational", "table"],
      launchIntegrated: true,
      evidenceIntegrated: true,
      adaptiveBindIntegrated: true,
      learnerTitle: "SQL practice",
      pathKind: "sql",
    },
    {
      adapterKey: "math",
      activityType: "LAB",
      role: "intervention_capable",
      interventionEligible: true,
      assessmentOnly: false,
      createOnly: false,
      performCapable: false,
      supportedDiagnoses: ["APPLICATION_GAP"],
      supportedIntents: ["PRACTICE"],
      requiresExplicitIntent: true,
      supportedFacets: ["APPLY", "SOLVE"],
      evidenceFacetsProduced: ["SOLVE"],
      supportsLearningCharacteristics: [
        "practice",
        "application",
        "problem_solving",
        "calculation",
        "procedural_execution",
      ],
      requiresConceptContext: true,
      contextHints: [
        "math",
        "mathematics",
        "algebra",
        "equation",
        "linear",
        "solve",
        "x",
      ],
      launchIntegrated: true,
      evidenceIntegrated: true,
      adaptiveBindIntegrated: true,
      learnerTitle: "Math workspace",
      pathKind: "math",
    },
    {
      adapterKey: "networking",
      activityType: "SIMULATION",
      role: "intervention_capable",
      interventionEligible: true,
      assessmentOnly: false,
      createOnly: false,
      performCapable: true,
      supportedDiagnoses: ["APPLICATION_GAP"],
      supportedIntents: ["PRACTICE"],
      requiresExplicitIntent: true,
      supportedFacets: ["APPLY", "SOLVE", "PERFORM"],
      evidenceFacetsProduced: ["APPLY", "SOLVE", "PERFORM"],
      supportsLearningCharacteristics: [
        "practice",
        "application",
        "problem_solving",
        "troubleshooting",
        "configuration",
        "procedural_execution",
      ],
      requiresConceptContext: true,
      contextHints: [
        "network",
        "networking",
        "dns",
        "dhcp",
        "gateway",
        "subnet",
        "ip",
        "interface",
        "topology",
        "troubleshoot",
      ],
      launchIntegrated: true,
      evidenceIntegrated: true,
      adaptiveBindIntegrated: true,
      learnerTitle: "Network workspace",
      pathKind: "networking",
    },
    {
      adapterKey: "language",
      activityType: "LAB",
      role: "intervention_capable",
      interventionEligible: true,
      assessmentOnly: false,
      createOnly: false,
      performCapable: true,
      supportedDiagnoses: ["APPLICATION_GAP"],
      supportedIntents: ["PRACTICE"],
      requiresExplicitIntent: true,
      supportedFacets: ["RECOGNIZE", "APPLY", "SOLVE", "PERFORM", "RETAIN"],
      evidenceFacetsProduced: ["RECOGNIZE", "APPLY", "SOLVE", "PERFORM", "RETAIN"],
      supportsLearningCharacteristics: [
        "practice",
        "application",
        "procedural_execution",
        "demonstration",
      ],
      requiresConceptContext: true,
      contextHints: [
        "language",
        "languages",
        "spanish",
        "english",
        "speaking",
        "listening",
        "cognate",
        "vocabulary",
        "pronunciation",
        "conversation",
        "greeting",
      ],
      launchIntegrated: true,
      evidenceIntegrated: true,
      adaptiveBindIntegrated: true,
      learnerTitle: "Language workspace",
      pathKind: "language",
    },
    {
      adapterKey: "lab",
      activityType: "LAB",
      role: "intervention_capable",
      interventionEligible: true,
      assessmentOnly: false,
      createOnly: false,
      performCapable: true,
      supportedDiagnoses: ["APPLICATION_GAP"],
      supportedIntents: ["PRACTICE"],
      requiresExplicitIntent: true,
      supportedFacets: ["APPLY", "PERFORM"],
      evidenceFacetsProduced: ["PERFORM"],
      supportsLearningCharacteristics: [
        "practice",
        "application",
        "procedural_execution",
        "troubleshooting",
        "calculation",
        "analysis",
        "demonstration",
      ],
      requiresConceptContext: true,
      contextHints: [
        "lab",
        "experiment",
        "observe",
        "density",
        "science",
        "biology",
        "chemistry",
        "physics",
        // Mechanism-oriented (not a subject taxonomy):
        "procedure",
        "measurement",
        "troubleshoot",
      ],
      launchIntegrated: true,
      evidenceIntegrated: true,
      adaptiveBindIntegrated: true,
      learnerTitle: "Lab practice",
      pathKind: "lab",
    },
    {
      adapterKey: "simulation",
      activityType: "SIMULATION",
      role: "intervention_capable",
      interventionEligible: true,
      assessmentOnly: false,
      createOnly: false,
      performCapable: false,
      supportedDiagnoses: ["APPLICATION_GAP"],
      supportedIntents: ["PRACTICE"],
      requiresExplicitIntent: true,
      supportedFacets: ["APPLY", "SOLVE"],
      evidenceFacetsProduced: ["APPLY", "SOLVE"],
      supportsLearningCharacteristics: [
        "practice",
        "application",
        "decision_making",
        "scenario_reasoning",
        "troubleshooting",
        "analysis",
      ],
      requiresConceptContext: true,
      contextHints: [
        "simulation",
        "market",
        "economy",
        "economics",
        "supply",
        "demand",
        "business",
        "price",
        // Mechanism-oriented (not a subject taxonomy):
        "scenario",
        "decision",
      ],
      launchIntegrated: true,
      evidenceIntegrated: true,
      adaptiveBindIntegrated: true,
      learnerTitle: "Simulation practice",
      pathKind: "simulation",
    },
    {
      adapterKey: "game",
      activityType: "GAME",
      role: "intervention_capable",
      // 2P-30 — Adaptive-ready; selectable under APPLICATION_GAP + PRACTICE + context.
      interventionEligible: true,
      assessmentOnly: false,
      createOnly: false,
      performCapable: false,
      supportedDiagnoses: ["APPLICATION_GAP"],
      supportedIntents: ["PRACTICE"],
      requiresExplicitIntent: true,
      supportedFacets: ["RECOGNIZE"],
      evidenceFacetsProduced: ["RECOGNIZE"],
      supportsLearningCharacteristics: [
        "practice",
        "recognition",
        "recall",
      ],
      requiresConceptContext: true,
      contextHints: ["game", "match", "vocab"],
      launchIntegrated: true,
      evidenceIntegrated: true,
      // 2P-30 — Adaptive completion contract present.
      adaptiveBindIntegrated: true,
      learnerTitle: "Learning game",
      pathKind: "game",
    },
    {
      adapterKey: "writing",
      activityType: "WRITING_EXERCISE",
      role: "intervention_capable",
      interventionEligible: true,
      assessmentOnly: false,
      createOnly: false,
      performCapable: false,
      supportedDiagnoses: ["APPLICATION_GAP"],
      supportedIntents: ["PRACTICE", "CREATE"],
      requiresExplicitIntent: true,
      supportedFacets: ["EXPLAIN", "APPLY", "SOLVE", "RETAIN"],
      evidenceFacetsProduced: ["EXPLAIN", "APPLY", "SOLVE", "RETAIN"],
      supportsLearningCharacteristics: [
        "creation",
        "explanation",
        "communication",
        "analysis",
      ],
      requiresConceptContext: true,
      contextHints: [
        "writing",
        "essay",
        "thesis",
        "paragraph",
        "explain",
        "argument",
        "citation",
        "revise",
      ],
      launchIntegrated: true,
      evidenceIntegrated: true,
      // 2P-18 — Adaptive-ready via universal activity bind + writing_challenge_submit.
      adaptiveBindIntegrated: true,
      learnerTitle: "Writing exercise",
      pathKind: "writing",
    },
    {
      adapterKey: "project",
      activityType: "PROJECT_TASK",
      role: "intervention_capable",
      // 2P-30 — Adaptive-ready; CREATE/PRACTICE soft prefer (not CREATE-only isolation).
      interventionEligible: true,
      assessmentOnly: false,
      createOnly: false,
      performCapable: false,
      supportedDiagnoses: ["APPLICATION_GAP"],
      supportedIntents: ["CREATE", "PRACTICE"],
      requiresExplicitIntent: true,
      supportedFacets: ["APPLY"],
      evidenceFacetsProduced: ["APPLY"],
      supportsLearningCharacteristics: [
        "creation",
        "construction",
        "application",
        "demonstration",
      ],
      requiresConceptContext: true,
      contextHints: [
        "project",
        "milestone",
        "plan",
        "feature",
        "business plan",
        "acceptance",
      ],
      launchIntegrated: true,
      evidenceIntegrated: true,
      // 2P-30 — Adaptive completion contract present.
      adaptiveBindIntegrated: true,
      learnerTitle: "Project",
      pathKind: "project",
    },
    {
      adapterKey: "presentation",
      activityType: "PRESENTATION_PRACTICE",
      role: "intervention_capable",
      interventionEligible: true,
      assessmentOnly: false,
      createOnly: false,
      performCapable: true,
      supportedDiagnoses: ["APPLICATION_GAP"],
      supportedIntents: ["PRACTICE", "CREATE"],
      requiresExplicitIntent: true,
      supportedFacets: ["PERFORM", "EXPLAIN"],
      evidenceFacetsProduced: ["PERFORM"],
      supportsLearningCharacteristics: [
        "practice",
        "communication",
        "demonstration",
        "explanation",
      ],
      requiresConceptContext: true,
      contextHints: [
        "presentation",
        "present",
        "speech",
        "outline",
        "audience",
        "deliver",
      ],
      launchIntegrated: true,
      evidenceIntegrated: true,
      adaptiveBindIntegrated: true,
      learnerTitle: "Presentation practice",
      pathKind: "presentation",
    },
    {
      adapterKey: "quiz",
      activityType: "QUIZ_ITEM",
      role: "assessment_only",
      interventionEligible: false,
      assessmentOnly: true,
      createOnly: false,
      performCapable: false,
      supportedDiagnoses: [],
      supportedIntents: ["ASSESS"],
      requiresExplicitIntent: true,
      supportedFacets: ["RECOGNIZE"],
      evidenceFacetsProduced: ["RECOGNIZE"],
      supportsLearningCharacteristics: ["recognition", "recall"],
      requiresConceptContext: false,
      contextHints: [],
      launchIntegrated: true,
      evidenceIntegrated: true,
      adaptiveBindIntegrated: true,
      learnerTitle: "Quiz",
      pathKind: "quiz",
    },
    {
      adapterKey: "flashcard",
      activityType: "FLASHCARD",
      role: "assessment_only",
      interventionEligible: false,
      assessmentOnly: true,
      createOnly: false,
      performCapable: false,
      supportedDiagnoses: [],
      supportedIntents: ["ASSESS", "PRACTICE"],
      requiresExplicitIntent: true,
      supportedFacets: ["RETAIN"],
      evidenceFacetsProduced: ["RETAIN"],
      supportsLearningCharacteristics: ["recall", "recognition"],
      requiresConceptContext: false,
      contextHints: [],
      launchIntegrated: true,
      evidenceIntegrated: true,
      adaptiveBindIntegrated: true,
      learnerTitle: "Flashcard review",
      pathKind: "flashcard",
    },
  ];

export function listActivityInterventionCapabilities(): readonly ActivityInterventionCapability[] {
  return ACTIVITY_INTERVENTION_CAPABILITIES;
}

export function getActivityInterventionCapability(
  adapterKey: string,
): ActivityInterventionCapability | null {
  return (
    ACTIVITY_INTERVENTION_CAPABILITIES.find((c) => c.adapterKey === adapterKey) ??
    null
  );
}

/** Capabilities that declare support for a learning characteristic (mechanism view). */
export function listCapabilitiesSupportingCharacteristic(
  characteristic: ActivityLearningCharacteristic,
): readonly ActivityInterventionCapability[] {
  return ACTIVITY_INTERVENTION_CAPABILITIES.filter((c) =>
    c.supportsLearningCharacteristics.includes(characteristic),
  );
}

export function activityCapabilityTruthSummary(): {
  contaminatesDiagnosis: false;
  replacesSix: false;
  productReadyMeansOrchestratorSelectable: false;
  quizIsGenericIntervention: false;
  assessMeansQuiz: false;
  /** Domains are free-form context — not a finite subject enum. */
  requiresSubjectTaxonomy: false;
  /** Activities are mechanisms; characteristics describe capability, not subjects. */
  activitiesAreSubjectEngines: false;
} {
  return {
    contaminatesDiagnosis: false,
    replacesSix: false,
    productReadyMeansOrchestratorSelectable: false,
    quizIsGenericIntervention: false,
    assessMeansQuiz: false,
    requiresSubjectTaxonomy: false,
    activitiesAreSubjectEngines: false,
  };
}
