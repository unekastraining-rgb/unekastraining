import { HubBackBar } from "@/components/hub/HubBackBar";
import { CalendarWorkspace } from "@/components/calendar/CalendarWorkspace";
import {
  parseCalendarDateParam,
  parseCalendarViewParam,
} from "@/lib/calendar/links";
import { localDateKey } from "@/lib/calendar/types";
import { coursesToWorkspace } from "@/lib/calendar/unified-items";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";
import { CustomizationProvider } from "@/components/customization/CustomizationProvider";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
}) {
  const user = await getOrCreateDefaultUser();
  const params = await searchParams;
  const initialDate = parseCalendarDateParam(params.date);
  const initialView = parseCalendarViewParam(params.view);

  const courses = await db.course.findMany({
    where: { userId: user.id },
    select: { id: true, title: true, color: true },
    orderBy: { title: "asc" },
  });

  return (
    <CustomizationProvider>
      <HubBackBar title="Calendar" planningActive="calendar" />
      <CalendarWorkspace
        initialCourses={coursesToWorkspace(courses)}
        initialDate={initialDate ? localDateKey(initialDate) : undefined}
        initialView={initialView}
      />
    </CustomizationProvider>
  );
}
