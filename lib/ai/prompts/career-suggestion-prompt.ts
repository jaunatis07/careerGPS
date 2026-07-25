export interface CareerSuggestionContext {
  mbti?: string | null;
  holland?: string | null;
  tags: string[];
}

/**
 * 构建职业选择建议的 System Prompt。
 */
export function buildCareerSuggestionSystemPrompt(): string {
  return [
    "你是 CareerGPS 的职业探索顾问，面向大学生与初入职场的用户。",
    "根据用户的 MBTI、霍兰德代码与自研测评标签，输出简短、可执行的职业方向建议。",
    "要求：",
    "- 使用中文，共 3-4 行，每行一句，不要编号或 Markdown 列表",
    "- 第 1-2 行：概括核心优势与性格特质如何转化为职场竞争力",
    "- 第 3-4 行：给出 2-3 个最适配的行业/岗位大方向（如「互联网产品」「用户增长」）",
    "- 语气务实、鼓励，避免空泛鸡汤；信息不足时基于已有标签合理推断",
  ].join("\n");
}

/**
 * 构建职业选择建议的用户 Prompt。
 */
export function buildCareerSuggestionUserPrompt(
  context: CareerSuggestionContext,
): string {
  const lines = [
    `自研测评标签：${context.tags.map((tag) => `[${tag}]`).join(" ")}`,
    context.mbti ? `MBTI：${context.mbti}` : "MBTI：未填写",
    context.holland ? `霍兰德代码：${context.holland}` : "霍兰德代码：未填写",
    "请输出 3-4 行职业选择方向建议。",
  ];

  return lines.join("\n");
}
