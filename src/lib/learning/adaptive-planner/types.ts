/**
 * Phase 15 — Adaptive Planner types.
 * WHEN/sequence around academic constraints — not WHAT (Orchestrator) or HOW (Six).
 */

import type { KnowledgeLearningAction } from "@/lib/learning/orchestrator/knowledge-loop/types";
import type { SixComponent } from "@/lib/csl/six";
import type { AcademicSource } from "@/lib/learning/academic/types";

export type LearningNeedUrgency = "low" | "medium" | "high";

export type LearningNeed = {
  conceptId: string;
  action: KnowledgeLearningAction;
  urgency: LearningNeedUrgency;
  reason: string;
  evidence: string[];
  recommendedSix?: {
    technique: SixComponent;
    reasonCode: string;
    reason: string;
  } | null;
  academicItemId?: string;
  dueAt?: Date | null;
};

export type StudyWindow = {
  startAt: Date;
  endAt: Date;
  minutes: number;
};

export type PlannedLearningActivity = {
  id: string;
  conceptId: string;
  title: string;
  /** WHAT — from Orchestrator / LearningNeed */
  action: KnowledgeLearningAction;
  /** HOW — from Six Intelligence (optional) */
  sixTechnique?: SixComponent | null;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  minutes: number;
  urgency: LearningNeedUrgency;
  reason: string;
  academicItemId?: string;
  academicSource?: AcademicSource;
  /** Existing Study room / Lucky href hint — never invents new engines. */
  room?: "learn" | "practice" | "check" | "remember" | "tutor";
};

export type AdaptivePlan = {
  userId: string;
  generatedAt: Date;
  needs: LearningNeed[];
  activities: PlannedLearningActivity[];
  windowsUsed: StudyWindow[];
};
