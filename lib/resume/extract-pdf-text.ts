import { toDocumentParseError } from "@/lib/resume/document-parse-error";
import { logDocumentError } from "@/lib/resume/log-document-error";

/**
 * 从 PDF Buffer 提取纯文本（unpdf，适配 Vercel Serverless）。
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const result = await extractText(pdf, { mergePages: true });
    return result.text.trim();
  } catch (error) {
    logDocumentError("unpdf extract failed", error, {
      bufferSize: buffer.length,
    });

    throw toDocumentParseError(
      error,
      "PDF 解析失败，可能是扫描件或文件已损坏",
    );
  }
}
