"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function useFocusParam(param = "focus") {
  const searchParams = useSearchParams();
  const focusId = searchParams.get(param);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    if (!focusId) return;

    const scrollTimer = window.setTimeout(() => {
      const element = document.querySelector(`[data-focus-id="${focusId}"]`);
      if (!element) return;

      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedId(focusId);

      const clearTimer = window.setTimeout(() => {
        setHighlightedId(null);
      }, 2600);

      return () => window.clearTimeout(clearTimer);
    }, 120);

    return () => window.clearTimeout(scrollTimer);
  }, [focusId]);

  function focusClass(id: string, baseClass = "") {
    const highlighted =
      highlightedId === id
        ? "ring-2 ring-orange-400 ring-offset-2 ring-offset-[#fff8f1] bg-orange-50/90"
        : "";
    return [baseClass, highlighted].filter(Boolean).join(" ");
  }

  return { focusId, highlightedId, focusClass };
}
