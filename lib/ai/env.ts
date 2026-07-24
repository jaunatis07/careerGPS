/** DeepSeek API Key，仅服务端使用 */
export function getDeepSeekApiKey() {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey || apiKey.includes("your-deepseek-api-key")) {
    throw new Error(
      "缺少 DeepSeek 环境变量：请在 .env.local 中配置 DEEPSEEK_API_KEY",
    );
  }

  return apiKey;
}

/** 可选：硅基流动等 OpenAI 兼容代理 Base URL */
export function getDeepSeekBaseUrl() {
  return process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
}

/** 默认对话模型 */
export function getDeepSeekChatModel() {
  return process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
}
