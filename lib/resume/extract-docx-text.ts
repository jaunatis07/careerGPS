import mammoth from "mammoth";

/**
 * 从 .docx Buffer 提取纯文本。
 */
export async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}
