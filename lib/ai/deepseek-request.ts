import { generateText, streamText, type ModelMessage } from "ai";

import { getDefaultChatModel } from "@/lib/ai/deepseek";
import {
  formatDeepSeekClientError,
  logDeepSeekError,
  logDeepSeekRequestMeta,
} from "@/lib/ai/deepseek-log";
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

function normalizeMessages(
  options: DeepSeekRunOptions,
): ModelMessage[] | undefined {
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
  logDeepSeekRequestMeta("generate");

  const messages = normalizeMessages(options);
  const model = getDefaultChatModel();

  try {
    const { text } = messages
      ? await generateText({
          model,
          system: options.system,
          messages,
          abortSignal: options.abortSignal,
        })
      : await generateText({
          model,
          system: options.system,
          prompt: options.prompt ?? "",
          abortSignal: options.abortSignal,
        });

    return text.trim();
  } catch (error) {
    logDeepSeekError("generateDeepSeekText failed", error);
    throw new Error(formatDeepSeekClientError(error), { cause: error });
  }
}

/**
 * 流式调用 DeepSeek，返回 AI SDK StreamTextResult。
 */
export function streamDeepSeekText(options: DeepSeekRunOptions) {
  assertDeepSeekConfigured();
  logDeepSeekRequestMeta("stream");

  const messages = normalizeMessages(options);
  const model = getDefaultChatModel();

  const shared = {
    model,
    system: options.system,
    abortSignal: options.abortSignal,
    onError: ({ error }: { error: unknown }) => {
      logDeepSeekError("streamDeepSeekText onError", error);
    },
    onFinish: async ({ text }: { text: string }) => {
      try {
        await options.onFinish?.(text);
      } catch (finishError) {
        logDeepSeekError("streamDeepSeekText onFinish callback failed", finishError);
      }
    },
  };

  try {
    return messages
      ? streamText({ ...shared, messages })
      : streamText({ ...shared, prompt: options.prompt ?? "" });
  } catch (error) {
    logDeepSeekError("streamDeepSeekText init failed", error);
    throw new Error(formatDeepSeekClientError(error), { cause: error });
  }
}
