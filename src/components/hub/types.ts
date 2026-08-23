import type { AttentionItem } from "@/lib/csl/attention";
import type { AppNotification } from "@/lib/notifications";
import type { ProgressSnapshot } from "@/lib/csl/progress";
import type { HubTelemetrySnapshot } from "@/lib/csl/study-sessions";
import type { GeneratedCurriculum } from "@/lib/syllabus/types";
import type { CalendarEvent } from "@/lib/calendar/types";

export type HubTab = "hub" | "classes" | "locker" | "chat" | "settings";

export interface HubCourse {
  id: string;
  title: string;
  code: string | null;
  instructor: string | null;
  semester: string | null;
  color: string | null;
  assignmentCount: number;
  materialCount: number;
  meetingCount: number;
}

export interface HubAssignment {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string | null;
  kind?: string;
  status: string;
  grade?: number | null;
  maxGrade?: number | null;
  courseId: string;
  courseTitle: string;
  courseColor: string | null;
  source?: "syllabus" | "manual" | "lms";
}

export interface HubMeeting {
  id: string;
  courseId: string;
  courseTitle: string;
  courseColor: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location?: string | null;
  title?: string | null;
}

export interface HubMaterial {
  id: string;
  title: string;
  type: string;
  courseId: string;
  courseTitle: string;
  courseColor: string | null;
}

export interface HubStats {
  pendingAssignments: number;
  dueFlashcards: number;
  overallMastery: number;
  todayTasks: number;
}

export interface HubUser {
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

export interface HubJumpBackIn {
  title: string;
  subtitle: string;
  href: string;
}

export interface HubGradeSchoolPlan {
  courseId: string;
  courseTitle: string;
  courseColor: string | null;
  curriculum: GeneratedCurriculum;
  completedSteps?: number[];
  flashcardCount?: number;
}

export interface HubData {
  user: HubUser;
  jumpBackIn: HubJumpBackIn | null;
  updates: AppNotification[];
  courses: HubCourse[];
  assignments: HubAssignment[];
  meetings: HubMeeting[];
  materials: HubMaterial[];
  todayCalendarEvents: CalendarEvent[];
  stats: HubStats;
  attention: AttentionItem[];
  progress: ProgressSnapshot;
  telemetry: HubTelemetrySnapshot;
  gradeSchoolPlans: HubGradeSchoolPlan[];
}
