import { toast } from "sonner";

/**
 * 将 unknown 错误转为可读字符串。
 */
export function formatUploadErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.trim() || "未知错误";
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "未知错误";
  }
}

/**
 * 上传失败 Toast：展示 err.message 或序列化后的错误对象。
 */
export function showUploadError(error: unknown, prefix = "上传失败") {
  const message = formatUploadErrorMessage(error);
  const fullMessage = message.startsWith(prefix)
    ? message
    : `${prefix}: ${message}`;

  console.error("[CareerGPS][upload]", error);
  toast.error(fullMessage);

  return fullMessage;
}
