import { streamText } from "ai";

import {
  buildResumeAnalysisSystemPrompt,
  buildResumeAnalysisUserPrompt,
} from "@/lib/ai/prompts/resume-system-prompt";
import { getDefaultChatModel } from "@/lib/ai/deepseek";
import { checkCompanyRisk } from "@/lib/resume/company-check";
import {
  extractCompanyName,
  shouldRunCompanyCheck,
} from "@/lib/resume/company-utils";
import { detectAnalysisMode } from "@/lib/resume/detect-analysis-mode";
import {
  assertQuotaAvailable,
  consumeUserQuota,
} from "@/lib/quota/consume-user-quota";
import { QuotaExceededError } from "@/lib/quota/quota-errors";
import { sanitizeResumeTextDetailed } from "@/lib/utils/sanitize";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

interface ResumeAgentBody {
  jdText?: string;
  resumeText?: string;
}

/**
 * POST /api/resume-agent
 * 简历排雷 Agent：脱敏 → 动态路由 → 企业排雷 → 流式分析报告。
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "请先登录后再使用简历排雷" }, { status: 401 });
    }

    const body = (await request.json()) as ResumeAgentBody;
    const rawJd = body.jdText?.trim() ?? "";
    const rawResume = body.resumeText?.trim() ?? "";

    const mode = detectAnalysisMode(rawJd, rawResume);

    if (!mode) {
      return Response.json(
        { error: "请至少提供 JD 或简历其中一项内容" },
        { status: 400 },
      );
    }

    await assertQuotaAvailable(user.id);

    const sanitizedJd = rawJd ? sanitizeResumeTextDetailed(rawJd) : null;
    const sanitizedResume = rawResume
      ? sanitizeResumeTextDetailed(rawResume)
      : null;

    const jdForAnalysis = sanitizedJd?.text ?? "";
    const resumeForAnalysis = sanitizedResume?.text ?? "";

    const companyName = jdForAnalysis
      ? extractCompanyName(jdForAnalysis)
      : null;

    const companyRisk =
      companyName && shouldRunCompanyCheck(companyName)
        ? await checkCompanyRisk(companyName)
        : null;

    const context = {
      mode,
      jdText: jdForAnalysis || undefined,
      resumeText: resumeForAnalysis || undefined,
      companyRisk,
    };

    const result = streamText({
      model: getDefaultChatModel(),
      system: buildResumeAnalysisSystemPrompt(context),
      prompt: buildResumeAnalysisUserPrompt(context),
      abortSignal: request.signal,
      onFinish: async () => {
        try {
          await consumeUserQuota(user.id);
        } catch (quotaError) {
          console.error("[CareerGPS] Resume agent quota error:", quotaError);
        }
      },
    });

    return result.toTextStreamResponse({
      headers: {
        "X-Analysis-Mode": mode,
        ...(companyName ? { "X-Company-Name": encodeURIComponent(companyName) } : {}),
      },
    });
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return Response.json({ error: error.message }, { status: 429 });
    }

    console.error("[CareerGPS] Resume agent API error:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "简历分析请求失败，请稍后重试",
      },
      { status: 500 },
    );
  }
}
