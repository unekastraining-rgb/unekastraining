import Link from "next/link";

import { HubBackBar } from "@/components/hub/HubBackBar";
import { HubSubpageShell } from "@/components/hub/HubSubpageShell";
import { AddCourseMaterialButton } from "@/components/materials/AddCourseMaterialModal";
import { MaterialsSelectableList } from "@/components/materials/MaterialsSelectableList";
import { readableCourseTitle } from "@/lib/courses/display-name";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

import { MaterialsClientSearch } from "./materials-client";

export const dynamic = "force-dynamic";

/**
 * 2P-27 — Minimal My Materials surface.
 * Does not replace CORE; feeds existing ULE via prepare → concept → Adaptive.
 */
export default async function MaterialsPage() {
  const user = await getOrCreateDefaultUser();

  const [materials, courses] = await Promise.all([
    db.courseMaterial.findMany({
      where: { course: { userId: user.id } },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        course: { select: { id: true, title: true, code: true } },
      },
    }),
    db.course.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
      take: 50,
    }),
  ]);

  return (
    <HubSubpageShell>
      <HubBackBar title="My Materials" />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6" data-materials-page>
        <header className="space-y-2">
          <h1 className="font-serif text-3xl text-stone-900">My Materials</h1>
          <p className="text-sm text-stone-600">
            Add syllabi, notes, and course documents. Prepare them for learning —
            mastery only comes from real practice.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <AddCourseMaterialButton
              courses={courses}
              courseId={courses[0]?.id}
              label="Add material"
            />
            <Link
              href="/core"
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-800"
            >
              Open CORE
            </Link>
            <Link
              href="/study"
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-800"
            >
              Explore learning
            </Link>
            <Link
              href="/study/teach-me"
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-800"
            >
              Tutor
            </Link>
          </div>
        </header>

        <MaterialsClientSearch />

        {materials.length === 0 ? (
          <div
            className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-10 text-center"
            data-materials-empty
          >
            <p className="text-sm font-medium text-stone-800">
              You haven&apos;t added learning material yet.
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Add a syllabus, PDF, or notes — or open CORE to start writing.
            </p>
          </div>
        ) : (
          <MaterialsSelectableList
            variant="page"
            materials={materials.map((material) => ({
              id: material.id,
              title: material.title,
              type: material.type,
              courseId: material.courseId,
              courseLabel: readableCourseTitle(
                material.course.title,
                material.course.code,
              ),
            }))}
          />
        )}
      </div>
    </HubSubpageShell>
  );
}
