import { NextResponse } from "next/server";

import { jsonErrorFromUnknown } from "@/lib/api/http-errors";
import { db } from "@/lib/db";
import { createConcept } from "@/lib/learning/knowledge/concept";
import { findInstructionalConceptById } from "@/lib/learning/knowledge/instructional-library";
import { getOrCreateSelfDirectedSpace } from "@/lib/learning/learning-space";
import { getOrCreateDefaultUser } from "@/lib/user";

/**
 * Bundle K — Create or reuse an owned Concept for concept-less activity entry.
 * Never invents KL content; titles come from KL packs or learner-provided topic.
 */
export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = (await request.json().catch(() => ({}))) as {
      klConceptId?: unknown;
      title?: unknown;
      subjectDomain?: unknown;
    };

    const klConceptId =
      typeof body.klConceptId === "string" ? body.klConceptId.trim() : "";
    const titleRaw = typeof body.title === "string" ? body.title.trim() : "";
    const subjectDomain =
      typeof body.subjectDomain === "string" ? body.subjectDomain.trim() : null;

    let title = titleRaw;
    let domain = subjectDomain;

    if (klConceptId) {
      const found = findInstructionalConceptById(klConceptId);
      if (!found) {
        return NextResponse.json(
          { success: false, error: "That topic isn’t in the library." },
          { status: 404 },
        );
      }
      title = found.concept.title;
      domain = found.pack.subject ?? domain;
    }

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Choose a topic to continue." },
        { status: 400 },
      );
    }

    const existingCandidates = await db.concept.findMany({
      where: { userId: user.id },
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
      take: 80,
    });
    const existing = existingCandidates.find(
      (c) => c.title.trim().toLowerCase() === title.toLowerCase(),
    );
    if (existing) {
      return NextResponse.json({
        success: true,
        data: { conceptId: existing.id, title: existing.title, reused: true },
      });
    }

    const space = await getOrCreateSelfDirectedSpace(user.id);
    const concept = await createConcept({
      userId: user.id,
      title,
      subjectDomain: domain,
      learningSpaceId: space.id,
    });

    return NextResponse.json({
      success: true,
      data: { conceptId: concept.id, title: concept.title, reused: false },
    });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Could not prepare that topic.");
  }
}
