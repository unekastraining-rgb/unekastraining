import { NextResponse } from "next/server";

import { isAIConfigured } from "@/lib/ai/is-configured";
import { friendlyUserFacingAiError } from "@/lib/ai/parse-json-response";
import { parseLearningIntent } from "@/lib/learning/intent/parse";
import {
  presentUniversalLearnerContext,
  resolveUniversalLearnerContext,
} from "@/lib/learning/universal-learner-context";
import {
  isTutorEvidenceIntent,
  isTutorMode,
  runTutor,
  TutorRequestError,
  type TutorEvidenceIntent,
  type TutorMode,
  type TutorRequest,
} from "@/lib/learning/tutor";
import { parseTeachingStyle } from "@/lib/learning/tutor/teaching-style";
import {
  extractTeachingStyleHintFromMessage,
  resolveTeachingStyle,
} from "@/lib/learning/tutor/teaching-style";
import { loadOwnedMaterialTutorContext } from "@/lib/learning/material-ingestion";
import { getOrCreateDefaultUser } from "@/lib/user";

/**
 * Minimal authenticated Tutor foundation endpoint (Phase 2D-1 validation).
 * learnerId always comes from the session user — never from an untrusted client body.
 * Phase 2G-67: client evidenceIntent is contextual only — never authorizes
 * LearningAttempt / ConceptMastery. Write path always evidenceIntent "none"
 * with evidenceAuthorizedByServer false.
 * Does not replace Core Assist / Hub Chat / SIX Tutor UIs.
 * Phase 2G-24: optional LearningIntent / modeLearnerSelected — metadata only.
 * Phase 2P-19: optional teachingStyle — presentation only.
 */
