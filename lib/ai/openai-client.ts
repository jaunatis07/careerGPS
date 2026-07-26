import OpenAI from "openai";

import { getOpenAIApiKey } from "@/lib/ai/openai-env";

let client: OpenAI | null = null;

/** 复用单例 OpenAI 客户端（服务端） */
export function getOpenAIClient() {
  if (!client) {
    client = new OpenAI({
      apiKey: getOpenAIApiKey(),
    });
  }

  return client;
}
