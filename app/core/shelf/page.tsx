import { HubBackBar } from "@/components/hub/HubBackBar";
import { NotebookShelfView } from "@/components/core/NotebookShelfView";
import { CustomizationProvider } from "@/components/customization/CustomizationProvider";
import { db } from "@/lib/db";
import { backfillUserCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";
import { getOrCreateDefaultUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function CoreShelfPage() {
  const user = await getOrCreateDefaultUser();
  await backfillUserCourseTopicsIfEmpty(user.id);

  const notes = await db.note.findMany({
    where: { userId: user.id },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    include: {
      course: { select: { id: true, title: true, color: true } },
    },
  });

  const initialNotes = notes.map((note) => ({
    id: note.id,
    title: note.title,
    method: note.method,
    updatedAt: note.updatedAt.toISOString(),
    contentJson: note.contentJson,
    course: note.course,
  }));

  return (
    <CustomizationProvider>
      <HubBackBar title="Notebook shelf" planningActive="core" />
      <NotebookShelfView initialNotes={initialNotes} />
    </CustomizationProvider>
  );
}
