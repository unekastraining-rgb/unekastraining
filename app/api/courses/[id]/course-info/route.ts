import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { parseCourseInfoPortal } from "@/lib/lms/course-info/types";
import { syncCourseInfoForCourse } from "@/lib/lms/course-info/sync-course-info";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;
    const refresh = new URL(request.url).searchParams.get("refresh") === "1";

    const course = await db.course.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        moodleCourseId: true,
        courseInfoJson: true,
        courseInfoSyncedAt: true,
        description: true,
      },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found." }, { status: 404 });
    }

    if (!course.moodleCourseId && !course.description?.includes("Imported from Moodle")) {
      return NextResponse.json(
        {
          success: false,
          error: "This course is not linked to Moodle. Sync from LMS Settings first.",
        },
        { status: 400 },
      );
    }

    let portal = refresh ? null : parseCourseInfoPortal(course.courseInfoJson);

    if (!portal || refresh) {
      portal = await syncCourseInfoForCourse(user.id, course.id, { force: refresh });
    }

    if (!portal) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not load Course Info. Check Moodle connection and try again.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      portal,
      syncedAt: portal.syncedAt,
      fromCache: !refresh && Boolean(course.courseInfoJson),
    });
  } catch (error) {
    console.error("Failed to load course info:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load course info." },
      { status: 500 },
    );
  }
}
