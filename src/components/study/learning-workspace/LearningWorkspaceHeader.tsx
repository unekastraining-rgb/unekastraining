"use client";

import { PATH_POSITION_DISCLAIMER } from "@/lib/learning/unified-experience";
import type { LearningWorkspaceContext } from "@/lib/learning/workspace";

/**
 * Bundle G UX — Compact studio chrome.
 * Primary signal: current concept. Path position is secondary (not mastery).
 */
export function LearningWorkspaceHeader({
  courseTitle,
  organizationalLabel,
  workspace,
  experienceLines,
  learningGoal,
  curriculumCollapsed,
  onShowCurriculum,
}: {
  courseTitle?: string | null;
  organizationalLabel?: string | null;
  workspace: LearningWorkspaceContext;
  experienceLines?: {
    what: string;
    where: string | null;
    doing: string;
    next: string | null;
    how: string | null;
  } | null;
  learningGoal?: string | null;
  curriculumCollapsed?: boolean;
  onShowCurriculum?: () => void;
}) {
  const pathLabel = workspace.pathTitle ?? courseTitle;

  return (
    <header
      data-learning-workspace-header
      data-learning-studio-header
      data-unified-learning-experience={experienceLines ? "true" : undefined}
      className="border-b border-stone-800/10 bg-[#f7f5f1] px-4 py-3 sm:px-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {curriculumCollapsed && onShowCurriculum ? (
            <button
              type="button"
              data-curriculum-show-header
              onClick={onShowCurriculum}
              className="inline-flex min-h-10 items-center gap-2 border border-stone-800/15 bg-white px-3 text-xs font-semibold text-stone-800 touch-manipulation hover:bg-stone-50"
            >
              <span aria-hidden>☰</span>
              <span className="max-w-[10rem] truncate">
                {pathLabel ?? "Curriculum"}
              </span>
            </button>
          ) : null}
          <div className="min-w-0">
            {(pathLabel || organizationalLabel) && !curriculumCollapsed ? (
              <p
                data-learn-org-context
                className="text-[11px] font-medium uppercase tracking-[0.14em] text-stone-500"
              >
                {pathLabel}
                {pathLabel && organizationalLabel ? " · " : null}
                {organizationalLabel ? (
                  <span data-learn-organizational-label>
                    {organizationalLabel}
                  </span>
                ) : null}
              </p>
            ) : null}
            <h1
              data-learn-concept-title
              className="font-serif text-xl font-bold tracking-tight text-stone-950 sm:text-2xl"
            >
              {workspace.conceptTitle ?? "Learning"}
            </h1>
          </div>
        </div>

        {workspace.conceptPosition != null &&
        workspace.conceptTotal != null &&
        workspace.conceptTotal > 1 ? (
          <div
            data-teach-progression
            data-path-position
            data-path-is-not-mastery="true"
            className="shrink-0 text-right"
            title={PATH_POSITION_DISCLAIMER}
          >
            <p className="text-sm font-semibold text-stone-800">
              {workspace.conceptPosition}/{workspace.conceptTotal}
            </p>
            <p className="text-[10px] text-stone-400">Progress</p>
          </div>
        ) : null}
      </div>
      {learningGoal ? (
        <p
          data-learn-goal
          className="mt-2 max-w-2xl text-sm text-stone-600"
        >
          {learningGoal}
        </p>
      ) : null}
    </header>
  );
}
