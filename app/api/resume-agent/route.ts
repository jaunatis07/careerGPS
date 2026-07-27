import {
  buildResumeAnalysisSystemPrompt,
  buildResumeAnalysisUserPrompt,
} from "@/lib/ai/prompts/resume-system-prompt";
import {
  formatDeepSeekClientError,
  logDeepSeekError,
} from "@/lib/ai/deepseek-log";
import {
  assertDeepSeekConfigured,
  streamDeepSeekText,
} from "@/lib/ai/deepseek-request";
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

export const runtime = "nodejs";
export const maxDuration = 60;

/** Vercel Serverless 请求体上限（与客户端 MAX_RESUME_ANALYSIS_BODY_BYTES 对齐） */
const MAX_REQUEST_BODY_BYTES = 4 * 1024 * 1024 - 256 * 1024;

interface ResumeAgentBody {
  jdText?: string;
  resumeText?: string;
}

/**
 * POST /api/resume-agent
 * 简历排雷 Agent：脱敏 → 动态路由 → 企业排雷 → DeepSeek 流式结构化报告。
 */
export async function POST(request: Request) {
  try {
    assertDeepSeekConfigured();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "请先登录后再使用简历排雷" }, { status: 401 });
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > MAX_REQUEST_BODY_BYTES) {
      return Response.json(
        {
          error: `请求体过大（${Math.round(contentLength / 1024)}KB），请删减 JD/简历内容后重试`,
        },
        { status: 413 },
      );
    }

    let body: ResumeAgentBody;

    try {
      body = (await request.json()) as ResumeAgentBody;
    } catch (parseError) {
      logDeepSeekError("POST /api/resume-agent invalid JSON", parseError);
      return Response.json(
        {
          error:
            contentLength > MAX_REQUEST_BODY_BYTES
              ? "请求体过大，请删减内容后重试"
              : "请求体格式无效",
        },
        { status: contentLength > MAX_REQUEST_BODY_BYTES ? 413 : 400 },
      );
    }

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

    const result = streamDeepSeekText({
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
        ...(companyName
          ? { "X-Company-Name": encodeURIComponent(companyName) }
          : {}),
      },
    });
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return Response.json({ error: error.message }, { status: 429 });
    }

    logDeepSeekError("POST /api/resume-agent failed", error);

    return Response.json(
      { error: formatDeepSeekClientError(error) },
      { status: 500 },
    );
  }
}
