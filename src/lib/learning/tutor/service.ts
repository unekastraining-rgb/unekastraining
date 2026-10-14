import { aiService } from "@/lib/ai";
import type { AIMessage } from "@/lib/ai/types";
import { loadTutorContext } from "@/lib/learning/tutor/context";
import {
  maybeRecordTutorEvidence,
  resolveTutorEvidenceAuthorization,
} from "@/lib/learning/tutor/evidence";
import { getTutorModePolicy } from "@/lib/learning/tutor/policies";
import { withResolvedTutorLearningIntent } from "@/lib/learning/tutor/resolve-intent";
import { getTeachingStylePolicy } from "@/lib/learning/tutor/teaching-style";
import type {
  TutorRequest,
  TutorResponse,
  TutorSuggestedAction,
} from "@/lib/learning/tutor/types";
import { isTutorMode } from "@/lib/learning/tutor/types";

export class TutorRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TutorRequestError";
  }
}

function validateRequest(request: TutorRequest): void {
  if (!request.learnerId?.trim()) {
    throw new TutorRequestError("learnerId is required");
  }
  if (!request.message?.trim()) {
    throw new TutorRequestError("message is required");
  }
  if (!isTutorMode(request.mode)) {
    throw new TutorRequestError(`Unsupported tutor mode: ${String(request.mode)}`);
  }
}

function suggestNextAction(
  mode: TutorRequest["mode"],
  hasConcept: boolean,
): TutorSuggestedAction | null {
  if (mode === "PRACTICE" || mode === "CHALLENGE") {
    return {
      label: "Try another practice prompt",
      kind: "practice",
    };
  }
  if (mode === "SOCRATIC" || mode === "GUIDED") {
    return {
      label: "Continue with the next guided step",
      kind: "continue",
    };
  }
  if (hasConcept && (mode === "TEACH_ME" || mode === "BEGINNER")) {
    return {
      label: "Practice what you just learned",
      kind: "practice",
    };
  }
  return null;
}

/**
 * Canonical Unified Tutor entry point.
 * Uses Learner Model + Knowledge Model context, then existing AI failover.
 * Phase 2G-67: ULE evidence only when server authorizes a meaningful
 * demonstration — client evidenceIntent alone never mints mastery.
 * Phase 2G-24: optional LearningIntent is resolved and echoed in meta only —
 * it does not change TutorMode, policy, prompts, or evidence.
 * Phase 2P-19: optional Teaching Style appends presentation guidance only —
 * does not change TutorMode, LearningIntent, diagnosis, evidence, or mastery.
 */
export async function runTutor(request: TutorRequest): Promise<TutorResponse> {
  validateRequest(request);
  const resolved = withResolvedTutorLearningIntent(request);
  const policy = getTutorModePolicy(resolved.mode);
  const stylePolicy = resolved.teachingStyle
    ? getTeachingStylePolicy(resolved.teachingStyle)
    : null;

  let context = {
    conceptIds: [] as string[],
    conceptTitles: [] as string[],
    usedLearnerModel: false,
    usedKnowledgeModel: false,
    contextBlock: "Learner/knowledge context unavailable for this turn.",
  };

  try {
    context = await loadTutorContext(resolved);
  } catch (error) {
    console.error("Tutor context load failed; continuing without it:", error);
  }

  const systemContent = [
    policy.systemPolicy,
    stylePolicy ? `\n${stylePolicy.presentationPolicy}` : "",
    resolved.instructionalContext?.trim()
      ? `\nExperience strategy:\n${resolved.instructionalContext.trim()}`
      : "",
    "",
    "Session context:",
    context.contextBlock,
  ]
    .filter((part) => part !== "")
    .join("\n");

  const messages: AIMessage[] = [{ role: "system", content: systemContent }];

  for (const turn of resolved.history ?? []) {
    if (!turn.content?.trim()) continue;
    messages.push({
      role: turn.role === "assistant" ? "assistant" : "user",
      content: turn.content,
    });
  }

  const userParts = [resolved.message.trim()];
  if (resolved.learnerDemonstration?.trim()) {
    userParts.push(
      `\n\nLearner demonstration / answer:\n${resolved.learnerDemonstration.trim()}`,
    );
  }
  messages.push({ role: "user", content: userParts.join("") });

  // Sits above existing AI abstraction — no hard-coded provider.
  const completion = await aiService.complete(messages, {
    temperature: resolved.temperature ?? policy.temperature,
    maxTokens: resolved.maxTokens ?? policy.maxTokens,
    includeOpenAIPro: resolved.includeOpenAIPro,
    jsonMode: resolved.jsonMode,
  });

  let evidenceRecorded = false;
  let learningAttemptId: string | null = null;

  const primaryConceptId = context.conceptIds[0] ?? null;
  const authorization = resolveTutorEvidenceAuthorization({
    request: resolved,
    ownedConceptId: primaryConceptId,
  });

  if (authorization.eligible && authorization.evidenceIntent) {
    const evidence = await maybeRecordTutorEvidence({
      learnerId: resolved.learnerId,
      mode: resolved.mode,
      evidenceIntent: authorization.evidenceIntent,
      evidenceAuthorizedByServer: true,
      conceptId: primaryConceptId,
      learningSpaceId: resolved.learningSpaceId,
      learningObjectId: resolved.learningObjectId,
      activityId: resolved.activityId,
      // Demonstration only — never fall back to ordinary message as evidence body.
      // Teaching Style / AI explanation text is never learner evidence (2P-19).
      learnerDemonstration: resolved.learnerDemonstration,
      tutorReplyExcerpt: completion.content.slice(0, 400),
    });
    evidenceRecorded = evidence.recorded;
    learningAttemptId = evidence.learningAttemptId;
  }

  return {
    text: completion.content,
    mode: resolved.mode,
    conceptTitles: context.conceptTitles,
    suggestedAction: suggestNextAction(
      resolved.mode,
      context.conceptTitles.length > 0,
    ),
    meta: {
      provider: completion.provider,
      model: completion.model,
      usedLearnerModel: context.usedLearnerModel,
      usedKnowledgeModel: context.usedKnowledgeModel,
      conceptIds: context.conceptIds,
      evidenceRecorded,
      learningAttemptId,
      learningIntent: resolved.intent ?? null,
      ...(resolved.teachingStyle
        ? { teachingStyle: resolved.teachingStyle }
        : {}),
    },
  };
}
