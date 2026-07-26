import mammoth from "mammoth";

import { logDocumentError } from "@/lib/resume/log-document-error";

/**
 * 从 .docx Buffer 提取纯文本。
 */
export async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  } catch (error) {
    logDocumentError("mammoth extractRawText failed", error, {
      bufferSize: buffer.length,
    });
    throw error;
  }
}
