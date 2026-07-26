import {
  getDeepSeekApiKey,
  getDeepSeekBaseUrl,
  getDeepSeekChatCompletionsUrl,
  getDeepSeekVisionModel,
} from "@/lib/ai/env";

const OCR_PROMPT =
  "请完整、准确地提取图片中的全部文字内容（含中文、英文、数字与标点）。按自然阅读顺序输出纯文本，不要添加解释或 Markdown 格式。";

interface DeepSeekVisionResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  error?: { message?: string };
}

function normalizeVisionContent(
  content: string | Array<{ type?: string; text?: string }> | undefined,
): string {
  if (!content) {
    return "";
  }

  if (typeof content === "string") {
    return content.trim();
  }

  return content
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text)
    .join("\n")
    .trim();
}

/**
 * 调用 DeepSeek 视觉多模态接口提取图片文字（OpenAI 兼容 messages 格式）。
 */
export async function extractTextFromImageWithDeepSeek(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;
  const model = getDeepSeekVisionModel();
  const url = getDeepSeekChatCompletionsUrl();

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getDeepSeekApiKey()}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: OCR_PROMPT },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0,
      }),
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `DeepSeek OCR 网络请求失败：${error.message}`
        : "DeepSeek OCR 网络请求失败",
    );
  }

  const payload = (await response.json()) as DeepSeekVisionResponse;

  if (!response.ok) {
    const message =
      payload.error?.message ??
      `DeepSeek OCR 请求失败（HTTP ${response.status}）`;
    throw new Error(
      `${message}（model=${model}, baseURL=${getDeepSeekBaseUrl()}）`,
    );
  }

  const text = normalizeVisionContent(payload.choices?.[0]?.message?.content);

  if (!text) {
    throw new Error("DeepSeek OCR 未返回可用文本");
  }

  return text;
}
