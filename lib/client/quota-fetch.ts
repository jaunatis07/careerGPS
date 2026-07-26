import { toast } from "sonner";

import {
  parseApiErrorDetails,
  parseApiErrorMessage,
} from "@/lib/client/parse-api-error";
import { showUploadError } from "@/lib/client/show-upload-error";

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

function formatHttpErrorToast(message: string) {
  return message.startsWith("上传失败") ? message : `上传失败: ${message}`;
}

/**
 * 包装 fetch：429 触发额度弹窗，其它错误 Toast 提示。
 */
export function createQuotaAwareFetch(handlers: QuotaAwareFetchHandlers) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = resolveFetchUrl(input);

    try {
      const response = await fetch(input, init);

      if (response.status === 429) {
        handlers.onQuotaExceeded();
        const message = await parseApiErrorMessage(response);
        console.warn("[CareerGPS][fetch] quota exceeded", { url, status: 429 });
        toast.error(message);
        return response;
      }

      if (!response.ok) {
        const details = await parseApiErrorDetails(response);

        if (details.stack) {
          console.error("[CareerGPS][fetch] HTTP error stack", {
            url,
            status: details.status,
            stack: details.stack,
          });
        }

        const message = formatHttpErrorToast(details.message);
        console.error("[CareerGPS][fetch] HTTP error", {
          url,
          status: details.status,
          message,
        });
        toast.error(message);
      }

      return response;
    } catch (error) {
      console.error("[CareerGPS][fetch] network error", { url, error });
      showUploadError(error, "网络开小差了");
      throw error;
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
  let response: Response;

  try {
    response = await fetch(input, init);
  } catch (error) {
    showUploadError(error, "网络开小差了");
    throw error;
  }

  if (!response.ok) {
    const details = await parseApiErrorDetails(response);

    if (details.stack) {
      console.error("[CareerGPS][fetchJsonWithToast] stack", {
        url: resolveFetchUrl(input),
        status: details.status,
        stack: details.stack,
      });
    }

    const message = formatHttpErrorToast(details.message);
    toast.error(message);
    throw new Error(message);
  }

  return (await response.json()) as T;
}
