import { DefaultChatTransport, type UIMessage } from "ai";

import type { AgentType } from "@/lib/ai/system-prompts";

function resolveFetchUrl(input: RequestInfo | URL) {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.href;
  }

  return input.url;
}

interface CreateChatTransportOptions {
  agentType: AgentType;
  getSessionId: () => string | null;
  onSessionId: (sessionId: string) => void;
  quotaAwareFetch: typeof fetch;
}

/**
 * 创建带请求日志的 /api/chat Transport。
 */
export function createChatTransport({
  agentType,
  getSessionId,
  onSessionId,
  quotaAwareFetch,
}: CreateChatTransportOptions) {
  return new DefaultChatTransport({
    api: "/api/chat",
    prepareSendMessagesRequest: ({ messages, id }) => ({
      body: {
        messages,
        id,
        sessionId: getSessionId(),
        agentType,
      },
    }),
    fetch: async (input, init) => {
      const url = resolveFetchUrl(input);

      console.info("[CareerGPS][Chat] fetch →", {
        url,
        method: init?.method ?? "GET",
        agentType,
        sessionId: getSessionId(),
      });

      try {
        const response = await quotaAwareFetch(input, init);

        console.info("[CareerGPS][Chat] fetch ←", {
          url,
          status: response.status,
          ok: response.ok,
        });

        const nextSessionId = response.headers.get("X-Chat-Session-Id");

        if (nextSessionId && nextSessionId !== getSessionId()) {
          onSessionId(nextSessionId);
        }

        return response;
      } catch (error) {
        console.error("[CareerGPS][Chat] fetch error", {
          url,
          agentType,
          error,
        });
        throw error;
      }
    },
  });
}

interface SubmitChatMessageOptions {
  text: string;
  agentType: AgentType;
  isGenerating: boolean;
  assertQuotaAvailable: () => boolean;
  sendMessage: (
    message: { text: string },
    options?: { body?: Record<string, unknown> },
  ) => Promise<void>;
  getSessionId: () => string | null;
  onBeforeSend?: () => void;
  onSendFailed?: (text: string) => void;
}

/**
 * 统一聊天发送逻辑：预检、日志、错误 Toast 与用户输入恢复。
 */
export async function submitChatMessage({
  text,
  agentType,
  isGenerating,
  assertQuotaAvailable,
  sendMessage,
  getSessionId,
  onBeforeSend,
  onSendFailed,
}: SubmitChatMessageOptions) {
  const trimmed = text.trim();

  if (!trimmed) {
    console.warn("[CareerGPS][Chat] send skipped: empty input", { agentType });
    return false;
  }

  if (isGenerating) {
    console.warn("[CareerGPS][Chat] send skipped: already generating", {
      agentType,
    });
    return false;
  }

  if (!assertQuotaAvailable()) {
    console.warn("[CareerGPS][Chat] send blocked: quota exhausted", {
      agentType,
    });
    return false;
  }

  onBeforeSend?.();

  console.info("[CareerGPS][Chat] sendMessage", {
    api: "/api/chat",
    agentType,
    sessionId: getSessionId(),
    length: trimmed.length,
  });

  try {
    await sendMessage(
      { text: trimmed },
      {
        body: {
          sessionId: getSessionId(),
          agentType,
        },
      },
    );
    return true;
  } catch (error) {
    console.error("[CareerGPS][Chat] sendMessage failed", {
      agentType,
      error,
    });
    onSendFailed?.(trimmed);
    throw error;
  }
}

export type { UIMessage };
