import { parseUploadedResumeDocument } from "@/lib/resume/parse-uploaded-file";
import { detectAnalysisMode } from "@/lib/resume/detect-analysis-mode";
import {
  extractCompanyName,
  shouldRunCompanyCheck,
} from "@/lib/resume/company-utils";
import { sanitizeResumeTextDetailed } from "@/lib/utils/sanitize";

interface ParseResumeBody {
  jdText?: string;
  resumeText?: string;
}

/**
 * POST /api/parse-resume
 * 解析并脱敏 JD / 简历文本，返回动态路由模式。
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    let jdText = "";
    let resumeText = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      jdText = (formData.get("jdText") as string | null)?.toString() ?? "";
      resumeText =
        (formData.get("resumeText") as string | null)?.toString() ?? "";

      const jdFile = formData.get("jdFile");
      const resumeFile = formData.get("resumeFile");

      if (jdFile instanceof File && jdFile.size > 0) {
        jdText = (await parseUploadedResumeDocument(jdFile)).text;
      }

      if (resumeFile instanceof File && resumeFile.size > 0) {
        resumeText = (await parseUploadedResumeDocument(resumeFile)).text;
      }
    } else {
      const body = (await request.json()) as ParseResumeBody;
      jdText = body.jdText ?? "";
      resumeText = body.resumeText ?? "";
    }

    const mode = detectAnalysisMode(jdText, resumeText);

    if (!mode) {
      return Response.json(
        { error: "请至少提供 JD 或简历其中一项内容" },
        { status: 400 },
      );
    }

    const sanitizedJd = jdText ? sanitizeResumeTextDetailed(jdText) : null;
    const sanitizedResume = resumeText
      ? sanitizeResumeTextDetailed(resumeText)
      : null;

    const companyName = jdText ? extractCompanyName(jdText) : null;

    return Response.json({
      mode,
      sanitizedJd: sanitizedJd?.text ?? "",
      sanitizedResume: sanitizedResume?.text ?? "",
      hasSensitiveData:
        Boolean(sanitizedJd?.hasSensitiveData) ||
        Boolean(sanitizedResume?.hasSensitiveData),
      companyName,
      needsCompanyCheck: shouldRunCompanyCheck(companyName),
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "解析失败，请稍后重试",
      },
      { status: 500 },
    );
  }
}
