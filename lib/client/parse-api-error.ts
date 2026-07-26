import {
  GENERIC_API_ERROR_MESSAGE,
  QUOTA_EXHAUSTED_MESSAGE,
} from "@/lib/constants/quota-messages";

export function isQuotaExceededStatus(status: number) {
  return status === 429;
}

/**
 * 从 JSON API 响应中解析用户可读错误信息。
 */
export async function parseApiErrorMessage(
  response: Response,
  fallback = GENERIC_API_ERROR_MESSAGE,
): Promise<string> {
  if (isQuotaExceededStatus(response.status)) {
    return QUOTA_EXHAUSTED_MESSAGE;
  }

  if (response.status === 413) {
    return "上传文件过大，请压缩图片到 4MB 以内或粘贴文本后重试";
  }

  try {
    const data = (await response.clone().json()) as { error?: string };

    if (data.error) {
      return data.error;
    }
  } catch {
    // 非 JSON 响应，使用 fallback
  }

  if (response.status >= 500) {
    return "服务器开小差了，请稍后重试";
  }

  return fallback;
}
