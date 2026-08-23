import { Suspense } from "react";
import { notFound } from "next/navigation";

import { HubBackBar } from "@/components/hub/HubBackBar";
import { SixGuidedSession } from "@/components/study/SixGuidedSession";
import { SIX_GUIDES } from "@/lib/csl/six-guides";
import type { SixComponent } from "@/lib/csl/six";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/user";

const VALID = Object.keys(SIX_GUIDES) as SixComponent[];

export default async function SixGuidePage({
  params,
}: {
  params: Promise<{ component: string }>;
}) {
  const { component } = await params;
  if (!VALID.includes(component as SixComponent)) {
    notFound();
  }

  const user = await requireUser();
  const courses = await db.course.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });

  return (
    <>
      <HubBackBar title="Six Technique" planningActive="study" />
      <Suspense fallback={<div className="px-6 py-12 text-stone-500">Loading session…</div>}>
        <SixGuidedSession component={component as SixComponent} initialCourses={courses} />
      </Suspense>
    </>
  );
}
