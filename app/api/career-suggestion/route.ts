import { generateText } from "ai";

import { getDefaultChatModel } from "@/lib/ai/deepseek";
import {
  buildCareerSuggestionSystemPrompt,
  buildCareerSuggestionUserPrompt,
} from "@/lib/ai/prompts/career-suggestion-prompt";
import {
  assertQuotaAvailable,
  consumeUserQuota,
} from "@/lib/quota/consume-user-quota";
import { QuotaExceededError } from "@/lib/quota/quota-errors";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

interface CareerSuggestionBody {
  mbti?: string | null;
  holland?: string | null;
  tags?: string[];
}

/**
 * POST /api/career-suggestion
 * 根据测评标签生成简短职业选择方向建议。
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "请先登录后再获取建议" }, { status: 401 });
    }

    const body = (await request.json()) as CareerSuggestionBody;
    const tags = Array.isArray(body.tags) ? body.tags.filter(Boolean) : [];

    if (tags.length === 0) {
      return Response.json(
        { error: "请先完成测评并生成标签" },
        { status: 400 },
      );
    }

    await assertQuotaAvailable(user.id);

    const context = {
      mbti: body.mbti?.trim() || null,
      holland: body.holland?.trim() || null,
      tags,
    };

    const { text } = await generateText({
      model: getDefaultChatModel(),
      system: buildCareerSuggestionSystemPrompt(),
      prompt: buildCareerSuggestionUserPrompt(context),
    });

    await consumeUserQuota(user.id);

    return Response.json({ suggestion: text.trim() });
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return Response.json({ error: error.message }, { status: 429 });
    }

    console.error("[CareerGPS] Career suggestion API error:", error);

    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "职业建议生成失败，请稍后重试",
      },
      { status: 500 },
    );
  }
}
