import { NextResponse } from "next/server";

import { extractTextFromFile } from "@/lib/syllabus/extract-text";
import { parseSyllabusText } from "@/lib/syllabus/parse";
import { saveUploadedFile } from "@/lib/syllabus/storage";
import type { SyllabusIngestResult } from "@/lib/syllabus/types";

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
    const text = await extractTextFromFile(
      buffer,
      file.type,
      file.name,
    );
    const extraction = await parseSyllabusText(text);
    const { uploadId } = await saveUploadedFile(buffer, file.name);

    const result: SyllabusIngestResult = {
      uploadId,
      fileName: file.name,
      extractedText: text,
      extraction,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Syllabus ingest failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process syllabus.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
