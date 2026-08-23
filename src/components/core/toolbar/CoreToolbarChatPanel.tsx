"use client";

import { CoreSourceChat } from "@/components/core/CoreSourceChat";
import { CoreToolbarShell } from "@/components/core/toolbar/CoreToolbarShell";

export function CoreToolbarChatPanel({
  courseId,
  materialId,
  onOpenAssist,
  onClose,
}: {
  courseId: string;
  materialId: string | null;
  onOpenAssist: () => void;
  onClose: () => void;
}) {
  return (
    <CoreToolbarShell title="Chat" onClose={onClose} className="w-[min(28rem,calc(100vw-2rem))]">
      <p className="mb-3 text-xs text-stone-500">
        Research, summarize, and create from your course materials — like Assist, but right on the
        page.
      </p>
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={onOpenAssist}
          className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white"
        >
          Open full Assist panel
        </button>
      </div>
      <CoreSourceChat courseId={courseId} materialId={materialId} />
    </CoreToolbarShell>
  );
}
