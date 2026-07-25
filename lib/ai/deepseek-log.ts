import {
  APICallError,
  JSONParseError,
  LoadAPIKeyError,
  TypeValidationError,
} from "@ai-sdk/provider";

import {
  getDeepSeekBaseUrl,
  getDeepSeekChatCompletionsUrl,
  getDeepSeekChatModel,
} from "@/lib/ai/env";

export interface DeepSeekRequestMeta {
  baseURL: string;
  model: string;
  endpoint: string;
  mode: "stream" | "generate";
}

/**
 * 记录即将发起的 DeepSeek 请求配置（不含 API Key）。
 */
export function logDeepSeekRequestMeta(mode: DeepSeekRequestMeta["mode"]) {
  const meta: DeepSeekRequestMeta = {
    baseURL: getDeepSeekBaseUrl(),
    model: getDeepSeekChatModel(),
    endpoint: getDeepSeekChatCompletionsUrl(),
    mode,
  };

  console.info("[CareerGPS][DeepSeek] request", meta);
  return meta;
}

/**
 * 将 DeepSeek / AI SDK 错误完整打印到控制台，便于 Vercel 日志排查。
 */
export function logDeepSeekError(context: string, error: unknown) {
  const prefix = `[CareerGPS][DeepSeek] ${context}`;

  if (APICallError.isInstance(error)) {
    console.error(prefix, {
      type: "APICallError",
      message: error.message,
      url: error.url,
      statusCode: error.statusCode,
      responseBody: error.responseBody,
      responseHeaders: error.responseHeaders,
      isRetryable: error.isRetryable,
      requestBodyValues: error.requestBodyValues,
      data: error.data,
    });
    return;
  }

  if (JSONParseError.isInstance(error)) {
    console.error(prefix, {
      type: "JSONParseError",
      message: error.message,
      text: error.text,
    });
    return;
  }

  if (TypeValidationError.isInstance(error)) {
    console.error(prefix, {
      type: "TypeValidationError",
      message: error.message,
      value: error.value,
    });
    return;
  }

  if (LoadAPIKeyError.isInstance(error)) {
    console.error(prefix, {
      type: "LoadAPIKeyError",
      message: error.message,
    });
    return;
  }

  if (error instanceof Error) {
    const cause =
      error.cause instanceof Error
        ? {
            name: error.cause.name,
            message: error.cause.message,
            stack: error.cause.stack,
          }
        : error.cause;

    console.error(prefix, {
      type: error.name,
      message: error.message,
      stack: error.stack,
      cause,
    });
    return;
  }

  console.error(prefix, { type: "unknown", error });
}

/**
 * 从已知错误中提取适合返回给客户端的简短信息（不暴露敏感响应体）。
 */
export function formatDeepSeekClientError(error: unknown): string {
  if (APICallError.isInstance(error)) {
    const status = error.statusCode ? `HTTP ${error.statusCode}` : "HTTP error";
    const detail = error.responseBody?.slice(0, 200);
    return detail
      ? `DeepSeek API 调用失败（${status}）：${detail}`
      : `DeepSeek API 调用失败（${status}）：${error.message}`;
  }

  if (LoadAPIKeyError.isInstance(error)) {
    return "DeepSeek API Key 未配置或无效，请检查 Vercel 环境变量 DEEPSEEK_API_KEY";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "DeepSeek 请求失败，请稍后重试";
}
