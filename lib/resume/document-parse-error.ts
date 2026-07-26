const PASTE_TEXT_HINT = "请直接复制粘贴文本到输入框后继续分析";

/**
 * 文档解析预期失败：API 应返回 422 JSON，而非 500 HTML。
 */
export class DocumentParseError extends Error {
  readonly fallbackHint: string;

  constructor(message: string, fallbackHint = PASTE_TEXT_HINT) {
    super(message);
    this.name = "DocumentParseError";
    this.fallbackHint = fallbackHint;
  }

  toApiMessage() {
    return `${this.message}。${this.fallbackHint}`;
  }
}

export function isDocumentParseError(
  error: unknown,
): error is DocumentParseError {
  return error instanceof DocumentParseError;
}

export function toDocumentParseError(
  error: unknown,
  fallback: string,
): DocumentParseError {
  if (error instanceof DocumentParseError) {
    return error;
  }

  if (error instanceof Error && error.message.trim()) {
    return new DocumentParseError(error.message.trim());
  }

  return new DocumentParseError(fallback);
}
