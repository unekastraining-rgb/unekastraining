import { Suspense } from "react";

import { HubBackBar } from "@/components/hub/HubBackBar";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

import { TeachMeClient } from "./teach-me-client";

export const dynamic = "force-dynamic";

export default async function TeachMePage() {
  const user = await getOrCreateDefaultUser();
  const courses = await db.course.findMany({
    where: { userId: user.id },
    select: { id: true, title: true },
  });

  return (
    <>
      <HubBackBar title="Teach Me" />
      <Suspense fallback={<div className="px-6 py-12 text-stone-500">Loading…</div>}>
        <TeachMeClient courses={courses} />
      </Suspense>
    </>
  );
}
