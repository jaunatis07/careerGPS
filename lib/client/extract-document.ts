import { extractImageTextOnClient } from "@/lib/client/extract-image-text";
import { prepareUploadFile } from "@/lib/client/prepare-upload-file";
import { parseApiErrorDetails } from "@/lib/client/parse-api-error";
import { showUploadError } from "@/lib/client/show-upload-error";
import {
  detectResumeDocumentFormat,
  getResumeFormatLabel,
} from "@/lib/resume/detect-document-format";
import type { ResumeDocumentFormat } from "@/lib/resume/document-types";
import { compactOcrText } from "@/lib/utils/compact-ocr-text";
import { sanitizeResumeTextDetailed } from "@/lib/utils/sanitize";
import { toast } from "sonner";

export interface ExtractDocumentResult {
  text: string;
  fileName: string;
  format: ResumeDocumentFormat;
  formatLabel: string;
  extractionMethod: "text" | "pdf" | "docx" | "vision" | "ocr";
  charCount: number;
  hasSensitiveData: boolean;
  message: string;
}

function buildExtractResult(
  fileName: string,
  format: ResumeDocumentFormat,
  extractionMethod: ExtractDocumentResult["extractionMethod"],
  sanitized: ReturnType<typeof sanitizeResumeTextDetailed>,
): ExtractDocumentResult {
  const formatLabel = getResumeFormatLabel(format);

  return {
    text: sanitized.text,
    fileName,
    format,
    formatLabel,
    extractionMethod,
    charCount: sanitized.text.length,
    hasSensitiveData: sanitized.hasSensitiveData,
    message: `已从 ${formatLabel}「${fileName}」提取 ${sanitized.text.length} 字`,
  };
}

async function extractImageDocumentOnClient(file: File): Promise<ExtractDocumentResult> {
  const preparedFile = await prepareUploadFile(file);
  const progressToastId = toast.loading("正在识别图片文字…");

  try {
    const rawText = await extractImageTextOnClient(preparedFile, (update) => {
      toast.loading(`正在识别图片文字… ${Math.round(update.progress * 100)}%`, {
        id: progressToastId,
      });
    });

    const compactedText = compactOcrText(rawText);
    const sanitized = sanitizeResumeTextDetailed(compactedText);
    toast.dismiss(progressToastId);

    return {
      ...buildExtractResult(
        preparedFile.name,
        "image",
        "ocr",
        sanitized,
      ),
      message: `已从图片「${preparedFile.name}」识别 ${sanitized.text.length} 字`,
    };
  } catch (error) {
    toast.dismiss(progressToastId);
    throw error;
  }
}

async function extractDocumentOnServer(file: File): Promise<ExtractDocumentResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/extract-document", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const details = await parseApiErrorDetails(response);

    if (details.stack) {
      console.error("[CareerGPS][extract-document] stack", {
        status: details.status,
        stack: details.stack,
      });
    }

    const message = `上传失败: ${details.message}`;
    toast.error(message);
    throw new Error(message);
  }

  return (await response.json()) as ExtractDocumentResult;
}

/**
 * 解析上传文件为文本：图片在浏览器本地 OCR，其余格式走服务端解析。
 */
export async function extractDocumentFromFile(
  file: File,
): Promise<ExtractDocumentResult> {
  try {
    const format = detectResumeDocumentFormat(file);

    if (format === "image") {
      return await extractImageDocumentOnClient(file);
    }

    const preparedFile = await prepareUploadFile(file);
    return await extractDocumentOnServer(preparedFile);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("上传失败:")) {
      throw error;
    }

    const message = showUploadError(error);
    throw new Error(message);
  }
}
