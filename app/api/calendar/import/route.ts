import { NextResponse } from "next/server";

import { parseIcsEvents } from "@/lib/calendar/parse-ics";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const contentType = request.headers.get("content-type") ?? "";

    let icsText = "";
    let courseId: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      courseId = (form.get("courseId") as string) || null;
      if (file instanceof File) {
        icsText = await file.text();
      }
    } else {
      const body = await request.json();
      icsText = body.icsText ?? "";
      courseId = body.courseId ?? null;
    }

    if (!icsText.trim()) {
      return NextResponse.json(
        { success: false, error: "ICS file or text is required." },
        { status: 400 },
      );
    }

    if (courseId) {
      const course = await db.course.findFirst({
        where: { id: courseId, userId: user.id },
      });
      if (!course) {
        return NextResponse.json(
          { success: false, error: "Course not found." },
          { status: 404 },
        );
      }
    }

    const parsed = parseIcsEvents(icsText);
    if (parsed.length === 0) {
      return NextResponse.json(
        { success: false, error: "No events found in the calendar file." },
        { status: 400 },
      );
    }

    const created = await db.$transaction(
      parsed.map((event) =>
        db.calendarEvent.create({
          data: {
            userId: user.id,
            title: event.title,
            description: event.description ?? null,
            location: event.location ?? null,
            startAt: event.startAt,
            endAt: event.endAt,
            allDay: event.allDay,
            eventType: "PERSONAL",
            courseId,
          },
        }),
      ),
    );

    return NextResponse.json({
      success: true,
      imported: created.length,
      eventIds: created.map((event) => event.id),
    });
  } catch (error) {
    console.error("ICS import failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to import calendar." },
      { status: 500 },
    );
  }
}
