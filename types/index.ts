export interface UserProfileQuota {
  daily_quota_used: number;
  last_quota_reset: string;
}

export interface QuotaSummary {
  limit: number;
  used: number;
  remaining: number;
}

export type IntensityLevel = "低" | "中" | "高" | "极高";

export interface CareerNode {
  id: string;
  label: string;
  children?: CareerNode[];
}

export interface JobInsight {
  title: string;
  salaryRange: string;
  education: string;
  hardSkills: string[];
  intensity: IntensityLevel;
  intensityScore: number;
  careerPath: string[];
  summary: string;
  updatedAt: string;
}
