const DEFAULT_OPENAI_VISION_MODEL = "gpt-4o-mini";

/** OpenAI API Key，仅服务端使用（图片 OCR 等） */
export function getOpenAIApiKey() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey || apiKey.includes("your-openai-api-key")) {
    throw new Error(
      "缺少 OpenAI 环境变量：请在 .env.local 或 Vercel 中配置 OPENAI_API_KEY",
    );
  }

  return apiKey;
}

/** 图片 OCR 使用的 OpenAI 视觉模型 */
export function getOpenAIVisionModel() {
  return process.env.OPENAI_VISION_MODEL?.trim() || DEFAULT_OPENAI_VISION_MODEL;
}
