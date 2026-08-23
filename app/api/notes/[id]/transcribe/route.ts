import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { getGeminiModel } from "@/lib/ai/config";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id: noteId } = await context.params;

    const note = await db.note.findFirst({
      where: { id: noteId, userId: user.id },
    });
    if (!note) {
      return NextResponse.json({ success: false, error: "Note not found." }, { status: 404 });
    }

    const form = await request.formData();
    const audio = form.get("audio");
    if (!(audio instanceof Blob)) {
      return NextResponse.json({ success: false, error: "Audio file required." }, { status: 400 });
    }

    const buffer = Buffer.from(await audio.arrayBuffer());
    const storageKey = `${noteId}/${Date.now()}.webm`;
    const uploadDir = path.join(process.cwd(), "uploads", "audio", noteId);
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, path.basename(storageKey)), buffer);

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        storageKey,
        transcript: "",
        message: "Audio saved. Set GEMINI_API_KEY for transcription.",
      });
    }

    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: getGeminiModel() });
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "audio/webm",
          data: buffer.toString("base64"),
        },
      },
      {
        text: "Transcribe this study audio accurately. Return only the transcript text, no preamble.",
      },
    ]);

    const transcript = result.response.text().trim();

    return NextResponse.json({
      success: true,
      storageKey,
      transcript,
    });
  } catch (error) {
    console.error("Transcription failed:", error);
    return NextResponse.json(
      { success: false, error: "Transcription failed." },
      { status: 500 },
    );
  }
}
