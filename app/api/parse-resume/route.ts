import { parseUploadedResumeDocument } from "@/lib/resume/parse-uploaded-file";
import { detectAnalysisMode } from "@/lib/resume/detect-analysis-mode";
import {
  extractCompanyName,
  shouldRunCompanyCheck,
} from "@/lib/resume/company-utils";
import {
  formatApiErrorPayload,
  logDocumentError,
} from "@/lib/resume/log-document-error";
import { sanitizeResumeTextDetailed } from "@/lib/utils/sanitize";

export const runtime = "nodejs";
export const maxDuration = 60;

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
      let formData: FormData;

      try {
        formData = await request.formData();
      } catch (error) {
        logDocumentError("parse-resume formData parse failed", error);
        return Response.json(
          {
            error:
              "上传内容过大或格式无效，请压缩图片到 4MB 以内，或粘贴文本后重试",
          },
          { status: 413 },
        );
      }

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
    logDocumentError("parse-resume failed", error);

    return Response.json(formatApiErrorPayload(error, "解析失败，请稍后重试"), {
      status: 500,
    });
  }
}
