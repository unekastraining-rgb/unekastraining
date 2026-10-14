"use client";

import { useCallback, useEffect, useState } from "react";

import {
  openPdfDocument,
  pageTextFromContent,
  type PdfDoc,
} from "@/lib/core/pdfjs-client";

export type PdfSearchHit = {
  pageNumber: number;
  snippet: string;
};

/**
 * Shared pdf.js document for page bitmaps, continuous scroll, and search→page jump.
 */
export function usePdfDocument(materialId: string) {
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [docVersion, setDocVersion] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageTexts, setPageTexts] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    let opened: PdfDoc | null = null;

    async function open() {
      setBusy(true);
      setError(null);
      setPageTexts([]);
      setPageCount(0);
      setDoc(null);

      try {
        const pdf = await openPdfDocument(materialId);
        opened = pdf;
        if (cancelled) {
          await pdf.destroy();
          return;
        }
        setDoc(pdf);
        setPageCount(pdf.numPages);
        setDocVersion((value) => value + 1);
        setBusy(false);

        const texts: string[] = [];
        for (let page = 1; page <= pdf.numPages; page += 1) {
          if (cancelled) return;
          try {
            const pdfPage = await pdf.getPage(page);
            const content = await pdfPage.getTextContent();
            texts[page - 1] = pageTextFromContent(content.items);
          } catch {
            texts[page - 1] = "";
          }
          if (page % 4 === 0 || page === pdf.numPages) {
            setPageTexts([...texts]);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not open this PDF.");
          setBusy(false);
        }
      }
    }

    void open();
    return () => {
      cancelled = true;
      setDoc(null);
      void opened?.destroy().catch(() => {});
    };
  }, [materialId]);

  const searchPages = useCallback(
    (query: string, limit = 12): PdfSearchHit[] => {
      const needle = query.trim().toLowerCase();
      if (!needle) return [];
      const hits: PdfSearchHit[] = [];
      for (let i = 0; i < pageTexts.length; i += 1) {
        const text = pageTexts[i] ?? "";
        const lower = text.toLowerCase();
        const at = lower.indexOf(needle);
        if (at < 0) continue;
        const start = Math.max(0, at - 40);
        const snippet = text.slice(start, start + 120).trim();
        hits.push({
          pageNumber: i + 1,
          snippet: start > 0 ? `…${snippet}` : snippet,
        });
        if (hits.length >= limit) break;
      }
      return hits;
    },
    [pageTexts],
  );

  return {
    doc,
    docVersion,
    pageCount,
    busy,
    error,
    setError,
    pageTexts,
    searchPages,
  };
}
