import { NextResponse } from "next/server";

import { aiService } from "@/lib/ai";
import { loadCourseSourceText, loadMaterialSourceText } from "@/lib/ai/course-source";
import type { CoreFormatId } from "@/lib/core/format-catalog";
import { CORE_FORMAT_CATALOG } from "@/lib/core/format-catalog";
import {
  convertDocument,
  mergeAiRecommendations,
  recommendFormatsHeuristic,
} from "@/lib/core/format-engine";
import { parseNoteDocument } from "@/lib/core/note-types";
import type { NoteMethod } from "@/generated/prisma";
import { getOrCreateDefaultUser } from "@/lib/user";

function parseJson(content: string) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse((fenced?.[1] ?? content).trim());
}

const VALID_FORMAT_IDS = new Set(CORE_FORMAT_CATALOG.map((format) => format.id));

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const action = body.action as "recommend" | "convert" | "analyze";

    if (action === "convert") {
      const targetFormatId = body.targetFormatId as CoreFormatId;
      const method = body.method as NoteMethod;
      const doc = parseNoteDocument(
        typeof body.contentJson === "string" ? body.contentJson : JSON.stringify(body.doc ?? {}),
      );
      const result = convertDocument(doc, targetFormatId, method);
      return NextResponse.json({
        success: true,
        ...result,
        contentJson: JSON.stringify(result.doc),
      });
    }

    let sourceText = typeof body.sourceText === "string" ? body.sourceText : "";
    let courseTitle = typeof body.courseTitle === "string" ? body.courseTitle : "";

    if (body.materialId) {
      const material = await loadMaterialSourceText(user.id, body.materialId);
      if (material) {
        sourceText = material.text;
        courseTitle = material.courseTitle;
      }
    } else if (body.courseId) {
      const course = await loadCourseSourceText(user.id, body.courseId);
      if (course) {
        sourceText = course.text;
        courseTitle = course.courseTitle;
      }
    }

    const heuristic = recommendFormatsHeuristic(sourceText, courseTitle);

    if (action === "recommend" && !body.useAi) {
      return NextResponse.json({
        success: true,
        ...heuristic,
      });
    }

    const formatList = CORE_FORMAT_CATALOG.map(
      (format) => `${format.id}: ${format.label} — ${format.description}`,
    ).join("\n");

    const aiResponse = await aiService.complete(
      [
        {
          role: "system",
          content: `You are CORE's adaptive note engine for a learning system. Analyze study material and recommend note-taking formats. Available formats:\n${formatList}\n\nRespond JSON only. Recommend 2-4 formats that COMBINE well — not just one. Base recommendations on the actual content, not only the subject name.`,
        },
        {
          role: "user",
          content: `Course: ${courseTitle || "General"}
Material type hint: ${heuristic.materialType}

SOURCE (excerpt):
${sourceText.slice(0, 8000) || "No source text yet — suggest versatile starting formats."}

Return ONLY JSON:
{
  "materialType": "programming|mathematics|history|biology|psychology|cs_theory|lecture_notes|general",
  "summary": "one sentence about what this material is",
  "suggestedTitle": "optional note title",
  "formats": [
    { "formatId": "OUTLINE", "reason": "why this fits the actual content", "confidence": 0.85 }
  ],
  "workspacePlan": "one sentence on how to combine the formats",
  "guide": ["step 1 for the student", "step 2"]
}`,
        },
      ],
      { temperature: 0.3 },
    );

    let aiPayload: {
      materialType?: string;
      summary?: string;
      suggestedTitle?: string;
      formats?: Array<{ formatId: string; reason: string; confidence?: number }>;
      workspacePlan?: string;
      guide?: string[];
    } = {};

    try {
      aiPayload = parseJson(aiResponse.content);
    } catch {
      return NextResponse.json({
        success: true,
        ...heuristic,
        workspacePlan: null,
        guide: [],
      });
    }

    const aiFormats = (aiPayload.formats ?? [])
      .filter((item) => VALID_FORMAT_IDS.has(item.formatId as CoreFormatId))
      .map((item) => ({
        formatId: item.formatId as CoreFormatId,
        reason: item.reason,
        confidence: item.confidence,
      }));

    const recommendations = mergeAiRecommendations(heuristic.recommendations, aiFormats);

    return NextResponse.json({
      success: true,
      recommendations,
      materialType: aiPayload.materialType ?? heuristic.materialType,
      summary: aiPayload.summary ?? heuristic.summary,
      suggestedTitle: aiPayload.suggestedTitle,
      workspacePlan: aiPayload.workspacePlan,
      guide: aiPayload.guide ?? [],
    });
  } catch (error) {
    console.error("CORE adaptive error:", error);
    return NextResponse.json(
      { success: false, error: "Adaptive analysis failed." },
      { status: 500 },
    );
  }
}
