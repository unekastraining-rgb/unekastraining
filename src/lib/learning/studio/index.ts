/**
 * Bundle G — Learning Studio instructional experience surface.
 */

export type {
  LearningStudioStage,
  LearningInteractionKind,
  LearningInteraction,
  ConceptRelationEdge,
  ConceptRelationshipMap,
  CurriculumSection,
  InstructionalMoment,
} from "@/lib/learning/studio/types";

export {
  deepenConceptToChunks,
  buildConceptRelationshipMap,
} from "@/lib/learning/studio/deepen-concept";

export {
  buildRecognitionInteraction,
  buildTransferInteraction,
  buildExplainInteraction,
  buildApplyInteraction,
  resolveChunkInteraction,
  evaluateSelectInteraction,
  isSelectInteraction,
} from "@/lib/learning/studio/interactions";

export {
  buildCurriculumSections,
} from "@/lib/learning/studio/curriculum-sections";

export {
  curriculumPositionLabel,
  curriculumStatusForIndex,
  toCurriculumPositionStatus,
  type CurriculumPositionStatus,
} from "@/lib/learning/studio/curriculum-position";

export {
  buildCourseOverviewFromPath,
  type CourseOverview,
  type CourseOverviewItem,
} from "@/lib/learning/studio/course-overview";

export {
  studioStageFromChunk,
  depthSectionHintFromChunk,
  buildInstructionalMoments,
  STUDIO_STAGE_SEQUENCE,
  studioStageLabel,
} from "@/lib/learning/studio/moments";

export {
  enrichLessonForStudio,
  lessonFromDeepenedConcept,
  type EnrichLessonStudioInput,
} from "@/lib/learning/studio/enrich-lesson";

export {
  learningObjectFromChunk,
  resolveStageMode,
  type LearningObject,
  type LearningObjectKind,
} from "@/lib/learning/studio/learning-objects";
