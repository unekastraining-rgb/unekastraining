import { NextResponse } from "next/server";

import { MaterialType } from "@/generated/prisma";
import { db } from "@/lib/db";
import { emptyDocument } from "@/lib/core/note-types";
import { generateStudyTopicBreakdown } from "@/lib/study-topic/generate-breakdown";
import type { StudyTopicProfile } from "@/lib/study-topic/types";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const focus = typeof body.focus === "string" ? body.focus.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const createNote = body.createNote !== false;

    if (!title) {
      return NextResponse.json({ error: "What do you want to study?" }, { status: 400 });
    }

    const breakdown = await generateStudyTopicBreakdown({
      title,
      focus: focus || null,
      subject: subject || null,
    });

    const profile: StudyTopicProfile = {
      kind: "study_topic",
      title,
      subject: subject || null,
      focus: focus || null,
      summary: breakdown.summary,
      subtopics: breakdown.subtopics,
      suggestedTechniques: breakdown.suggestedTechniques,
      createdAt: new Date().toISOString(),
    };

    const course = await db.course.create({
      data: {
        title,
        subject: subject || null,
        focusTopic: focus || null,
        description: breakdown.summary,
        userId: user.id,
        color: "#7c3aed",
        materials: {
          create: {
            title: `Study topic: ${title}`,
            type: MaterialType.OTHER,
            extractedText: JSON.stringify(profile, null, 2),
            sortOrder: 0,
          },
        },
        topics: {
          create: breakdown.subtopics.map((subtopic, index) => ({
            name: subtopic.name,
            description: subtopic.description,
            sortOrder: index,
          })),
        },
        ...(createNote
          ? {
              notes: {
                create: {
                  userId: user.id,
                  title: `${title} — study notebook`,
                  content: breakdown.summary,
                  method: "BLANK",
                  contentJson: JSON.stringify(emptyDocument()),
                },
              },
            }
          : {}),
      },
      include: { topics: true, materials: true, notes: true },
    });

    const materialId = course.materials[0]?.id ?? null;
    const noteId = course.notes[0]?.id ?? null;

    return NextResponse.json(
      {
        success: true,
        course,
        studyTopic: profile,
        materialId,
        noteId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create study topic:", error);
    const message = error instanceof Error ? error.message : "Failed to create study topic.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
