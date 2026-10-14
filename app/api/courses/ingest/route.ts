import { NextResponse } from "next/server";

import { isAIConfigured } from "@/lib/ai/is-configured";
import { extractTextFromFile, fileNeedsVisionOcr } from "@/lib/syllabus/extract-text";
import {
  visionOcrFailureMessage,
  visionOcrUnusableReason,
} from "@/lib/syllabus/ocr-gate";
import { parseSyllabusText } from "@/lib/syllabus/parse";
import { saveUploadedFile } from "@/lib/syllabus/storage";
import type { SyllabusIngestResult } from "@/lib/syllabus/types";
import { getUserAppSettings } from "@/lib/settings/app-settings";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "A syllabus file is required." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";
    const user = await getOrCreateDefaultUser();
    const appSettings = await getUserAppSettings(user.id);

    try {
      text = await extractTextFromFile(buffer, file.type, file.name, {
        includeOpenAIPro: appSettings.aiUseOpenAIPro,
      });
    } catch (error) {
      if (fileNeedsVisionOcr(file.type, file.name)) {
        return NextResponse.json(
          { error: visionOcrFailureMessage(error) },
          { status: 422 },
        );
      }
      throw error;
    }

    const ocrWeak = visionOcrUnusableReason(file.type, file.name, text);
    if (ocrWeak) {
      return NextResponse.json({ error: ocrWeak }, { status: 422 });
    }

    const { uploadId } = await saveUploadedFile(buffer, file.name);
    const { extraction, parser } = await parseSyllabusText(text, {
      fileName: file.name,
      includeOpenAIPro: appSettings.aiUseOpenAIPro,
    });

    const result: SyllabusIngestResult = {
      uploadId,
      fileName: file.name,
      extractedText: text,
      extraction,
      parser,
      aiAvailable: isAIConfigured(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Syllabus ingest failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process syllabus.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
