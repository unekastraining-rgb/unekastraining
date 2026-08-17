export interface SyllabusAssignment {
  title: string;
  dueDate: string | null;
  description?: string | null;
}

export interface SyllabusExtraction {
  courseName: string;
  courseCode?: string | null;
  instructor: string | null;
  semester: string | null;
  assignments: SyllabusAssignment[];
}

export interface SyllabusIngestResult {
  uploadId: string;
  fileName: string;
  extractedText: string;
  extraction: SyllabusExtraction;
}

export interface SaveCoursePayload {
  uploadId: string;
  fileName: string;
  extractedText: string;
  extraction: SyllabusExtraction;
}
