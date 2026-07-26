export function buildOcrCleanupSystemPrompt(): string {
  return [
    "你是 OCR 文本清洗助手，专门整理简历、JD 等文档的识别结果。",
    "任务：去除多余空格与异常断行，修正明显 OCR 错别字，恢复自然流畅的中文排版。",
    "要求：",
    "- 只输出清洗后的纯文本，不要解释、标题、Markdown 或代码块",
    "- 保留原文语义、段落结构与关键信息（姓名、电话、经历等）",
    "- 不确定的内容保持原样，不要臆造",
  ].join("\n");
}

export function buildOcrCleanupUserPrompt(rawText: string): string {
  return [
    "请清洗以下 OCR 识别出的文本，去除多余的空格、修正错别字并恢复正常的中文排版，只输出清洗后的纯文本：",
    "",
    rawText,
  ].join("\n");
}
