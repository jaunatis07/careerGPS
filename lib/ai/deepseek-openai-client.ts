import OpenAI from "openai";

import { getDeepSeekApiKey, getDeepSeekBaseUrl } from "@/lib/ai/env";

let client: OpenAI | null = null;

/**
 * DeepSeek OpenAI 兼容客户端（用于多模态 OCR 等 chat/completions 调用）。
 */
export function getDeepSeekOpenAIClient() {
  if (!client) {
    client = new OpenAI({
      apiKey: getDeepSeekApiKey(),
      baseURL: getDeepSeekBaseUrl(),
    });
  }

  return client;
}
