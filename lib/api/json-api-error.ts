import type { DocumentParseError } from "@/lib/resume/document-parse-error";
import { isDocumentParseError } from "@/lib/resume/document-parse-error";
import { formatApiErrorPayload } from "@/lib/resume/log-document-error";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
} as const;

/**
 * 始终返回 JSON 响应，避免 Next/Vercel 默认 HTML 500 页。
 */
export function jsonApiError(
  error: unknown,
  fallback: string,
  status = 422,
) {
  if (isDocumentParseError(error)) {
    const parseError = error as DocumentParseError;

    return Response.json(
      {
        error: parseError.toApiMessage(),
        stack: parseError.stack,
        name: parseError.name,
      },
      { status, headers: JSON_HEADERS },
    );
  }

  return Response.json(formatApiErrorPayload(error, fallback), {
    status,
    headers: JSON_HEADERS,
  });
}
