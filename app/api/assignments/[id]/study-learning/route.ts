import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { ensureConceptForTopic } from "@/lib/learning/knowledge/concept";
import {
  matchTopicForAssignmentTitle,
  SCHOOL_LMS_EVIDENCE_BOUNDARY,
} from "@/lib/learning/school-lms";
import { getOrCreateDefaultUser } from "@/lib/user";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * 2P-31 — Resolve / ensure Concept for an owned assignment via Topic match.
 * Creates Concept only (via ensureConceptForTopic). Never LearningAttempt.
 */
export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;
    const assignmentId = id?.trim();
    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: "Assignment id required." },
        { status: 400 },
      );
    }

    // Ignore client identity spoofing.
    void (_request.headers.get("x-learner-id") ?? null);

    const assignment = await db.assignment.findFirst({
      where: { id: assignmentId, course: { userId: user.id } },
      select: {
        id: true,
        title: true,
        courseId: true,
        status: true,
        grade: true,
      },
    });
    if (!assignment) {
      return NextResponse.json(
        { success: false, error: "Assignment not found." },
        { status: 404 },
      );
    }

    const topics = await db.topic.findMany({
      where: { courseId: assignment.courseId },
      select: { id: true, name: true, courseId: true, conceptId: true },
    });
    const matched = matchTopicForAssignmentTitle(
      assignment.title,
      topics,
      assignment.courseId,
    );
    if (!matched) {
      return NextResponse.json({
        success: true,
        conceptId: null,
        topicId: null,
        createsEvidence: false,
        createsMastery: false,
        reason: "no_topic_match",
        boundary: {
          assignmentStatusCreatesEvidence:
            SCHOOL_LMS_EVIDENCE_BOUNDARY.assignmentStatusChangeCreatesLearningAttempt,
          gradeCreatesMastery:
            SCHOOL_LMS_EVIDENCE_BOUNDARY.gradeImportCreatesConceptMastery,
        },
      });
    }

    const concept = await ensureConceptForTopic(user.id, matched.topic.id);

    return NextResponse.json({
      success: true,
      conceptId: concept.id,
      topicId: matched.topic.id,
      createsEvidence: false,
      createsMastery: false,
      matchKind: matched.matchKind,
      // Explicit: resolving study link is not evidence.
      assignmentStatus: assignment.status,
      grade: assignment.grade,
    });
  } catch (error) {
    console.error("Assignment study-learning failed:", error);
    return NextResponse.json(
      { success: false, error: "Could not resolve learning link." },
      { status: 500 },
    );
  }
}

/** Read-only link resolution — ownership-safe; no Concept ensure. */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;
    const assignment = await db.assignment.findFirst({
      where: { id: id?.trim() ?? "", course: { userId: user.id } },
      select: { id: true, title: true, courseId: true },
    });
    if (!assignment) {
      return NextResponse.json(
        { success: false, error: "Assignment not found." },
        { status: 404 },
      );
    }
    const topics = await db.topic.findMany({
      where: { courseId: assignment.courseId, conceptId: { not: null } },
      select: { id: true, name: true, courseId: true, conceptId: true },
    });
    const matched = matchTopicForAssignmentTitle(
      assignment.title,
      topics,
      assignment.courseId,
    );
    return NextResponse.json({
      success: true,
      conceptId: matched?.topic.conceptId ?? null,
      topicId: matched?.topic.id ?? null,
      matchKind: matched?.matchKind ?? "none",
      alignmentState: matched
        ? matched.matchKind === "exact"
          ? "confirmed"
          : "inferred"
        : "unaligned",
      createsEvidence: false,
    });
  } catch (error) {
    console.error("Assignment learning-link GET failed:", error);
    return NextResponse.json(
      { success: false, error: "Could not resolve learning link." },
      { status: 500 },
    );
  }
}
