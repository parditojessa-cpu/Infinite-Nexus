export const ROLES = ["student", "teacher"] as const;
export type Role = (typeof ROLES)[number];

export const DASHBOARD_VARIANTS = ["cards", "agenda", "gamified"] as const;
export type DashboardVariant = (typeof DASHBOARD_VARIANTS)[number];

export const RISK_TIERS = [
  "excellent",
  "satisfactory",
  "needs_monitoring",
  "at_risk",
  "critical",
] as const;
export type RiskTier = (typeof RISK_TIERS)[number];

export const INTERVENTION_STATUSES = [
  "no_intervention_required",
  "under_monitoring",
  "under_intervention",
  "intensive_intervention",
  "completed",
] as const;
export type InterventionStatus = (typeof INTERVENTION_STATUSES)[number];

export const INTERVENTION_TIERS = ["tier1", "tier2", "tier3"] as const;
export type InterventionTier = (typeof INTERVENTION_TIERS)[number];

export const MODULE_STATUSES = ["draft", "published"] as const;
export type ModuleStatus = (typeof MODULE_STATUSES)[number];

export const LESSON_PROGRESS_STATUSES = ["locked", "active", "done"] as const;
export type LessonProgressStatus = (typeof LESSON_PROGRESS_STATUSES)[number];

export const LESSON_RESOURCE_TYPES = [
  "lesson_exemplar",
  "las",
  "curriculum_guide",
  "dll",
  "powerpoint",
  "video",
  "worksheet",
  "pdf",
  "word_doc",
] as const;
export type LessonResourceType = (typeof LESSON_RESOURCE_TYPES)[number];

export const QUESTION_TYPES = [
  "multiple_choice",
  "true_false",
  "identification",
  "checkbox",
  "short_answer",
  "matching",
  "essay",
  "image_question",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const SUBMISSION_STATUSES = ["not_submitted", "submitted", "graded"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const ATTENDANCE_STATUSES = ["present", "late", "absent", "excused"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const GRADEBOOK_CATEGORIES = [
  "quiz",
  "assignment",
  "exam",
  "performance_task",
  "project",
  "attendance",
  "participation",
] as const;
export type GradebookCategory = (typeof GRADEBOOK_CATEGORIES)[number];

export const CERTIFICATE_TYPES = [
  "completion",
  "excellence",
  "honor",
  "perfect_attendance",
] as const;
export type CertificateType = (typeof CERTIFICATE_TYPES)[number];

export const ROOT_CAUSES = [
  "poor_attendance",
  "low_assessment_scores",
  "reading_difficulty",
  "numeracy_difficulty",
  "learning_gap",
  "behavior",
  "health_concern",
  "internet_connectivity",
  "family_concern",
  "lack_of_motivation",
  "other",
] as const;
export type RootCause = (typeof ROOT_CAUSES)[number];

export const INTERVENTION_STRATEGIES = [
  "peer_tutoring",
  "remediation",
  "reinforcement_activities",
  "practice_worksheets",
  "learning_activity_sheet",
  "lesson_exemplar",
  "video_lesson",
  "interactive_quiz",
  "gamified_learning",
  "small_group_discussion",
  "teacher_conference",
  "parent_conference",
  "home_visit",
  "individual_coaching",
  "project_based_learning",
  "learning_contract",
  "reading_program",
  "numeracy_program",
] as const;
export type InterventionStrategy = (typeof INTERVENTION_STRATEGIES)[number];

export const INTERVENTION_PLAN_STATUSES = ["active", "completed", "discontinued"] as const;
export type InterventionPlanStatus = (typeof INTERVENTION_PLAN_STATUSES)[number];

export const INTERVENTION_PROGRAM_STATUSES = [
  "draft",
  "active",
  "completed",
  "archived",
] as const;
export type InterventionProgramStatus = (typeof INTERVENTION_PROGRAM_STATUSES)[number];

export const TIMELINE_EVENT_TYPES = [
  "started",
  "activity_completed",
  "teacher_feedback",
  "student_reflection",
  "weekly_progress",
  "monthly_evaluation",
] as const;
export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];
