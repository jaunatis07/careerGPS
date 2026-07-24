import { buildPlannerSystemPrompt } from "@/lib/ai/prompts/planner-system-prompt";

export type AgentType = "planner" | "resume";

export interface UserChatContext {
  grade_level: string | null;
  target_role: string | null;
  mbti: string | null;
  holland: string | null;
  assessment_tags: string[] | null;
}

const AGENT_LABELS: Record<AgentType, string> = {
  planner: "生涯规划 Agent",
  resume: "简历排雷 Agent",
};

/**
 * 根据 Agent 类型与用户档案，构建 System Prompt。
 */
export function buildSystemPrompt(
  agentType: AgentType,
  context: UserChatContext | null,
): string {
  if (agentType === "planner") {
    return buildPlannerSystemPrompt(context);
  }

  const agentLabel = AGENT_LABELS[agentType];
  const tagLine =
    context?.assessment_tags && context.assessment_tags.length > 0
      ? `用户测评标签：${context.assessment_tags.map((tag) => `[${tag}]`).join(" ")}`
      : "用户尚未完成自研测评，回答时可引导其前往 /assessment。";

  const profileLine = [
    context?.mbti ? `MBTI：${context.mbti}` : null,
    context?.holland ? `霍兰德：${context.holland}` : null,
  ]
    .filter(Boolean)
    .join("；");

  return [
    `你是 CareerGPS 平台的${agentLabel}，面向大学生与初入职场的用户，提供务实、可执行的中文职业建议。`,
    "回答要求：结构清晰、步骤具体、避免空泛鸡汤；不确定的信息要明确标注。",
    profileLine ? `用户档案：${profileLine}` : "",
    tagLine,
  ]
    .filter(Boolean)
    .join("\n");
}
