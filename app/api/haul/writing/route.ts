import { NextResponse } from "next/server";

import { completeForUser } from "@/lib/ai";
import { isAIConfigured } from "@/lib/ai/is-configured";
import {
  buildHaulWritingAiMessages,
  type HaulWritingAiAction,
  type HaulWritingAiRequest,
} from "@/lib/haul/writing/ai-actions";
import {
  buildHaulWritingKnowledgeBlock,
  getCanonicalConceptsForAiAction,
} from "@/lib/haul/writing/knowledge-map";
import { getOrCreateDefaultUser } from "@/lib/user";

export const runtime = "nodejs";

/**
 * Haul writing assistance — proposals only.
 * Never silently overwrites learner writing; client applies insert/replace.
 * Does not create learner mastery evidence.
 * Grounds prompts in canonical writing Knowledge Library concepts when available.
 */
export async function POST(request: Request) {
  try {
    if (!isAIConfigured()) {
      return NextResponse.json(
        {
          success: false,
          aiAvailable: false,
          error: "AI unavailable. You can still write, use templates, and export.",
          action: "write-for-me" as HaulWritingAiAction,
        },
        { status: 503 },
      );
    }

    const body = (await request.json()) as Partial<HaulWritingAiRequest>;
    if (!body.action || !body.writingTypeId || !body.writingTypeTitle) {
      return NextResponse.json(
        { success: false, error: "action, writingTypeId, and writingTypeTitle are required." },
        { status: 400 },
      );
    }

    const knowledgeConceptIds = getCanonicalConceptsForAiAction(
      body.action,
      body.writingTypeId,
      body.sectionId,
    );
    const knowledgeBlock = buildHaulWritingKnowledgeBlock({
      action: body.action,
      writingTypeId: body.writingTypeId,
      sectionId: body.sectionId,
    });

    const req: HaulWritingAiRequest = {
      action: body.action,
      writingTypeId: body.writingTypeId,
      writingTypeTitle: body.writingTypeTitle,
      sectionId: body.sectionId,
      sectionTitle: body.sectionTitle,
      sectionPurpose: body.sectionPurpose,
      sectionPrompt: body.sectionPrompt,
      currentText: body.currentText,
      selectedText: body.selectedText,
      documentTitle: body.documentTitle,
      assignmentPrompt: body.assignmentPrompt,
      paraphraseStyle: body.paraphraseStyle,
      knowledgeBlock: knowledgeBlock || undefined,
    };

    const { system, user } = buildHaulWritingAiMessages(req);
    const userRecord = await getOrCreateDefaultUser();
    const result = await completeForUser(
      userRecord.id,
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { temperature: 0.5, maxTokens: 1200 },
    );

    const proposal = result.content?.trim();
    if (!proposal) {
      return NextResponse.json(
        {
          success: false,
          aiAvailable: true,
          error: "AI returned an empty response. Try again.",
          action: req.action,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      aiAvailable: true,
      action: req.action,
      proposal,
      knowledgeConceptIds,
      explanation:
        req.action === "explain-section" || req.action === "feedback"
          ? proposal
          : undefined,
    });
  } catch (error) {
    console.error("Haul writing AI failed:", error);
    return NextResponse.json(
      {
        success: false,
        aiAvailable: false,
        error:
          error instanceof Error
            ? error.message
            : "AI unavailable. You can still write with templates.",
      },
      { status: 503 },
    );
  }
}
