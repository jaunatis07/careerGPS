import { logDocumentError } from "@/lib/resume/log-document-error";
import { toDocumentParseError } from "@/lib/resume/document-parse-error";

/**
 * 从 .docx Buffer 提取纯文本。
 */
export async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  } catch (error) {
    logDocumentError("mammoth extractRawText failed", error, {
      bufferSize: buffer.length,
    });
    throw toDocumentParseError(error, "Word 文档解析失败");
  }
}
