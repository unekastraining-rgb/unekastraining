import { NextResponse } from "next/server";

import {
  getCodingChallenge,
  listCodingChallenges,
} from "@/lib/learning/activities/coding/challenges";
import { submitCodingChallenge } from "@/lib/learning/activities/coding/service";
import {
  getSqlChallenge,
  listSqlChallenges,
} from "@/lib/learning/activities/sql/challenges";
import { submitSqlChallenge } from "@/lib/learning/activities/sql/service";
import {
  getMathChallenge,
  listMathChallenges,
} from "@/lib/learning/activities/math/challenges";
import { checkMathStep } from "@/lib/learning/activities/math/evaluate";
import { submitMathChallenge } from "@/lib/learning/activities/math/service";
import {
  getNetworkChallenge,
  listNetworkChallenges,
} from "@/lib/learning/activities/networking/challenges";
import { runNetworkDiagnostic } from "@/lib/learning/activities/networking/evaluate";
import { submitNetworkChallenge } from "@/lib/learning/activities/networking/service";
import type { NetworkState } from "@/lib/learning/activities/networking/types";
import {
  listLanguageChallenges,
} from "@/lib/learning/activities/language/challenges";
import { submitLanguageChallenge } from "@/lib/learning/activities/language/service";
import {
  listStructuredChallenges,
  submitStructuredChallenge,
  type StructuredActivityKind,
} from "@/lib/learning/activities/structured/service";
import { matchPairsForGameChallenge } from "@/lib/learning/activities/structured/game-match-pairs";
import {
  getEducationalMarketScenario,
  projectEducationalMarketChart,
} from "@/lib/learning/activities/simulation/educational-market";
import { bindUniversalActivityToAdaptive } from "@/lib/learning/activities/adaptive-bind";
import { assertAdaptiveLaunchConceptMatch } from "@/lib/learning/activities/adaptive-concept-guard";
import type { UniversalContentActivityKind } from "@/lib/learning/activities/content-contract";
import {
  findRecentIdempotentActivityCompletion,
  normalizeIdempotencyKey,
  rememberIdempotentActivityCompletion,
} from "@/lib/learning/activities/activity-idempotency";
import { resolveLearningExperience } from "@/lib/learning/experience";
import { resolveTransferSelectionHints } from "@/lib/learning/transfer";
import { preferredDifficultyFromSignals } from "@/lib/learning/content-level";
import { jsonErrorFromUnknown } from "@/lib/api/http-errors";
import { getOrCreateDefaultUser } from "@/lib/user";
import { db } from "@/lib/db";

const KINDS = new Set([
  "coding",
  "sql",
  "writing",
  "lab",
  "simulation",
  "game",
  "project",
  "presentation",
  "math",
  "networking",
  "language",
]);

type RouteContext = { params: Promise<{ kind: string }> };

/** Safe schema preview for learners — CREATE TABLE only, not INSERT/expected rows. */
function schemaPreviewFromSeed(seedSql: string): string {
  const creates = seedSql.match(/CREATE\s+TABLE[\s\S]*?;/gi);
  if (creates && creates.length > 0) {
    return creates.map((s) => s.trim()).join("\n\n");
  }
  return seedSql
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^INSERT\b/i.test(l))
    .slice(0, 12)
    .join("\n");
}

