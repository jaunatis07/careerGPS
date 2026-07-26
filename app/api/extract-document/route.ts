import {
  assertQuotaAvailable,
  consumeUserQuota,
} from "@/lib/quota/consume-user-quota";
import { QuotaExceededError } from "@/lib/quota/quota-errors";
import {
  documentNeedsQuota,
  parseUploadedResumeDocument,
} from "@/lib/resume/parse-uploaded-file";
import { getResumeFormatLabel } from "@/lib/resume/detect-document-format";
import { sanitizeResumeTextDetailed } from "@/lib/utils/sanitize";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

/**
 * POST /api/extract-document
 * 解析上传的 JD / 简历文件（PDF、Word、文本、图片 OCR）。
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "请先登录后再上传文件" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "请上传有效文件" }, { status: 400 });
    }

    const parsed = await parseUploadedResumeDocument(file);

    if (documentNeedsQuota(parsed)) {
      await assertQuotaAvailable(user.id);
    }

    const sanitized = sanitizeResumeTextDetailed(parsed.text);

    if (documentNeedsQuota(parsed)) {
      await consumeUserQuota(user.id);
    }

    return Response.json({
      text: sanitized.text,
      fileName: parsed.fileName,
      format: parsed.format,
      formatLabel: getResumeFormatLabel(parsed.format),
      extractionMethod: parsed.extractionMethod,
      charCount: sanitized.text.length,
      hasSensitiveData: sanitized.hasSensitiveData,
      message: `已从 ${getResumeFormatLabel(parsed.format)}「${parsed.fileName}」提取 ${sanitized.text.length} 字`,
    });
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return Response.json({ error: error.message }, { status: 429 });
    }

    console.error("[CareerGPS] extract-document error:", error);

    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "文件解析失败，请稍后重试",
      },
      { status: 500 },
    );
  }
}
