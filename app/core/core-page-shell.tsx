import { HubSubpageShell } from "@/components/hub/HubSubpageShell";
import { CoreNotesWorkspaceMount } from "@/components/core/CoreNotesWorkspaceMount";
import { CustomizationProvider } from "@/components/customization/CustomizationProvider";
import { db } from "@/lib/db";
import type { CoreInitialNote } from "@/lib/core/core-initial-note";
import type { CoreGoAction } from "@/lib/core/core-go-actions";
import { pickColdStartTopic } from "@/lib/study/cold-start-topic";
import { backfillUserCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";
import { getOrCreateDefaultUser } from "@/lib/user";

export type { CoreInitialNote };

export async function loadCorePageCourses() {
  const user = await getOrCreateDefaultUser();
  await backfillUserCourseTopicsIfEmpty(user.id);
  const courses = await db.course.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      topics: {
        orderBy: { sortOrder: "asc" },
        take: 24,
        select: { name: true },
      },
    },
  });
  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    focusTopic: pickColdStartTopic(course.topics),
    topics: course.topics.map((topic) => topic.name),
  }));
}

async function loadInitialNote(noteId: string): Promise<CoreInitialNote | null> {
  const user = await getOrCreateDefaultUser();
  const note = await db.note.findFirst({
    where: { id: noteId, userId: user.id },
    include: {
      course: { select: { id: true, title: true, color: true } },
      material: { select: { id: true, title: true, type: true } },
    },
  });
  if (!note) return null;
  return {
    id: note.id,
    title: note.title,
    method: note.method,
    contentJson: note.contentJson,
    content: note.content,
    course: note.course,
    material: note.material,
  };
}

/** Original Core UI only — no alternate touch chrome strips. */
export async function CorePageShell({
  launchAction,
  noteId,
}: {
  launchAction?: CoreGoAction;
  noteId?: string;
}) {
  const [courses, initialNote] = await Promise.all([
    loadCorePageCourses(),
    noteId ? loadInitialNote(noteId) : Promise.resolve(null),
  ]);

  return (
    <CustomizationProvider>
      <HubSubpageShell lockViewport>
        <div className="flex h-full min-h-0 max-h-full flex-1 flex-col overflow-hidden">
          <CoreNotesWorkspaceMount
            initialCourses={courses}
            launchAction={launchAction}
            initialNote={initialNote}
          />
        </div>
      </HubSubpageShell>
    </CustomizationProvider>
  );
}
