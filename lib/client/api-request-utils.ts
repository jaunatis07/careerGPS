/** Vercel Serverless 请求体安全上限（留 JSON 开销余量） */
export const MAX_RESUME_ANALYSIS_BODY_BYTES = 4 * 1024 * 1024 - 256 * 1024;

/** 简历排雷分析 API 路径 */
export const RESUME_AGENT_API_PATH = "/api/resume-agent";

/**
 * 在浏览器中将 API 相对路径解析为同源绝对 URL，避免生产环境域名/路径歧义。
 */
export function resolveApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;

  if (typeof window !== "undefined") {
    return `${window.location.origin}${normalized}`;
  }

  return normalized;
}

function truncateForLog(value: unknown, max = 120): unknown {
  if (typeof value !== "string") {
    return value;
  }

  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max)}… (${value.length} chars)`;
}

/**
 * 发起 fetch 前打印目标 URL 与请求体摘要，便于生产环境排查。
 */
export function logFetchRequest(
  tag: string,
  url: string,
  init?: RequestInit,
): void {
  const method = init?.method ?? "GET";
  const headers =
    init?.headers instanceof Headers
      ? Object.fromEntries(init.headers.entries())
      : init?.headers;

  let bodySize = 0;
  let bodyPreview: unknown;

  if (typeof init?.body === "string") {
    bodySize = new Blob([init.body]).size;

    try {
      const parsed = JSON.parse(init.body) as Record<string, unknown>;
      bodyPreview = {
        ...parsed,
        prompt: truncateForLog(parsed.prompt),
        jdText: truncateForLog(parsed.jdText),
        resumeText: truncateForLog(parsed.resumeText),
        messages: Array.isArray(parsed.messages)
          ? `[${parsed.messages.length} messages]`
          : parsed.messages,
      };
    } catch {
      bodyPreview = truncateForLog(init.body, 240);
    }
  }

  console.info(`[CareerGPS][${tag}] fetch request`, {
    url,
    absoluteUrl: typeof window !== "undefined" ? resolveApiUrl(url) : url,
    method,
    bodySize,
    bodyPreview,
    headers,
    credentials: init?.credentials,
  });
}

export function estimateResumeAnalysisPayloadBytes(jdText: string, resumeText: string) {
  const payload = JSON.stringify({
    prompt: "",
    jdText,
    resumeText,
  });

  return new Blob([payload]).size;
}
