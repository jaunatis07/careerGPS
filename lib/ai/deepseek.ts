import { createDeepSeek } from "@ai-sdk/deepseek";

import {
  getDeepSeekApiKey,
  getDeepSeekBaseUrl,
  getDeepSeekChatModel,
} from "@/lib/ai/env";

/**
 * 创建 DeepSeek 模型 Provider 实例。
 */
export function createDeepSeekProvider() {
  return createDeepSeek({
    apiKey: getDeepSeekApiKey(),
    baseURL: getDeepSeekBaseUrl(),
  });
}

/**
 * 获取默认 DeepSeek 对话模型。
 */
export function getDefaultChatModel() {
  const deepseek = createDeepSeekProvider();
  return deepseek(getDeepSeekChatModel());
}
