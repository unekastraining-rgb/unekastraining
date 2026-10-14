"use client";

import { CoreNotesWorkspace } from "@/components/core/CoreNotesWorkspace";
import type { CoreGoAction } from "@/lib/core/core-go-actions";
import type { CoreInitialNote } from "@/lib/core/core-initial-note";

type CourseOption = {
  id: string;
  title: string;
  focusTopic: string | null;
  topics: string[];
};

/**
 * Thin wrapper — always render the workspace (SSR + client).
 *
 * Do not gate on useEffect/mounted: if client JS is slow or stuck on iPad,
 * a mount gate leaves the page on “Loading notes…” forever.
 */
export function CoreNotesWorkspaceMount({
  initialCourses,
  launchAction,
  hideHubChrome = false,
  initialNote = null,
}: {
  initialCourses: CourseOption[];
  launchAction?: CoreGoAction;
  hideHubChrome?: boolean;
  initialNote?: CoreInitialNote | null;
}) {
  // Remount when shelf opens a different notebook so useState picks up
  // SSR-loaded ink/content (initializers do not re-run on soft navigations).
  return (
    <CoreNotesWorkspace
      key={initialNote?.id ?? launchAction ?? "core-empty"}
      initialCourses={initialCourses}
      launchAction={launchAction}
      hideHubChrome={hideHubChrome}
      initialNote={initialNote}
    />
  );
}
