import { logDeepSeekError } from "@/lib/ai/deepseek-log";
import { getDeepSeekApiKey, getDeepSeekBaseUrl } from "@/lib/ai/env";

const OCR_PROMPT =
  "请完整、准确地提取图片中的全部文字内容（含中文、英文、数字与标点）。按自然阅读顺序输出纯文本，不要添加解释或 Markdown 格式。";

interface VisionOcrResponse {
  choices?: Array<{
    message?: { content?: string | Array<{ type?: string; text?: string }> };
  }>;
  error?: { message?: string };
}

function getVisionModel() {
  return process.env.DEEPSEEK_VISION_MODEL?.trim() || "deepseek-v4-flash";
}

function getVisionBaseUrl() {
  return process.env.DEEPSEEK_VISION_BASE_URL?.trim() || getDeepSeekBaseUrl();
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

async function extractViaVisionApi(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;
  const url = `${getVisionBaseUrl().replace(/\/+$/, "")}/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getDeepSeekApiKey()}`,
    },
    body: JSON.stringify({
      model: getVisionModel(),
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

  const payload = (await response.json()) as VisionOcrResponse;

  if (!response.ok) {
    throw new Error(
      payload.error?.message ??
        `Vision OCR 请求失败（HTTP ${response.status}）`,
    );
  }

  const text = normalizeVisionContent(payload.choices?.[0]?.message?.content);

  if (!text) {
    throw new Error("Vision OCR 未返回可用文本");
  }

  return text;
}

async function extractViaTesseract(buffer: Buffer): Promise<string> {
  const Tesseract = await import("tesseract.js");
  const { data } = await Tesseract.recognize(buffer, "chi_sim+eng", {
    logger: () => {},
  });

  return data.text.trim();
}

export type ImageExtractionMethod = "vision" | "ocr";

/**
 * 图片文字提取：优先 Vision API，失败则回退 Tesseract OCR。
 */
export async function extractImageText(
  buffer: Buffer,
  mimeType: string,
): Promise<{ text: string; method: ImageExtractionMethod }> {
  try {
    const text = await extractViaVisionApi(buffer, mimeType);
    return { text, method: "vision" };
  } catch (visionError) {
    logDeepSeekError("Vision OCR failed, falling back to Tesseract", visionError);
  }

  const text = await extractViaTesseract(buffer);

  if (!text) {
    throw new Error("图片 OCR 未能识别出文字，请尝试更清晰的截图或粘贴文本");
  }

  return { text, method: "ocr" };
}
