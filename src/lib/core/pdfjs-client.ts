"use client";

export type PdfRenderTask = {
  promise: Promise<void>;
  cancel: () => void;
};

export type PdfTextItem = { str?: string };

export type PdfPage = {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
    canvas: HTMLCanvasElement;
  }) => PdfRenderTask;
  getTextContent: () => Promise<{ items: PdfTextItem[] }>;
};

export type PdfDoc = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPage>;
  destroy: () => Promise<void>;
};

let pdfjsReady: Promise<typeof import("pdfjs-dist")> | null = null;

export function loadPdfJs() {
  if (!pdfjsReady) {
    pdfjsReady = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      return pdfjs;
    });
  }
  return pdfjsReady;
}

export async function openPdfDocument(materialId: string): Promise<PdfDoc> {
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({
    url: `/api/materials/${materialId}/file`,
    withCredentials: true,
  });
  return (await loadingTask.promise) as unknown as PdfDoc;
}

export function pageTextFromContent(items: PdfTextItem[]): string {
  return items
    .map((item) => item.str ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
