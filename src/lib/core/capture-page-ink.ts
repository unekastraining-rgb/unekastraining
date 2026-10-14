/**
 * Capture the Core / PDF ink canvas for handwriting OCR → Lucky / Six.
 */
export function capturePageInkDataUrl(): string | null {
  if (typeof document === "undefined") return null;
  const canvas =
    (document.querySelector("canvas[data-ink-canvas]") as HTMLCanvasElement | null) ??
    (document.querySelector("[data-page-canvas] canvas") as HTMLCanvasElement | null);
  if (!canvas || canvas.width < 8 || canvas.height < 8) return null;
  try {
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

/** OCR visible page ink (if any). Returns null when no canvas or OCR fails. */
export async function ocrPageInkText(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const snapshot = capturePageInkDataUrl();
  if (!snapshot) return null;
  try {
    const response = await fetch("/api/core/ink-ocr", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: snapshot, mimeType: "image/png" }),
    });
    const data = (await response.json()) as {
      success?: boolean;
      data?: { text?: string };
    };
    const text = data.success ? data.data?.text?.trim() : "";
    return text || null;
  } catch {
    return null;
  }
}
