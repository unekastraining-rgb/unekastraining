"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { GlobalSearch } from "./GlobalSearch";

export const GLOBAL_SEARCH_INPUT_SELECTOR = "[data-global-search-input]";

export function GlobalSearchLauncher() {
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();

        const inlineInput = document.querySelector<HTMLInputElement>(
          GLOBAL_SEARCH_INPUT_SELECTOR,
        );

        if (inlineInput) {
          inlineInput.focus();
          inlineInput.dispatchEvent(new Event("global-search-open", { bubbles: true }));
          return;
        }

        setModalOpen(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!modalOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setModalOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  if (!modalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-stone-900/40 p-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setModalOpen(false);
      }}
    >
      <div className="w-full max-w-xl rounded-2xl border border-brand bg-white p-4 shadow-2xl shadow-stone-200/40">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-stone-800">Search Study Haul</p>
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="rounded-lg p-1.5 text-stone-500 hover:bg-brand-soft"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <GlobalSearch
          autoFocus
          onNavigate={() => setModalOpen(false)}
        />
      </div>
    </div>
  );
}
