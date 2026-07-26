import { jsonApiError } from "@/lib/api/json-api-error";
import {
  assertQuotaAvailable,
  consumeUserQuota,
} from "@/lib/quota/consume-user-quota";
import { QuotaExceededError } from "@/lib/quota/quota-errors";
import { isDocumentParseError } from "@/lib/resume/document-parse-error";
import { getResumeFormatLabel } from "@/lib/resume/detect-document-format";
import { logDocumentError } from "@/lib/resume/log-document-error";
import { sanitizeResumeTextDetailed } from "@/lib/utils/sanitize";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

async function handleExtractDocument(request: Request) {
  let fileName = "unknown";
  let fileSize = 0;
  let mimeType = "unknown";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonApiError(new Error("请先登录后再上传文件"), "请先登录后再上传文件", 401);
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch (error) {
    logDocumentError("extract-document formData parse failed", error);
    return jsonApiError(
      new Error("上传内容过大或格式无效，请压缩图片到 4MB 以内，或粘贴文本后重试"),
      "上传内容过大或格式无效，请压缩图片到 4MB 以内，或粘贴文本后重试",
      413,
    );
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonApiError(new Error("请上传有效文件"), "请上传有效文件", 400);
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

  const { parseUploadedResumeDocument, documentNeedsQuota } = await import(
    "@/lib/resume/parse-uploaded-file"
  );

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
}

/**
 * POST /api/extract-document
 * 解析上传的 JD / 简历文件（PDF、Word、文本、图片 OCR）。
 */
export async function POST(request: Request) {
  try {
    return await handleExtractDocument(request);
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return jsonApiError(error, error.message, 429);
    }

    if (isDocumentParseError(error)) {
      logDocumentError("extract-document parse failed", error, {
        stage: "document-parse",
      });
      return jsonApiError(error, error.toApiMessage(), 422);
    }

    logDocumentError("extract-document failed", error);

    return jsonApiError(
      error,
      "文件解析失败，请直接粘贴文本到输入框后继续分析",
      422,
    );
  }
}
