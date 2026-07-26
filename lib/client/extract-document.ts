import { prepareUploadFile } from "@/lib/client/prepare-upload-file";
import { fetchJsonWithToast } from "@/lib/client/quota-fetch";
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
  let preparedFile: File;

  try {
    preparedFile = await prepareUploadFile(file);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "文件无法上传，请稍后重试";
    toast.error(message);
    throw new Error(message);
  }

  const formData = new FormData();
  formData.append("file", preparedFile);

  return fetchJsonWithToast<ExtractDocumentResult>("/api/extract-document", {
    method: "POST",
    body: formData,
  });
}
