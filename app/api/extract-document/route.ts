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
import {
  logDocumentError,
  toDocumentErrorMessage,
} from "@/lib/resume/log-document-error";
import { sanitizeResumeTextDetailed } from "@/lib/utils/sanitize";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/extract-document
 * 解析上传的 JD / 简历文件（PDF、Word、文本、图片 OCR）。
 */
export async function POST(request: Request) {
  let fileName = "unknown";
  let fileSize = 0;
  let mimeType = "unknown";

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "请先登录后再上传文件" }, { status: 401 });
    }

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch (error) {
      logDocumentError("extract-document formData parse failed", error);
      return Response.json(
        {
          error:
            "上传内容过大或格式无效，请压缩图片到 4MB 以内，或粘贴文本后重试",
        },
        { status: 413 },
      );
    }

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "请上传有效文件" }, { status: 400 });
    }

    fileName = file.name;
    fileSize = file.size;
    mimeType = file.type;

    console.info("[CareerGPS][extract-document] received file", {
      fileName,
      fileSize,
      mimeType,
      userId: user.id,
    });

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

    logDocumentError("extract-document failed", error, {
      fileName,
      fileSize,
      mimeType,
    });

    return Response.json(
      {
        error: toDocumentErrorMessage(error, "文件解析失败，请稍后重试"),
      },
      { status: 500 },
    );
  }
}
