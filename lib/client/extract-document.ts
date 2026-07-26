import { fetchJsonWithToast } from "@/lib/client/quota-fetch";
import type { ResumeDocumentFormat } from "@/lib/resume/document-types";

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
  const formData = new FormData();
  formData.append("file", file);

  return fetchJsonWithToast<ExtractDocumentResult>("/api/extract-document", {
    method: "POST",
    body: formData,
  });
}
