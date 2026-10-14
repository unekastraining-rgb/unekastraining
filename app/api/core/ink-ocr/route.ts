import { NextResponse } from "next/server";

import { getVisionExtractor } from "@/lib/ai/service";
import { getUserAppSettings } from "@/lib/settings/app-settings";
import { getOrCreateDefaultUser } from "@/lib/user";

const HANDWRITING_PROMPT =
  "You are OCR for student notebook handwriting and ink annotations. Extract ALL readable handwritten and printed text in reading order. Keep definitions, formulas, lists, and labels. Ignore pure doodles with no letters. Return only the extracted text — no commentary.";

/**
 * Core ink → study text: Gemini/OpenRouter vision OCR for selected page ink.
 * Keeps Selection → Lucky / Six tied to what was written, not only typed packs.
 */
export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = (await request.json()) as {
      imageBase64?: string;
      mimeType?: string;
    };
    const raw = String(body.imageBase64 ?? "").trim();
    const mimeType = String(body.mimeType ?? "image/png").trim() || "image/png";

    if (!raw || raw.length < 80) {
      return NextResponse.json(
        { success: false, error: "Ink snapshot missing — draw on the page first." },
        { status: 400 },
      );
    }

    // Allow data-URL or bare base64.
    const base64 = raw.includes(",") ? raw.slice(raw.indexOf(",") + 1) : raw;
    if (base64.length < 80) {
      return NextResponse.json(
        { success: false, error: "Ink snapshot too small to OCR." },
        { status: 400 },
      );
    }

    const settings = await getUserAppSettings(user.id);
    const vision = getVisionExtractor({
      includeOpenAIPro: settings.aiUseOpenAIPro,
    });

    if (!("extract" in vision)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Ink OCR needs GEMINI_API_KEY or OPENROUTER_API_KEY (vision). Typed notes and study packs still work offline.",
        },
        { status: 503 },
      );
    }

    const text = (await vision.extract(HANDWRITING_PROMPT, base64, mimeType))
      .replace(/\u0000/g, "")
      .trim();

    if (text.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Could not read handwriting in that ink. Add a text box or run Study pack, then try Lucky again.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        text: text.slice(0, 12000),
        provider: vision.provider,
      },
    });
  } catch (error) {
    console.error("Ink OCR failed:", error);
    const message =
      error instanceof Error ? error.message : "Could not OCR ink on this page.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
