import {
  buildOcrCleanupSystemPrompt,
  buildOcrCleanupUserPrompt,
} from "@/lib/ai/prompts/ocr-cleanup-prompt";
import { parseApiErrorDetails } from "@/lib/client/parse-api-error";

interface AiCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: string;
}

/**
 * 调用 DeepSeek 文本接口清洗 OCR 原始文本。
 */
export async function cleanOcrTextWithDeepSeek(rawText: string): Promise<string> {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      stream: false,
      system: buildOcrCleanupSystemPrompt(),
      prompt: buildOcrCleanupUserPrompt(rawText),
    }),
  });

  if (!response.ok) {
    const details = await parseApiErrorDetails(response);
    throw new Error(details.message);
  }

  const payload = (await response.json()) as AiCompletionResponse;
  const cleaned = payload.choices?.[0]?.message?.content?.trim();

  if (!cleaned) {
    throw new Error("AI 未能返回清洗后的文本");
  }

  return cleaned;
}
