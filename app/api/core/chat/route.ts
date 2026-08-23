import { NextResponse } from "next/server";

import { aiService } from "@/lib/ai";
import { loadCourseSourceText, loadMaterialSourceText } from "@/lib/ai/course-source";
import { aiSourceInstruction, getUserAppSettings } from "@/lib/settings/app-settings";
import { requireUser } from "@/lib/user";

function parseChatResponse(content: string) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced?.[1] ?? content).trim();
  return JSON.parse(raw) as {
    answer: string;
    citations: Array<{ label: string; excerpt: string }>;
  };
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const {
      message,
      courseId,
      materialId,
      history = [],
    } = body as {
      message?: string;
      courseId?: string;
      materialId?: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: "Message is required." },
        { status: 400 },
      );
    }

    if (!courseId && !materialId) {
      return NextResponse.json(
        { success: false, error: "Select a course or material first." },
        { status: 400 },
      );
    }

    const source = materialId
      ? await loadMaterialSourceText(user.id, materialId)
      : await loadCourseSourceText(user.id, courseId, 14000);

    if (!source?.text?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "No source text found. Upload materials on Courses first.",
        },
        { status: 400 },
      );
    }

    const appSettings = await getUserAppSettings(user.id);
    const historyBlock = history
      .slice(-6)
      .map((item) => `${item.role}: ${item.content}`)
      .join("\n");

    const result = await aiService.complete(
      [
        {
          role: "system",
          content:
            "You are a source-grounded study assistant like NotebookLM. Answer only from the provided source. Cite short excerpts. Respond JSON only.",
        },
        {
          role: "user",
          content: `Course/source: ${source.courseTitle}
${aiSourceInstruction(appSettings.aiSourceMode)}

SOURCE MATERIAL:
${source.text}

${historyBlock ? `PRIOR CHAT:\n${historyBlock}\n` : ""}
STUDENT QUESTION:
${message}

Return ONLY JSON:
{
  "answer": "clear helpful answer in markdown",
  "citations": [
    { "label": "short source label", "excerpt": "quoted phrase from source" }
  ]
}`,
        },
      ],
      { temperature: 0.2, maxTokens: 2048 },
    );

    const parsed = parseChatResponse(result.content);

    return NextResponse.json({
      success: true,
      data: {
        answer: parsed.answer,
        citations: parsed.citations ?? [],
      },
    });
  } catch (error) {
    console.error("Core source chat failed:", error);
    const message = error instanceof Error ? error.message : "Chat failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
