import { NextResponse } from "next/server";

import {
  isSubstantialHaulWriting,
  recordHaulWritingEvidence,
  type HaulWritingEvidenceSignal,
} from "@/lib/haul/writing/evidence";
import { getOrCreateDefaultUser } from "@/lib/user";

export const runtime = "nodejs";

/**
 * Record meaningful Haul writing into existing Learner State.
 * Rejects open-template / trivial text for section_substantial_write.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      signal?: HaulWritingEvidenceSignal;
      textSample?: string;
    };

    if (!body.signal?.action || !body.signal.writingTypeId || !body.signal.sectionId) {
      return NextResponse.json(
        { recorded: false, reason: "signal_required" },
        { status: 400 },
      );
    }

    if (
      body.signal.action === "section_substantial_write" &&
      !isSubstantialHaulWriting(body.textSample ?? "")
    ) {
      return NextResponse.json({
        recorded: false,
        reason: "not_substantial",
      });
    }

    const user = await getOrCreateDefaultUser();
    const result = await recordHaulWritingEvidence({
      userId: user.id,
      signal: body.signal,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[haul/writing/evidence]", error);
    return NextResponse.json(
      { recorded: false, reason: "server_error" },
      { status: 500 },
    );
  }
}
