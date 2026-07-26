import {
  assertQuotaAvailable,
  consumeUserQuota,
} from "@/lib/quota/consume-user-quota";
import { QuotaExceededError } from "@/lib/quota/quota-errors";
import {
  formatDeepSeekClientError,
  logDeepSeekError,
} from "@/lib/ai/deepseek-log";
import {
  generateDeepSeekText,
  streamDeepSeekText,
  type DeepSeekMessage,
} from "@/lib/ai/deepseek-request";
import { getDeepSeekChatModel } from "@/lib/ai/env";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

interface AIRequestBody {
  /** 是否流式返回，默认 false */
  stream?: boolean;
  /** 系统提示词 */
  system?: string;
  /** 单轮用户 Prompt（与 messages 二选一） */
  prompt?: string;
  /** OpenAI 兼容 messages 数组 */
  messages?: DeepSeekMessage[];
  /** 可选模型名（默认 deepseek-v4-flash） */
  model?: string;
}

function hasValidInput(body: AIRequestBody) {
  if (body.prompt?.trim()) {
    return true;
  }

  return Array.isArray(body.messages) && body.messages.length > 0;
}

/**
 * POST /api/ai
 * 统一 DeepSeek 调用网关（OpenAI Chat Completions 风格），支持流式 / 非流式。
 *
 * 请求示例（非流式）：
 * { "stream": false, "system": "...", "prompt": "..." }
 *
 * 请求示例（流式）：
 * { "stream": true, "messages": [{ "role": "user", "content": "..." }] }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "请先登录后再使用 AI 能力" }, { status: 401 });
    }

    const body = (await request.json()) as AIRequestBody;

    if (!hasValidInput(body)) {
      return Response.json(
        { error: "请提供 prompt 或 messages 参数" },
        { status: 400 },
      );
    }

    await assertQuotaAvailable(user.id);

    const runOptions = {
      system: body.system,
      prompt: body.prompt,
      messages: body.messages,
      abortSignal: request.signal,
    };

    if (body.stream) {
      const result = streamDeepSeekText({
        ...runOptions,
        onFinish: async () => {
          try {
            await consumeUserQuota(user.id);
          } catch (quotaError) {
            console.error("[CareerGPS] AI stream quota error:", quotaError);
          }
        },
      });

      return result.toTextStreamResponse({
        headers: {
          "X-AI-Model": body.model ?? getDeepSeekChatModel(),
        },
      });
    }

    const content = await generateDeepSeekText(runOptions);
    await consumeUserQuota(user.id);

    return Response.json({
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      model: body.model ?? getDeepSeekChatModel(),
      choices: [
        {
          index: 0,
          message: { role: "assistant", content },
          finish_reason: "stop",
        },
      ],
    });
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return Response.json({ error: error.message }, { status: 429 });
    }

    logDeepSeekError("POST /api/ai failed", error);

    return Response.json(
      { error: formatDeepSeekClientError(error) },
      { status: 500 },
    );
  }
}
