/** Tunable defaults — not sourced from the design brief, flagged for later adjustment. */

export const DEFAULT_PASSING_THRESHOLD = 75;

export const TEACHER_SIGNUP_EMAIL_DOMAIN = "finitenexus.edu";

export const XP_RULES = {
  complete_lesson: 10,
  complete_quiz: 25,
  perfect_quiz: 50,
  complete_assignment: 30,
  daily_login: 5,
} as const;

export interface LevelDefinition {
  level: number;
  name: string;
  xpRequired: number;
}

export const LEVEL_LADDER: LevelDefinition[] = [
  { level: 1, name: "Beginner", xpRequired: 0 },
  { level: 2, name: "Learner", xpRequired: 150 },
  { level: 3, name: "Achiever", xpRequired: 400 },
  { level: 4, name: "Scholar", xpRequired: 800 },
  { level: 5, name: "Expert", xpRequired: 1500 },
  { level: 6, name: "Master", xpRequired: 2500 },
];

export function levelForXp(xp: number): LevelDefinition {
  let current = LEVEL_LADDER[0];
  for (const def of LEVEL_LADDER) {
    if (xp >= def.xpRequired) current = def;
  }
  return current;
}

export function nextLevelForXp(xp: number): LevelDefinition | null {
  const current = levelForXp(xp);
  const idx = LEVEL_LADDER.findIndex((l) => l.level === current.level);
  return LEVEL_LADDER[idx + 1] ?? null;
}

export const ROOT_CAUSE_LABELS: Record<string, string> = {
  poor_attendance: "Poor Attendance",
  low_assessment_scores: "Low Assessment Scores",
  reading_difficulty: "Reading Difficulty",
  numeracy_difficulty: "Numeracy Difficulty",
  learning_gap: "Learning Gap",
  behavior: "Behavior",
  health_concern: "Health Concern",
  internet_connectivity: "Internet Connectivity",
  family_concern: "Family Concern",
  lack_of_motivation: "Lack of Motivation",
  other: "Other",
};

export const INTERVENTION_STRATEGY_LABELS: Record<string, string> = {
  peer_tutoring: "Peer Tutoring",
  remediation: "Remediation",
  reinforcement_activities: "Reinforcement Activities",
  practice_worksheets: "Practice Worksheets",
  learning_activity_sheet: "Learning Activity Sheet",
  lesson_exemplar: "Lesson Exemplar",
  video_lesson: "Video Lesson",
  interactive_quiz: "Interactive Quiz",
  gamified_learning: "Gamified Learning",
  small_group_discussion: "Small Group Discussion",
  teacher_conference: "Teacher Conference",
  parent_conference: "Parent Conference",
  home_visit: "Home Visit",
  individual_coaching: "Individual Coaching",
  project_based_learning: "Project-Based Learning",
  learning_contract: "Learning Contract",
  reading_program: "Reading Program",
  numeracy_program: "Numeracy Program",
};

export const LESSON_RESOURCE_TYPE_LABELS: Record<string, string> = {
  lesson_exemplar: "Lesson Exemplar",
  las: "LAS",
  curriculum_guide: "Curriculum Guide",
  dll: "DLL",
  powerpoint: "PowerPoint",
  video: "Video",
  worksheet: "Worksheet",
  pdf: "PDF",
  word_doc: "Word Doc",
};

export const CERTIFICATE_TYPE_LABELS: Record<string, string> = {
  completion: "Completion",
  excellence: "Excellence",
  honor: "Honor",
  perfect_attendance: "Perfect Attendance",
};

/** Simple v1 rule: recent grade average + attendance rate -> risk tier. Teacher can override. */
export function computeRiskTier(recentAverage: number, attendanceRate: number): string {
  if (recentAverage >= 90 && attendanceRate >= 95) return "excellent";
  if (recentAverage >= 80 && attendanceRate >= 90) return "satisfactory";
  if (recentAverage >= 75 && attendanceRate >= 85) return "needs_monitoring";
  if (recentAverage >= 60 && attendanceRate >= 75) return "at_risk";
  return "critical";
}
