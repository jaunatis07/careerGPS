const OFFICIAL_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
/** deepseek-chat 已于 2026-07-24 弃用，官方后继模型为 deepseek-v4-flash */
const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";

/** DeepSeek API Key，仅服务端使用 */
export function getDeepSeekApiKey() {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();

  if (!apiKey || apiKey.includes("your-deepseek-api-key")) {
    throw new Error(
      "缺少 DeepSeek 环境变量：请在 .env.local 或 Vercel 中配置 DEEPSEEK_API_KEY",
    );
  }

  return apiKey;
}

/**
 * DeepSeek OpenAI 兼容 Base URL。
 *
 * 官方文档：https://api.deepseek.com
 * @ai-sdk/deepseek 会在其后拼接 `/chat/completions`，最终请求：
 *   https://api.deepseek.com/chat/completions
 *
 * 若使用带 `/v1` 的地址（如 https://api.deepseek.com/v1）也可兼容，
 * 最终为 https://api.deepseek.com/v1/chat/completions
 */
export function getDeepSeekBaseUrl() {
  const raw = process.env.DEEPSEEK_BASE_URL?.trim();
  const baseURL = (raw || OFFICIAL_DEEPSEEK_BASE_URL).replace(/\/+$/, "");

  return baseURL;
}

/** 实际 Chat Completions 完整 URL（用于日志与排查） */
export function getDeepSeekChatCompletionsUrl() {
  return `${getDeepSeekBaseUrl()}/chat/completions`;
}

/** 默认对话模型（官方推荐：deepseek-v4-flash；旧版 deepseek-chat 已弃用） */
export function getDeepSeekChatModel() {
  const model = process.env.DEEPSEEK_MODEL?.trim();
  return model || DEFAULT_DEEPSEEK_MODEL;
}
