"use client";

import { CoreSourceChat } from "@/components/core/CoreSourceChat";
import { CoreToolbarShell } from "@/components/core/toolbar/CoreToolbarShell";
import type { ChapterStudyExtract } from "@/lib/core/chapter-study-extract";
import type { CoreNotebookActionContext } from "@/lib/core/notebook-action-context";

export function CoreToolbarChatPanel({
  courseId,
  materialId,
  studyExtract = null,
  pageSourceText = "",
  onNotebookAction,
  onOpenAssist,
  onClose,
}: {
  courseId: string;
  materialId: string | null;
  studyExtract?: ChapterStudyExtract | null;
  pageSourceText?: string;
  onNotebookAction?: (ctx: CoreNotebookActionContext) => Promise<string | void>;
  onOpenAssist: () => void;
  onClose: () => void;
}) {
  return (
    <CoreToolbarShell title="Assist" onClose={onClose} className="w-[min(28rem,calc(100vw-2rem))]">
      <p className="mb-3 text-xs text-stone-500">
        Research, summarize, and create from your course materials — quick Assist right on the page.
      </p>
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={onOpenAssist}
          className="min-h-11 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white touch-manipulation"
        >
          Open full Assist panel
        </button>
      </div>
      <CoreSourceChat
        courseId={courseId}
        materialId={materialId}
        studyExtract={studyExtract}
        pageSourceText={pageSourceText}
        onNotebookAction={onNotebookAction}
      />
    </CoreToolbarShell>
  );
}
