import { NextResponse } from "next/server";

import { jsonErrorFromUnknown } from "@/lib/api/http-errors";
import { listInstructionalPacks } from "@/lib/learning/knowledge/instructional-library";
import "@/lib/learning/knowledge/packs";

/** Bundle K — Subject → topic options for concept-less entry (KL packs only). */
export async function GET() {
  try {
    const packs = listInstructionalPacks().map((pack) => ({
      id: pack.id,
      subject: pack.displayTitle ?? pack.subject ?? pack.id,
      concepts: pack.concepts.slice(0, 40).map((c) => ({
        id: c.id,
        title: c.title,
      })),
    }));
    return NextResponse.json({ success: true, data: packs });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Could not load topics.");
  }
}
