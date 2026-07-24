export type ResumeAnalysisMode = "jd_only" | "resume_only" | "jd_and_resume";

/**
 * 根据 JD / 简历内容是否为空，判定动态分析路由。
 */
export function detectAnalysisMode(
  jdText?: string | null,
  resumeText?: string | null,
): ResumeAnalysisMode | null {
  const hasJd = Boolean(jdText?.trim());
  const hasResume = Boolean(resumeText?.trim());

  if (hasJd && hasResume) {
    return "jd_and_resume";
  }

  if (hasJd) {
    return "jd_only";
  }

  if (hasResume) {
    return "resume_only";
  }

  return null;
}

export const ANALYSIS_MODE_LABELS: Record<ResumeAnalysisMode, string> = {
  jd_only: "JD 拆解模式",
  resume_only: "简历诊断模式",
  jd_and_resume: "JD + 简历匹配模式",
};
