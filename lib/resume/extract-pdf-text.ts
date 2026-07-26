import { PDFParse } from "pdf-parse";

/**
 * 从 PDF Buffer 提取纯文本。
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}
