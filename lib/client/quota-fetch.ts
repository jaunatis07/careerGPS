import { toast } from "sonner";

import {
  parseApiErrorDetails,
  parseApiErrorMessage,
} from "@/lib/client/parse-api-error";
import { formatUploadErrorMessage } from "@/lib/client/show-upload-error";

interface QuotaAwareFetchHandlers {
  onQuotaExceeded: () => void;
}

function resolveFetchUrl(input: RequestInfo | URL) {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.href;
  }

  return input.url;
}

function formatRequestErrorMessage(message: string) {
  if (message.startsWith("请求失败") || message.startsWith("上传失败")) {
    return message;
  }

  return `请求失败: ${message}`;
}

function normalizeNetworkErrorMessage(error: unknown): string {
  const message = formatUploadErrorMessage(error);

  if (
    message === "Load failed" ||
    message === "Failed to fetch" ||
    message === "NetworkError when attempting to fetch resource."
  ) {
    return "网络连接失败，请检查网络后重试";
  }

  return message;
}

/**
 * 包装 fetch：429 触发额度弹窗；其它 HTTP/网络错误抛出可读 Error，便于流式客户端捕获。
 */
export function createQuotaAwareFetch(handlers: QuotaAwareFetchHandlers) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = resolveFetchUrl(input);
    const method = init?.method ?? "GET";

    try {
      const response = await fetch(input, init);

      if (response.status === 429) {
        handlers.onQuotaExceeded();
        const message = await parseApiErrorMessage(response);
        console.warn("[CareerGPS][fetch] quota exceeded", {
          url,
          method,
          status: 429,
          message,
        });
        toast.error(message);
        throw new Error(message);
      }

      if (!response.ok) {
        const details = await parseApiErrorDetails(response);

        if (details.stack) {
          console.error("[CareerGPS][fetch] HTTP error stack", {
            url,
            method,
            status: details.status,
            stack: details.stack,
          });
        }

        const message = formatRequestErrorMessage(details.message);
        console.error("[CareerGPS][fetch] HTTP error", {
          url,
          method,
          status: details.status,
          message,
        });
        toast.error(message);
        throw new Error(message);
      }

      return response;
    } catch (error) {
      if (error instanceof Error) {
        const passthrough =
          error.message.startsWith("请求失败:") ||
          error.message.includes("额度") ||
          error.message.includes("DeepSeek") ||
          error.message.includes("登录") ||
          error.message.includes("请先");

        if (passthrough) {
          throw error;
        }
      }

      const friendly = normalizeNetworkErrorMessage(error);
      console.error("[CareerGPS][fetch] network error", {
        url,
        method,
        error,
      });
      toast.error(formatRequestErrorMessage(friendly));
      throw new Error(friendly);
    }
  };
}

/**
 * 普通 API 请求的错误 Toast 封装。
 */
export async function fetchJsonWithToast<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const url = resolveFetchUrl(input);
  const method = init?.method ?? "GET";
  let response: Response;

  try {
    response = await fetch(input, init);
  } catch (error) {
    const friendly = normalizeNetworkErrorMessage(error);
    console.error("[CareerGPS][fetchJsonWithToast] network error", {
      url,
      method,
      error,
    });
    toast.error(formatRequestErrorMessage(friendly));
    throw new Error(friendly);
  }

  if (!response.ok) {
    const details = await parseApiErrorDetails(response);

    if (details.stack) {
      console.error("[CareerGPS][fetchJsonWithToast] stack", {
        url,
        method,
        status: details.status,
        stack: details.stack,
      });
    }

    const message = formatRequestErrorMessage(details.message);
    toast.error(message);
    throw new Error(message);
  }

  return (await response.json()) as T;
}
