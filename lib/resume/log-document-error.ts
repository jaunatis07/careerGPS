interface DocumentErrorMeta {
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  format?: string;
  stage?: string;
  [key: string]: unknown;
}

export interface ApiErrorPayload {
  error: string;
  stack?: string;
  name?: string;
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

/**
 * 构造返回给前端的 API 错误 JSON，包含 stack 便于定位解析库报错行。
 */
export function formatApiErrorPayload(
  error: unknown,
  fallback: string,
): ApiErrorPayload {
  if (error instanceof Error) {
    return {
      error: error.message.trim() || fallback,
      stack: error.stack,
      name: error.name,
    };
  }

  return {
    error: fallback,
  };
}
