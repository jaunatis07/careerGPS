export const GRADE_LEVEL_OPTIONS = [
  "大一",
  "大二",
  "大三",
  "大四",
  "研一",
  "研二",
  "研三",
  "已毕业",
] as const;

export type GradeLevel = (typeof GRADE_LEVEL_OPTIONS)[number];

export interface PlannerProfile {
  grade_level: string | null;
  target_role: string | null;
  mbti: string | null;
  holland: string | null;
  assessment_tags: string[];
}
