import { HubBackBar } from "@/components/hub/HubBackBar";
import { GradeSchoolLessonView } from "@/components/grade-school/GradeSchoolLessonView";

export const dynamic = "force-dynamic";

export default function GradeSchoolStudyPage() {
  return (
    <>
      <HubBackBar title="Guided lesson" planningActive="study" />
      <div className="px-4 py-8 md:px-6">
        <GradeSchoolLessonView />
      </div>
    </>
  );
}
