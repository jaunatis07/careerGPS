import type { ResumeAnalysisMode } from "@/lib/resume/detect-analysis-mode";

export interface CompanyRiskReport {
  companyName: string;
  riskLevel: "low" | "medium" | "high";
  summary: string;
  risks: string[];
  source: "seed" | "api";
}

export interface ResumeAnalysisContext {
  mode: ResumeAnalysisMode;
  jdText?: string;
  resumeText?: string;
  companyRisk?: CompanyRiskReport | null;
}

/**
 * 构建简历排雷 Agent 的 System Prompt，按动态路由切换分析策略。
 */
export function buildResumeAnalysisSystemPrompt(
  context: ResumeAnalysisContext,
): string {
  const modeInstructions: Record<ResumeAnalysisMode, string> = {
    jd_only: [
      "## 当前模式：仅 JD 拆解",
      "- 提炼 JD 核心素质要求、硬性门槛与隐性偏好",
      "- 预测 5-8 个高概率面试考点",
      "- 标注 JD 中可能的「坑点」（过度加班、职责模糊、挂羊头卖狗肉）",
      "- **禁止**凭空编造用户简历或假设候选人背景",
    ].join("\n"),
    resume_only: [
      "## 当前模式：仅简历诊断",
      "- 量化评估项目/实习成果表达是否清晰（STAR 法则）",
      "- 指出 3-5 条最影响约面的表述问题",
      "- 反向推荐 2-3 类更匹配的岗位方向",
      "- 给出可执行的改写方向，但不捏造经历",
    ].join("\n"),
    jd_and_resume: [
      "## 当前模式：JD + 简历匹配",
      "- 输出 **胜任力 Match 打分（0-100）** 及一句话理由",
      "- 列出「已匹配 / 部分匹配 / 明显缺口」三类要点",
      "- 给出 **Markdown 格式** 的简历改写建议（按模块：教育/经历/项目/技能）",
      "- 改写建议必须基于已有经历重组表达，**禁止虚构**新公司与新成果",
    ].join("\n"),
  };

  const companySection = context.companyRisk
    ? [
        "## 企业排雷情报（供参考，需在分析中体现）",
        `公司：${context.companyRisk.companyName}`,
        `风险等级：${context.companyRisk.riskLevel}`,
        `摘要：${context.companyRisk.summary}`,
        "风险点：",
        ...context.companyRisk.risks.map((risk) => `- ${risk}`),
      ].join("\n")
    : "";

  return [
    "# 角色",
    "你是 CareerGPS「简历排雷 Agent」，帮助用户识别 JD/简历风险并提升匹配度。",
    "输出使用 Markdown，条理清晰，面向大学生与 0-3 年职场新人。",
    "",
    modeInstructions[context.mode],
    "",
    companySection,
    "",
    "# 通用要求",
    "- 敏感信息已被平台脱敏，不要尝试还原真实姓名或联系方式",
    "- 不确定的信息用「待核实」标注",
    "- jd_and_resume 模式下必须在开头给出 Match 分数",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * 构建发送给模型的用户侧汇总 Prompt。
 */
export function buildResumeAnalysisUserPrompt(
  context: ResumeAnalysisContext,
): string {
  const sections: string[] = [`分析模式：${context.mode}`];

  if (context.jdText) {
    sections.push("【JD 内容（已脱敏）】", context.jdText);
  }

  if (context.resumeText) {
    sections.push("【简历内容（已脱敏）】", context.resumeText);
  }

  sections.push("请按 System Prompt 要求输出完整分析报告。");

  return sections.join("\n\n");
}
