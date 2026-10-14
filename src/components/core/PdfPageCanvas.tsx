"use client";

import { useEffect, useRef } from "react";

import type { PdfDoc } from "@/lib/core/pdfjs-client";

/**
 * Renders one PDF page to a bitmap so ink can sit in the same coordinate space
 * (GoodNotes-style annotate — not an iframe overlay).
 */
export function PdfPageCanvas({
  doc,
  docVersion,
  pageNumber,
  zoom,
  onError,
  onBusyChange,
  children,
}: {
  doc: PdfDoc | null;
  docVersion: number;
  pageNumber: number;
  zoom: number;
  onError?: (message: string | null) => void;
  onBusyChange?: (busy: boolean) => void;
  children?: import("react").ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pdf = doc;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!pdf || !canvas || !wrap || docVersion === 0) return;

    let cancelled = false;
    let renderTask: { promise: Promise<void>; cancel: () => void } | null = null;

    async function paint() {
      onBusyChange?.(true);
      try {
        const page = await pdf!.getPage(pageNumber);
        if (cancelled) return;

        const base = page.getViewport({ scale: 1 });
        const containerWidth =
          wrap!.parentElement?.clientWidth || wrap!.clientWidth || base.width;
        const fitScale = Math.max(0.55, (containerWidth * zoom) / base.width);
        const viewport = page.getViewport({ scale: fitScale });
        const ratio = Math.min(window.devicePixelRatio || 1, 2);

        canvas!.width = Math.floor(viewport.width * ratio);
        canvas!.height = Math.floor(viewport.height * ratio);
        canvas!.style.width = `${viewport.width}px`;
        canvas!.style.height = `${viewport.height}px`;

        const ctx = canvas!.getContext("2d");
        if (!ctx) return;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, viewport.width, viewport.height);

        renderTask = page.render({
          canvasContext: ctx,
          viewport,
          canvas: canvas!,
        });
        await renderTask.promise;
        if (!cancelled) onError?.(null);
      } catch (error) {
        if (!cancelled && !(error instanceof Error && /cancel/i.test(error.message))) {
          onError?.(
            error instanceof Error ? error.message : "Could not render this page.",
          );
        }
      } finally {
        if (!cancelled) onBusyChange?.(false);
      }
    }

    void paint();
    return () => {
      cancelled = true;
      try {
        renderTask?.cancel();
      } catch {
        // ignore cancel races
      }
    };
  }, [doc, docVersion, pageNumber, zoom, onBusyChange, onError]);

  return (
    <div ref={wrapRef} className="relative mx-auto w-fit max-w-full">
      <canvas
        ref={canvasRef}
        className="block max-w-full bg-white shadow-sm ring-1 ring-stone-200/60"
        aria-label={`PDF page ${pageNumber}`}
      />
      {children ? (
        <div className="absolute inset-0 z-10">{children}</div>
      ) : null}
    </div>
  );
}
