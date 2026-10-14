/**
 * Phase 17 — Activity registry (one learning system, many activity types).
 * Maps types onto existing implementations without replacing them.
 */

import type { LearningActivityRegistryEntry } from "@/lib/learning/activity/framework/types";

export const LEARNING_ACTIVITY_REGISTRY: readonly LearningActivityRegistryEntry[] =
  [
    {
      type: "lesson",
      defaultEvidenceType: "lesson_exposure",
      defaultOrchestratorAction: "teach",
      defaultSixTechnique: "detailed-explanation",
      implementationKey: "six-lesson",
    },
    {
      type: "practice",
      defaultEvidenceType: "practice_attempt",
      defaultOrchestratorAction: "practice",
      defaultSixTechnique: "hands-on-practice",
      implementationKey: "study-practice",
    },
    {
      type: "recall",
      defaultEvidenceType: "recall_result",
      defaultOrchestratorAction: "recall",
      defaultSixTechnique: "active-recall",
      implementationKey: "lucky-remember",
    },
    {
      type: "coding",
      foundationType: "CODING_CHALLENGE",
      defaultEvidenceType: "application_attempt",
      defaultOrchestratorAction: "practice",
      defaultSixTechnique: "hands-on-practice",
      implementationKey: "activities/coding",
    },
    {
      type: "sql",
      foundationType: "SQL_CHALLENGE",
      defaultEvidenceType: "application_attempt",
      defaultOrchestratorAction: "practice",
      defaultSixTechnique: "hands-on-practice",
      implementationKey: "activities/sql",
    },
    {
      type: "lab",
      foundationType: "LAB",
      defaultEvidenceType: "application_attempt",
      defaultOrchestratorAction: "practice",
      defaultSixTechnique: "hands-on-practice",
      implementationKey: "activities/structured:lab",
    },
    {
      type: "project",
      foundationType: "PROJECT_TASK",
      defaultEvidenceType: "application_attempt",
      defaultOrchestratorAction: "practice",
      defaultSixTechnique: "hands-on-practice",
      implementationKey: "activities/structured:project",
    },
    {
      type: "simulation",
      foundationType: "SIMULATION",
      defaultEvidenceType: "application_attempt",
      defaultOrchestratorAction: "practice",
      defaultSixTechnique: "hands-on-practice",
      implementationKey: "activities/structured:simulation",
    },
    {
      type: "writing",
      foundationType: "WRITING_EXERCISE",
      defaultEvidenceType: "explanation_attempt",
      defaultOrchestratorAction: "practice",
      defaultSixTechnique: "feynman",
      implementationKey: "activities/writing",
    },
    {
      type: "presentation",
      foundationType: "PRESENTATION_PRACTICE",
      defaultEvidenceType: "explanation_attempt",
      defaultOrchestratorAction: "practice",
      defaultSixTechnique: "feynman",
      implementationKey: "activities/structured:presentation",
    },
    {
      type: "visual",
      defaultEvidenceType: "visualization_attempt",
      defaultOrchestratorAction: "practice",
      defaultSixTechnique: "visualization",
      implementationKey: "six-visualization",
    },
    {
      type: "problem-solving",
      defaultEvidenceType: "practice_attempt",
      defaultOrchestratorAction: "practice",
      defaultSixTechnique: "hands-on-practice",
      implementationKey: "study-practice",
    },
    {
      type: "game",
      foundationType: "GAME",
      defaultEvidenceType: "application_attempt",
      defaultOrchestratorAction: "practice",
      defaultSixTechnique: "hands-on-practice",
      implementationKey: "activities/structured:game",
    },
  ] as const;

export function getActivityRegistryEntry(
  type: LearningActivityRegistryEntry["type"],
): LearningActivityRegistryEntry | null {
  return LEARNING_ACTIVITY_REGISTRY.find((e) => e.type === type) ?? null;
}

export function listSupportedActivityTypes(): LearningActivityRegistryEntry["type"][] {
  return LEARNING_ACTIVITY_REGISTRY.map((e) => e.type);
}
