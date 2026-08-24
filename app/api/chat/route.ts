import { NextResponse } from "next/server";

import { aiService } from "@/lib/ai";
import { isAIConfigured } from "@/lib/ai/is-configured";
import { loadAllCoursesSourceText, loadCourseSourceText } from "@/lib/ai/course-source";
import { buildOfflineChatReply } from "@/lib/chat/offline-reply";
import { db } from "@/lib/db";
import {
  aiSourceInstruction,
  getUserAppSettings,
} from "@/lib/settings/app-settings";
import { portalToContextText } from "@/lib/lms/course-info/portal-context";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const { message, history = [] } = body as {
      message?: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
      courseId?: string;
    };

    const courseId =
      typeof body.courseId === "string" && body.courseId.trim()
        ? body.courseId.trim()
        : undefined;

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: "Message is required." },
        { status: 400 },
      );
    }

    if (courseId) {
      const course = await db.course.findFirst({
        where: { id: courseId, userId: user.id },
        select: { id: true },
      });
      if (!course) {
        return NextResponse.json(
          { success: false, error: "Course not found." },
          { status: 404 },
        );
      }
    }

    const courseWhere = {
      userId: user.id,
      ...(courseId ? { id: courseId } : {}),
    };

    const [courses, topics, upcomingAssignments, appSettings, focusedCourse] =
      await Promise.all([
        db.course.findMany({
          where: courseWhere,
          select: {
            title: true,
            code: true,
            semester: true,
            gradeLevel: true,
            subject: true,
            focusTopic: true,
            description: true,
            topics: { select: { name: true, description: true }, take: 6 },
          },
          take: courseId ? 1 : 8,
        }),
        db.topic.findMany({
          where: {
            course: courseWhere,
          },
          select: { name: true, description: true, course: { select: { title: true } } },
          take: 12,
        }),
        db.assignment.findMany({
          where: {
            course: courseWhere,
            dueDate: { gte: new Date() },
          },
          include: { course: { select: { title: true } } },
          orderBy: { dueDate: "asc" },
          take: 5,
        }),
        getUserAppSettings(user.id),
        courseId
          ? db.course.findFirst({
              where: { id: courseId, userId: user.id },
              select: { title: true, courseInfoJson: true },
            })
          : Promise.resolve(null),
      ]);

    const preferences = await db.userPreferences.findUnique({ where: { userId: user.id } });
    const isElementary = preferences?.elementaryMode ?? false;

    let materialContext = "";
    if (appSettings.aiUseCourseMaterialsInChat) {
      if (courseId) {
        const source = await loadCourseSourceText(user.id, courseId, 8000);
        materialContext = source?.text ?? "";
      } else {
        materialContext = await loadAllCoursesSourceText(user.id, 8000);
      }
    }

    const courseContext = courses
      .map((course) => {
        const parts = [
          course.title,
          course.gradeLevel ? `grade ${course.gradeLevel}` : null,
          course.subject ? `subject ${course.subject}` : null,
          course.focusTopic ? `focus ${course.focusTopic}` : null,
          course.description,
        ].filter(Boolean);
        const topicList = course.topics.map((t) => t.name).join(", ");
        return `${parts.join(" — ")}${topicList ? ` [topics: ${topicList}]` : ""}`;
      })
      .join("; ");

    const topicContext = topics
      .map((topic) => `${topic.name} (${topic.course.title}): ${topic.description ?? ""}`)
      .join("; ");

    let portalContext = "";
    if (courseId && focusedCourse && "courseInfoJson" in focusedCourse && focusedCourse.courseInfoJson) {
      portalContext = portalToContextText(focusedCourse.courseInfoJson);
    }

    const context = [
      focusedCourse
        ? `Focused class: ${focusedCourse.title} — prioritize this course in your answer.`
        : null,
      portalContext
        ? `Imported course syllabus portal (use only this data — do not invent missing facts):\n${portalContext}`
        : null,
      `Student courses: ${courseContext || "none"}`,
      `Learning topics: ${topicContext || "none"}`,
      `Upcoming deadlines: ${
        upcomingAssignments
          .map(
            (assignment) =>
              `${assignment.title} (${assignment.course.title}) due ${assignment.dueDate?.toLocaleDateString() ?? "TBD"}`,
          )
          .join("; ") || "none"
      }`,
      materialContext
        ? `Course materials excerpt:\n${materialContext}`
        : "Course materials excerpt: none",
      aiSourceInstruction(appSettings.aiSourceMode),
    ]
      .filter(Boolean)
      .join("\n");

    const systemPrompt = isElementary
      ? "You are Study Haul Chat, a warm and encouraging tutor for younger students. Use simple words, short sentences, and positive encouragement. Help explain school topics at the student's grade level. Use the course and topic context when relevant. Never be condescending."
      : "You are Study Haul Chat, a friendly academic copilot. Be concise, energetic, and practical. Help with schedules, study plans, and assignment strategy. Use the student context when relevant.";

    if (!isAIConfigured()) {
      const reply = buildOfflineChatReply(message, {
        courses: courses.map((course) => ({
          title: course.title,
          code: course.code,
          semester: course.semester,
        })),
        upcomingAssignments: upcomingAssignments.map((assignment) => ({
          title: assignment.title,
          dueDate: assignment.dueDate,
          courseTitle: assignment.course.title,
        })),
        materialExcerpt: materialContext || undefined,
      });

      return NextResponse.json({ success: true, reply, offline: true });
    }

    const result = await aiService.complete([
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "system",
        content: context,
      },
      ...history
        .filter((item) => item.role === "user" || item.role === "assistant")
        .map((item) => ({
          role: item.role,
          content: item.content,
        })),
      { role: "user", content: message },
    ]);

    return NextResponse.json({ success: true, reply: result.content });
  } catch (error) {
    console.error("Chat failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate a response.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
