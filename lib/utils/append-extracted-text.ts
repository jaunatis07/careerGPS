/**
 * 将新提取的文本追加到输入框现有内容末尾（换行分隔）。
 */
export function appendExtractedContent(
  existing: string,
  extracted: string,
): string {
  const trimmedExisting = existing.trimEnd();
  const trimmedExtracted = extracted.trim();

  if (!trimmedExtracted) {
    return existing;
  }

  if (!trimmedExisting) {
    return trimmedExtracted;
  }

  return `${trimmedExisting}\n\n${trimmedExtracted}`;
}
