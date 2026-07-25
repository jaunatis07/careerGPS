import { generateText, streamText, type ModelMessage } from "ai";

import { getDefaultChatModel } from "@/lib/ai/deepseek";
import { getDeepSeekApiKey } from "@/lib/ai/env";

export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DeepSeekRunOptions {
  system?: string;
  prompt?: string;
  messages?: ModelMessage[];
  abortSignal?: AbortSignal;
  onFinish?: (text: string) => Promise<void> | void;
}

function normalizeMessages(options: DeepSeekRunOptions): ModelMessage[] | undefined {
  if (options.messages && options.messages.length > 0) {
    return options.messages;
  }

  return undefined;
}

/**
 * 校验 DeepSeek 环境变量是否已配置（尽早失败）。
 */
export function assertDeepSeekConfigured() {
  getDeepSeekApiKey();
}

/**
 * 非流式调用 DeepSeek，返回完整文本。
 */
export async function generateDeepSeekText(options: DeepSeekRunOptions) {
  assertDeepSeekConfigured();

  const messages = normalizeMessages(options);
  const model = getDefaultChatModel();

  const { text } = messages
    ? await generateText({
        model,
        system: options.system,
        messages,
      })
    : await generateText({
        model,
        system: options.system,
        prompt: options.prompt ?? "",
      });

  return text.trim();
}

/**
 * 流式调用 DeepSeek，返回 AI SDK StreamTextResult。
 */
export function streamDeepSeekText(options: DeepSeekRunOptions) {
  assertDeepSeekConfigured();

  const messages = normalizeMessages(options);
  const model = getDefaultChatModel();

  const shared = {
    model,
    system: options.system,
    abortSignal: options.abortSignal,
    onFinish: async ({ text }: { text: string }) => {
      await options.onFinish?.(text);
    },
  };

  return messages
    ? streamText({ ...shared, messages })
    : streamText({ ...shared, prompt: options.prompt ?? "" });
}
