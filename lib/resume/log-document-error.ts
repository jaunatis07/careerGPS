interface DocumentErrorMeta {
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  format?: string;
  stage?: string;
  [key: string]: unknown;
}

/**
 * 统一记录文档解析链路错误，便于 Vercel 日志排查。
 */
export function logDocumentError(
  stage: string,
  error: unknown,
  meta: DocumentErrorMeta = {},
) {
  console.error(`[CareerGPS][document] ${stage}`, {
    ...meta,
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error,
  });
}

export function toDocumentErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
