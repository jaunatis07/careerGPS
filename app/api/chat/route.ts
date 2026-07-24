import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";

import { getUserChatContext } from "@/lib/ai/get-user-chat-context";
import { getDefaultChatModel } from "@/lib/ai/deepseek";
import {
  buildSystemPrompt,
  type AgentType,
} from "@/lib/ai/system-prompts";
import {
  getTextFromUIMessage,
  loadChatMessages,
  resolveChatSession,
  saveChatMessage,
} from "@/lib/chat/session-manager";
import {
  assertQuotaAvailable,
  consumeUserQuota,
} from "@/lib/quota/consume-user-quota";
import { QuotaExceededError } from "@/lib/quota/quota-errors";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

interface ChatRequestBody {
  messages?: UIMessage[];
  sessionId?: string;
  agentType?: AgentType;
}

function isValidAgentType(value: unknown): value is AgentType {
  return value === "planner" || value === "resume";
}

/**
 * POST /api/chat
 * 统一 AI 聊天接口：DeepSeek 流式响应 + 会话上下文持久化 + 额度扣减。
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "请先登录后再使用 AI 对话" }, { status: 401 });
    }

    const body = (await request.json()) as ChatRequestBody;

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json({ error: "消息列表不能为空" }, { status: 400 });
    }

    if (!isValidAgentType(body.agentType)) {
      return Response.json({ error: "无效的 agentType 参数" }, { status: 400 });
    }

    await assertQuotaAvailable(user.id);

    const session = await resolveChatSession(
      user.id,
      body.sessionId,
      body.agentType,
    );

    const lastUserMessage = [...body.messages]
      .reverse()
      .find((message) => message.role === "user");

    const userText = lastUserMessage
      ? getTextFromUIMessage(lastUserMessage)
      : "";

    if (userText) {
      const storedMessages = await loadChatMessages(session.id);
      const lastStored = storedMessages.at(-1);
      const isDuplicate =
        lastStored?.role === "user" && lastStored.content === userText;

      if (!isDuplicate) {
        await saveChatMessage(session.id, "user", userText);
      }
    }

    const userContext = await getUserChatContext(user.id);
    const system = buildSystemPrompt(body.agentType, userContext);

    const result = streamText({
      model: getDefaultChatModel(),
      system,
      messages: await convertToModelMessages(body.messages),
      abortSignal: request.signal,
      onFinish: async ({ text }) => {
        try {
          await saveChatMessage(session.id, "assistant", text);
          await consumeUserQuota(user.id);
        } catch (persistError) {
          console.error("[CareerGPS] Chat persistence error:", persistError);
        }
      },
    });

    return result.toUIMessageStreamResponse({
      headers: {
        "X-Chat-Session-Id": session.id,
      },
    });
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return Response.json({ error: error.message }, { status: 429 });
    }

    console.error("[CareerGPS] Chat API error:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "AI 对话请求失败，请稍后重试",
      },
      { status: 500 },
    );
  }
}