export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = (await request.json()) as {
      mode?: string;
      message?: string;
      conceptIds?: string[];
      learningSpaceId?: string | null;
      subjectDomain?: string | null;
      learningObjectId?: string | null;
      activityId?: string | null;
      signal?: string | null;
      modality?: "text" | "voice";
      history?: Array<{ role: "user" | "assistant"; content: string }>;
      /** Contextual only — never authorizes mastery evidence (2G-67). */
      evidenceIntent?: TutorEvidenceIntent;
      /** Ignored for mastery outcome — server decides scores (2G-67). */
      score?: number | null;
      outcome?: string | null;
      learnerDemonstration?: string | null;
      includeOpenAIPro?: boolean;
      /** Optional LearningIntent object — validated; never used for ownership. */
      intent?: unknown;
      /** True when the learner explicitly chose TutorMode in UI. */
      modeLearnerSelected?: boolean;
      /** 2P-19 — optional Teaching Style (presentation only). */
      teachingStyle?: unknown;
      /** 2P-27 — optional owned material context (session-scoped). */
      materialId?: string;
      /** Ignored if present — ownership is session-bound. */
      learnerId?: string;
      userId?: string;
    };

    const message = body.message?.trim() ?? "";
    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required." },
        { status: 400 },
      );
    }

    const modeRaw = body.mode?.trim() || "GUIDED";
    if (!isTutorMode(modeRaw)) {
      return NextResponse.json(
        { success: false, error: "Unsupported tutor mode." },
        { status: 400 },
      );
    }

    const parsedStyle = parseTeachingStyle(body.teachingStyle);
    if (parsedStyle === null) {
      return NextResponse.json(
        { success: false, error: "Unsupported teaching style." },
        { status: 400 },
      );
    }
    const resolvedStyle = resolveTeachingStyle({
      explicit: parsedStyle,
      messageHint: extractTeachingStyleHintFromMessage(message),
    }).style;

    // 2P-28 — resolve owned material before offline/online branch (no leak on foreign ids).
    const materialId =
      typeof body.materialId === "string" ? body.materialId.trim() : "";
    const materialCtx = materialId
      ? await loadOwnedMaterialTutorContext(user.id, materialId)
      : null;

    if (!isAIConfigured()) {
      const offlinePresentation = await resolveTutorLearnerContextPresentation({
        learnerId: user.id,
        conceptIds: Array.isArray(body.conceptIds) ? body.conceptIds : [],
        materialId,
        learningSpaceId: body.learningSpaceId,
        intent: body.intent,
        teachingStyle: resolvedStyle,
      });
      return NextResponse.json({
        success: true,
        offline: true,
        response: {
          text: materialCtx
            ? `Tutor is offline until an AI key is set. I can see your material (${materialCtx.provenanceLabel}) once AI is configured.`
            : "Tutor is offline until an AI key is set (Gemini, Groq, or OpenRouter).",
          mode: modeRaw as TutorMode,
          conceptTitles: [],
          suggestedAction: null,
          meta: {
            usedLearnerModel: false,
            usedKnowledgeModel: false,
            conceptIds: [],
            evidenceRecorded: false,
            learningIntent: null,
            ...(resolvedStyle ? { teachingStyle: resolvedStyle } : {}),
            ...(materialCtx
              ? {
                  materialProvenanceLabel: materialCtx.provenanceLabel,
                  materialTitle: materialCtx.title,
                }
              : {}),
            ...(offlinePresentation
              ? { learnerContextPresentation: offlinePresentation }
              : {}),
          },
        },
      });
    }

    const parsedIntent =
      body.intent === undefined
        ? undefined
        : body.intent === null
          ? null
          : parseLearningIntent(body.intent);

    const clientEvidenceIntentRequest = isTutorEvidenceIntent(
      body.evidenceIntent,
    )
      ? body.evidenceIntent
      : null;

    const tutorRequest: TutorRequest = {
      learnerId: user.id,
      mode: modeRaw,
      message,
      conceptIds: Array.isArray(body.conceptIds)
        ? body.conceptIds.filter((id) => typeof id === "string").slice(0, 5)
        : undefined,
      learningSpaceId: body.learningSpaceId ?? null,
      subjectDomain: body.subjectDomain ?? null,
      learningObjectId: body.learningObjectId ?? null,
      activityId: body.activityId ?? materialCtx?.materialId ?? null,
      signal: body.signal ?? null,
      modality: body.modality === "voice" ? "voice" : "text",
      history: Array.isArray(body.history) ? body.history.slice(-12) : undefined,
      // 2G-67: write path never trusts client evidenceIntent.
      evidenceIntent: "none",
      clientEvidenceIntentRequest,
      evidenceAuthorizedByServer: false,
      learnerDemonstration: body.learnerDemonstration ?? null,
      includeOpenAIPro: body.includeOpenAIPro,
      intent: parsedIntent,
      modeLearnerSelected: body.modeLearnerSelected === true,
      ...(resolvedStyle ? { teachingStyle: resolvedStyle } : {}),
      ...(materialCtx
        ? {
            instructionalContext: `Learner-owned material context (ordinary Q&A — not evidence):\n${materialCtx.sourceText}`,
          }
        : {}),
    };

    // Explicitly ignore client score/outcome/identity forgery fields.
    void body.score;
    void body.outcome;
    void body.learnerId;
    void body.userId;

    const response = await runTutor(tutorRequest);

    const learnerContextPresentation =
      await resolveTutorLearnerContextPresentation({
        learnerId: user.id,
        conceptIds: tutorRequest.conceptIds ?? [],
        materialId,
        learningSpaceId: body.learningSpaceId,
        intent: parsedIntent,
        teachingStyle: resolvedStyle,
      });

    // Learner-facing payload: omit internal conceptIds from top-level text fields.
    return NextResponse.json({
      success: true,
      response: {
        text: response.text,
        mode: response.mode,
        conceptTitles: response.conceptTitles,
        suggestedAction: response.suggestedAction ?? null,
        meta: {
          usedLearnerModel: response.meta.usedLearnerModel,
          usedKnowledgeModel: response.meta.usedKnowledgeModel,
          evidenceRecorded: response.meta.evidenceRecorded,
          provider: response.meta.provider,
          learningIntent: response.meta.learningIntent ?? null,
          ...(response.meta.teachingStyle
            ? { teachingStyle: response.meta.teachingStyle }
            : {}),
          ...(materialCtx
            ? {
                materialProvenanceLabel: materialCtx.provenanceLabel,
                materialTitle: materialCtx.title,
                materialPartial: materialCtx.sourceText.includes(
                  "[Material context truncated",
                ),
              }
            : {}),
          ...(learnerContextPresentation
            ? { learnerContextPresentation }
            : {}),
        },
      },
    });
  } catch (error) {
    if (error instanceof TutorRequestError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }
    console.error("Tutor foundation request failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: friendlyUserFacingAiError(error) ?? "Tutor request failed.",
      },
      { status: 500 },
    );
  }
}

/** 2P-29 — soft-fail read-only context for Tutor meta (never evidence). */
async function resolveTutorLearnerContextPresentation(input: {
  learnerId: string;
  conceptIds: string[];
  materialId?: string;
  learningSpaceId?: string | null;
  intent?: unknown;
  teachingStyle?: ReturnType<typeof parseTeachingStyle>;
}) {
  try {
    const conceptId =
      input.conceptIds.find((id) => typeof id === "string" && id.trim()) ??
      null;
    const ulc = await resolveUniversalLearnerContext({
      learnerId: input.learnerId,
      conceptId,
      materialId: input.materialId || null,
      learningSpaceId: input.learningSpaceId ?? null,
      intent: input.intent,
      teachingStyle:
        input.teachingStyle === undefined ? null : input.teachingStyle,
      includeMaterial: true,
      includeActiveRun: true,
    });
    const presentation = presentUniversalLearnerContext(ulc);
    return presentation.lines.length > 0 ? presentation : null;
  } catch {
    return null;
  }
}