export async function GET(
  request: Request,
  context: RouteContext,
) {
  const { kind } = await context.params;
  if (!KINDS.has(kind)) {
    return NextResponse.json(
      { success: false, error: "Unknown activity kind." },
      { status: 404 },
    );
  }

  const url = new URL(request.url);
  const conceptId = url.searchParams.get("conceptId")?.trim() ?? "";
  let conceptTitle: string | null = url.searchParams.get("conceptTitle");
  const subjectDomain = url.searchParams.get("subjectDomain");
  const whyReason = url.searchParams.get("why");
  const adaptiveRunId = url.searchParams.get("adaptiveRunId");
  const excludeRaw = url.searchParams.get("excludeContentKeys");
  const clientExcludeKeys = excludeRaw
    ? excludeRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const user = await getOrCreateDefaultUser();

  if (conceptId && !conceptTitle) {
    const concept = await db.concept.findFirst({
      where: { id: conceptId, userId: user.id },
      select: { title: true },
    });
    conceptTitle = concept?.title ?? null;
  }

  // 2P-46 — Soft transfer hints from recent LearningAttempt sourceRefs (session-owned).
  let transferAvoid: string | null = null;
  let transferExclude: string[] = [];
  // 2P-48 — Soft preferredDifficulty from ConceptMastery facets (age never overrides).
  let preferredDifficulty: ReturnType<typeof preferredDifficultyFromSignals> =
    null;
  if (conceptId) {
    try {
      const recent = await db.learningAttempt.findMany({
        where: { userId: user.id, conceptId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { sourceRefJson: true, outcome: true },
      });
      const hints = resolveTransferSelectionHints(recent);
      transferAvoid = hints.avoidContextVariant;
      transferExclude = hints.excludeContentKeys;
    } catch {
      transferAvoid = null;
      transferExclude = [];
    }
    try {
      const mastery = await db.conceptMastery.findFirst({
        where: { userId: user.id, conceptId },
        select: {
          recognize: true,
          explain: true,
          apply: true,
          solve: true,
          perform: true,
          retain: true,
        },
      });
      // Ignore client-claimed difficulty query params as authority.
      const clientClaimed = url.searchParams.get("difficulty");
      preferredDifficulty = preferredDifficultyFromSignals({
        facets: mastery,
        clientClaimedDifficulty: clientClaimed,
        ageBand: url.searchParams.get("ageBand"),
        educationLevel: url.searchParams.get("grade"),
      });
    } catch {
      preferredDifficulty = null;
    }
  }

  const excludeContentKeys = [
    ...new Set([...clientExcludeKeys, ...transferExclude]),
  ];

  const challenges =
    kind === "coding"
      ? listCodingChallenges().map((c) => {
          const full = getCodingChallenge(c.id);
          return {
            ...c,
            // Safe client metadata only — args/expected, never solutions.
            entryFunction: full?.entryFunction,
            tests: (full?.tests ?? []).map(({ id, args, expected }) => ({
              id,
              args,
              expected,
            })),
          };
        })
      : kind === "sql"
        ? listSqlChallenges().map((c) => {
            const full = getSqlChallenge(c.id);
            return {
              ...c,
              schemaPreview: full
                ? schemaPreviewFromSeed(full.seedSql)
                : undefined,
            };
          })
        : kind === "math"
          ? listMathChallenges().map((c) => ({
              ...c,
              starter: c.equation,
              starterDraft: c.equation,
            }))
          : kind === "networking"
            ? listNetworkChallenges().map((c) => ({
                ...c,
                starter: c.symptom,
                starterDraft: "",
                initialState: c.initialState,
              }))
            : kind === "language"
              ? listLanguageChallenges().map((c) => ({
                  ...c,
                  starter: c.exampleUtterance ?? c.prompt,
                  starterDraft: "",
                }))
              : kind === "game"
                ? listStructuredChallenges("game").map((c) => ({
                    ...c,
                    matchPairs: matchPairsForGameChallenge(c.id) ?? undefined,
                  }))
                : listStructuredChallenges(kind as StructuredActivityKind);

  const challengesWithMarket =
    kind === "simulation"
      ? challenges.map((c) => {
          const scenario = getEducationalMarketScenario(c.id);
          if (!scenario) return c;
          return {
            ...c,
            educationalMarket: true,
            marketState: scenario.state,
            marketChart: projectEducationalMarketChart(scenario),
            marketDisclaimer: scenario.disclaimer,
          };
        })
      : challenges;

  const resolved = resolveLearningExperience({
    conceptId: conceptId || "standalone",
    conceptTitle,
    activityKind: kind as UniversalContentActivityKind,
    whyReason,
    adaptiveContext: Boolean(adaptiveRunId),
    excludeContentKeys: excludeContentKeys.length > 0 ? excludeContentKeys : null,
    avoidContextVariant: transferAvoid,
    preferredDifficulty,
    learnerId: user.id,
  });

  void subjectDomain;

  return NextResponse.json({
    success: true,
    data: {
      kind,
      challenges: challengesWithMarket,
      recommendedContentId: resolved.recommendedContentId,
      recommendedReason: resolved.experience?.purpose ?? null,
      recommendedObjective: resolved.experience?.objective ?? null,
      coverageStatus: resolved.coverageStatus,
      experience: resolved.experience,
      transferHints: {
        avoidContextVariant: transferAvoid,
        excludeContentKeys,
      },
      contentLevelHints: {
        preferredDifficulty,
      },
    },
  });
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { kind } = await context.params;
    if (!KINDS.has(kind)) {
      return NextResponse.json(
        { success: false, error: "Unknown activity kind." },
        { status: 404 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const challengeId =
      typeof body.challengeId === "string" ? body.challengeId.trim() : "";
    const conceptId =
      typeof body.conceptId === "string" ? body.conceptId.trim() : "";

    // Check-step: working-state feedback only — never creates LearningAttempt.
    if (kind === "math" && body.action === "checkStep") {
      const challenge = getMathChallenge(challengeId);
      if (!challenge) {
        return NextResponse.json(
          { success: false, error: "unknown_challenge" },
          { status: 400 },
        );
      }
      const previous =
        typeof body.previous === "string" ? body.previous : "";
      const next = typeof body.next === "string" ? body.next : "";
      const check = checkMathStep({
        previous,
        next,
        expectedX: challenge.expectedX,
      });
      return NextResponse.json({ success: true, check });
    }

    // Network diagnostic: temporary feedback only — never creates LearningAttempt.
    if (kind === "networking" && body.action === "diagnostic") {
      const challenge = getNetworkChallenge(challengeId);
      if (!challenge) {
        return NextResponse.json(
          { success: false, error: "unknown_challenge" },
          { status: 400 },
        );
      }
      const state = body.state as NetworkState | undefined;
      if (
        !state ||
        !Array.isArray(state.nodes) ||
        !Array.isArray(state.interfaces) ||
        !Array.isArray(state.links)
      ) {
        return NextResponse.json(
          { success: false, error: "malformed_state" },
          { status: 400 },
        );
      }
      const diagKind = body.kind === "hostname" ? "hostname" : "ping";
      const diagnostic = runNetworkDiagnostic({
        challenge,
        state,
        kind: diagKind,
      });
      return NextResponse.json({ success: true, diagnostic });
    }

    if (!challengeId || !conceptId) {
      return NextResponse.json(
        { success: false, error: "challengeId and conceptId are required." },
        { status: 400 },
      );
    }

    // Strip identity forgeries — session user is authoritative.
    const clientBody = { ...body };
    delete clientBody.learnerId;
    delete clientBody.userId;

    const headerKey = normalizeIdempotencyKey(
      request.headers.get("x-idempotency-key"),
    );
    const bodyKey = normalizeIdempotencyKey(
      typeof clientBody.idempotencyKey === "string"
        ? clientBody.idempotencyKey
        : null,
    );
    const idempotencyKey = headerKey ?? bodyKey;
    if (idempotencyKey) {
      clientBody.idempotencyKey = idempotencyKey;
      const prior = await findRecentIdempotentActivityCompletion({
        learnerId: user.id,
        conceptId,
        challengeId,
        idempotencyKey,
      });
      if (prior) {
        return NextResponse.json({
          success: true,
          idempotent: true,
          data: {
            kind,
            completion: prior,
            evaluation: {
              outcome: prior.outcome,
              score: prior.score,
              details: { idempotentReplay: true },
            },
            rejectedForgeryKeys: [],
            adaptive: { bound: false, reason: "idempotent_replay" },
          },
        });
      }
    }

    const conceptGuard = await assertAdaptiveLaunchConceptMatch({
      learnerId: user.id,
      conceptId,
      clientBody,
    });
    if (!conceptGuard.ok) {
      return NextResponse.json(
        { success: false, error: conceptGuard.reason },
        { status: 403 },
      );
    }

    let result:
      | {
          ok: true;
          completion: {
            learningAttemptId: string;
            conceptId: string;
            outcome: string;
            score: number | null;
          };
          evaluationDetails: Record<string, unknown>;
          rejectedForgeryKeys: string[];
        }
      | { ok: false; reason: string; rejectedForgeryKeys?: string[] };

    if (kind === "coding") {
      result = await submitCodingChallenge({
        learnerId: user.id,
        conceptId,
        challengeId,
        clientBody,
      });
    } else if (kind === "sql") {
      result = await submitSqlChallenge({
        learnerId: user.id,
        conceptId,
        challengeId,
        clientBody,
      });
    } else if (kind === "math") {
      result = await submitMathChallenge({
        learnerId: user.id,
        conceptId,
        challengeId,
        clientBody,
      });
    } else if (kind === "networking") {
      result = await submitNetworkChallenge({
        learnerId: user.id,
        conceptId,
        challengeId,
        clientBody,
      });
    } else if (kind === "language") {
      result = await submitLanguageChallenge({
        learnerId: user.id,
        conceptId,
        challengeId,
        clientBody,
      });
    } else {
      result = await submitStructuredChallenge({
        learnerId: user.id,
        conceptId,
        challengeId,
        clientBody,
      });
    }

    if (!result.ok) {
      const status =
        result.reason === "foreign_concept" ||
        result.reason === "missing_concept" ||
        result.reason === "concept_mismatch"
          ? 403
          : 400;
      return NextResponse.json(
        {
          success: false,
          error: result.reason,
          rejectedForgeryKeys: result.rejectedForgeryKeys ?? [],
        },
        { status },
      );
    }

    if (idempotencyKey) {
      rememberIdempotentActivityCompletion(
        user.id,
        conceptId,
        challengeId,
        idempotencyKey,
        result.completion,
      );
    }

    const adaptive = await bindUniversalActivityToAdaptive({
      learnerId: user.id,
      learningAttemptId: result.completion.learningAttemptId,
      clientBody,
    });

    return NextResponse.json({
      success: true,
      data: {
        kind,
        completion: result.completion,
        evaluation: {
          // Learner-safe summary — no raw internal thresholds
          outcome: result.completion.outcome,
          score: result.completion.score,
          details: result.evaluationDetails,
        },
        rejectedForgeryKeys: result.rejectedForgeryKeys,
        adaptive,
      },
    });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to submit activity.", 500, {
      event: "activity.failure",
    });
  }
}
