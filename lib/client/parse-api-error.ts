import {
  GENERIC_API_ERROR_MESSAGE,
  QUOTA_EXHAUSTED_MESSAGE,
} from "@/lib/constants/quota-messages";

export interface ApiErrorDetails {
  message: string;
  stack?: string;
  status: number;
}

export function isQuotaExceededStatus(status: number) {
  return status === 429;
}

function readErrorField(payload: Record<string, unknown>): string | undefined {
  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }

  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }

  return undefined;
}

/**
 * 从 JSON API 响应中解析错误详情（含 stack）。
 */
export async function parseApiErrorDetails(
  response: Response,
  fallback = GENERIC_API_ERROR_MESSAGE,
): Promise<ApiErrorDetails> {
  const status = response.status;

  if (isQuotaExceededStatus(status)) {
    return { message: QUOTA_EXHAUSTED_MESSAGE, status };
  }

  if (status === 413) {
    return {
      message: "上传文件过大，请压缩图片到 4MB 以内或粘贴文本后重试",
      status,
    };
  }

  let rawBody = "";

  try {
    rawBody = await response.text();
  } catch {
    rawBody = "";
  }

  if (rawBody) {
    try {
      const data = JSON.parse(rawBody) as Record<string, unknown>;
      const message = readErrorField(data);

      if (message) {
        return {
          message,
          stack: typeof data.stack === "string" ? data.stack : undefined,
          status,
        };
      }
    } catch {
      const snippet = rawBody.replace(/\s+/g, " ").trim().slice(0, 240);
      console.error("[CareerGPS][api-error] non-JSON body", {
        status,
        body: snippet,
      });

      if (snippet) {
        return {
          message: `HTTP ${status}: ${snippet}`,
          status,
        };
      }
    }
  }

  if (status >= 500) {
    return {
      message: `HTTP ${status}: 服务器开小差了，请稍后重试`,
      status,
    };
  }

  return {
    message: fallback,
    status,
  };
}

/**
 * 从 JSON API 响应中解析用户可读错误信息。
 */
export async function parseApiErrorMessage(
  response: Response,
  fallback = GENERIC_API_ERROR_MESSAGE,
): Promise<string> {
  const details = await parseApiErrorDetails(response, fallback);
  return details.message;
}
