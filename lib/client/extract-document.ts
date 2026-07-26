import { prepareUploadFile } from "@/lib/client/prepare-upload-file";
import { parseApiErrorDetails } from "@/lib/client/parse-api-error";
import { showUploadError } from "@/lib/client/show-upload-error";
import type { ResumeDocumentFormat } from "@/lib/resume/document-types";
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

/**
 * 上传单个文件到服务端解析为文本。
 */
export async function extractDocumentFromFile(
  file: File,
): Promise<ExtractDocumentResult> {
  try {
    const preparedFile = await prepareUploadFile(file);
    const formData = new FormData();
    formData.append("file", preparedFile);

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
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("上传失败:")) {
      throw error;
    }

    const message = showUploadError(error);
    throw new Error(message);
  }
}
