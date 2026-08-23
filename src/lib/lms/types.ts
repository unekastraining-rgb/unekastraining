export type LMSProviderId =
  | "BLACKBOARD"
  | "CANVAS"
  | "MOODLE"
  | "GOOGLE_CLASSROOM"
  | "OTHER";

export interface LMSProviderInfo {
  id: LMSProviderId;
  name: string;
  description: string;
  connectType: "oauth" | "url-token" | "manual";
  docsUrl?: string;
}

export const LMS_PROVIDERS: LMSProviderInfo[] = [
  {
    id: "BLACKBOARD",
    name: "Blackboard",
    description: "Sync courses, gradebook columns, and your grades from Blackboard Learn.",
    connectType: "oauth",
    docsUrl: "https://docs.blackboard.com/",
  },
  {
    id: "CANVAS",
    name: "Canvas",
    description: "Import courses, assignments, and due dates from Canvas LMS.",
    connectType: "oauth",
    docsUrl: "https://canvas.instructure.com/doc/api/",
  },
  {
    id: "MOODLE",
    name: "Moodle",
    description: "Connect your Moodle site to pull course calendars and tasks.",
    connectType: "url-token",
  },
  {
    id: "GOOGLE_CLASSROOM",
    name: "Google Classroom",
    description: "Bring in classwork and due dates from Google Classroom.",
    connectType: "oauth",
  },
];

export interface LMSConnectRequest {
  provider: LMSProviderId;
  baseUrl?: string;
  accessToken?: string;
}

export interface LMSSyncResult {
  provider: LMSProviderId;
  coursesFound: number;
  assignmentsImported: number;
  meetingsImported: number;
  message: string;
}
