import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "courseId is required." },
        { status: 400 },
      );
    }

    const course = await db.course.findFirst({
      where: { id: courseId, userId: user.id },
      include: {
        topics: {
          orderBy: { sortOrder: "asc" },
          include: {
            masteries: {
              where: { userId: user.id },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found." },
        { status: 404 },
      );
    }

    const data = [
      {
        id: course.id,
        title: course.title,
        topics: course.topics.map((topic) => {
          const mastery = topic.masteries[0];
          return {
            id: topic.id,
            name: topic.name,
            proficiency: Math.round((mastery?.proficiency ?? 0) * 100),
            confidence: Math.round((mastery?.confidence ?? 0) * 100),
            understanding: Math.round((mastery?.understanding ?? 0) * 100),
            recall: Math.round((mastery?.recall ?? 0) * 100),
            application: Math.round((mastery?.application ?? 0) * 100),
            reviewCount: mastery?.reviewCount ?? 0,
          };
        }),
      },
    ];

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Failed to fetch mastery data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load mastery data." },
      { status: 500 },
    );
  }
}
