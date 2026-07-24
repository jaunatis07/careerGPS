import { toast } from "sonner";

import { parseApiErrorMessage } from "@/lib/client/parse-api-error";

interface QuotaAwareFetchHandlers {
  onQuotaExceeded: () => void;
}

/**
 * 包装 fetch：429 触发额度弹窗，其它错误 Toast 提示。
 */
export function createQuotaAwareFetch(handlers: QuotaAwareFetchHandlers) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const response = await fetch(input, init);

      if (response.status === 429) {
        handlers.onQuotaExceeded();
        const message = await parseApiErrorMessage(response);
        toast.error(message);
        return response;
      }

      if (!response.ok) {
        const message = await parseApiErrorMessage(response);
        toast.error(message);
      }

      return response;
    } catch {
      toast.error("网络开小差了，请稍后重试");
      throw new Error("网络开小差了，请稍后重试");
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
  const response = await fetch(input, init);

  if (!response.ok) {
    const message = await parseApiErrorMessage(response);
    toast.error(message);
    throw new Error(message);
  }

  return (await response.json()) as T;
}
