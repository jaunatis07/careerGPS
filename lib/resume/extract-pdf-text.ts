import { PDFParse } from "pdf-parse";

import { logDocumentError } from "@/lib/resume/log-document-error";

/**
 * 从 PDF Buffer 提取纯文本。
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text.trim();
  } catch (error) {
    logDocumentError("pdf-parse getText failed", error, {
      bufferSize: buffer.length,
    });
    throw error;
  } finally {
    try {
      await parser.destroy();
    } catch (destroyError) {
      logDocumentError("pdf-parse destroy failed", destroyError);
    }
  }
}
