import { NextResponse } from "next/server";

import { importMoodleCourses } from "@/lib/lms/moodle-import";
import type { MoodleImportCourse } from "@/lib/lms/moodle-import";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";
import { LMSProvider } from "@/generated/prisma";

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = (await request.json()) as { courses?: MoodleImportCourse[] };

    if (!body.courses?.length) {
      return NextResponse.json(
        { success: false, error: "No Moodle courses to import." },
        { status: 400 },
      );
    }

    const result = await importMoodleCourses(user.id, body.courses);

    await db.lMSConnection.updateMany({
      where: { userId: user.id, provider: LMSProvider.MOODLE },
      data: { lastSyncedAt: new Date() },
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Moodle ingest failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Moodle import failed.",
      },
      { status: 500 },
    );
  }
}
