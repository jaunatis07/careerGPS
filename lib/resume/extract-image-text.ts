import { getDeepSeekOpenAIClient } from "@/lib/ai/deepseek-openai-client";
import { getDeepSeekVisionModel } from "@/lib/ai/env";
import { DocumentParseError } from "@/lib/resume/document-parse-error";
import {
  logDocumentError,
  toDocumentErrorMessage,
} from "@/lib/resume/log-document-error";

const OCR_PROMPT =
  "请完整、准确地提取图片中的全部文字内容（含中文、英文、数字与标点）。按自然阅读顺序输出纯文本，不要添加解释或 Markdown 格式。";

function isServerlessRuntime() {
  return Boolean(process.env.VERCEL);
}

function normalizeVisionContent(
  content: string | null | undefined,
): string {
  return content?.trim() ?? "";
}

/**
 * 通过 DeepSeek 多模态接口提取图片文字。
 */
async function extractViaDeepSeekVision(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  try {
    const response = await getDeepSeekOpenAIClient().chat.completions.create({
      model: getDeepSeekVisionModel(),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: OCR_PROMPT },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0,
    });

    const text = normalizeVisionContent(response.choices[0]?.message?.content);

    if (!text) {
      throw new DocumentParseError("DeepSeek OCR 未返回可用文本");
    }

    return text;
  } catch (error) {
    if (error instanceof DocumentParseError) {
      throw error;
    }

    logDocumentError("DeepSeek OCR request failed", error, {
      mimeType,
      bufferSize: buffer.length,
      model: getDeepSeekVisionModel(),
    });

    const message =
      error instanceof Error
        ? error.message
        : toDocumentErrorMessage(error, "DeepSeek OCR 请求失败");

    throw new DocumentParseError(message);
  }
}

async function extractViaTesseract(buffer: Buffer): Promise<string> {
  if (isServerlessRuntime()) {
    throw new DocumentParseError(
      "Serverless 环境不支持本地 OCR 引擎",
    );
  }

  try {
    const Tesseract = await import("tesseract.js");
    const { data } = await Tesseract.recognize(buffer, "chi_sim+eng", {
      logger: () => {},
    });

    return data.text.trim();
  } catch (error) {
    logDocumentError("tesseract OCR failed", error, {
      bufferSize: buffer.length,
    });
    throw new DocumentParseError(
      toDocumentErrorMessage(error, "本地 OCR 引擎启动失败"),
    );
  }
}

export type ImageExtractionMethod = "vision" | "ocr";

/**
 * 图片文字提取：优先 DeepSeek 视觉识图，本地环境失败则回退 Tesseract。
 */
export async function extractImageText(
  buffer: Buffer,
  mimeType: string,
): Promise<{ text: string; method: ImageExtractionMethod }> {
  try {
    const text = await extractViaDeepSeekVision(buffer, mimeType);
    return { text, method: "vision" };
  } catch (visionError) {
    logDocumentError("DeepSeek OCR failed, falling back to Tesseract", visionError);
  }

  if (isServerlessRuntime()) {
    throw new DocumentParseError(
      "图片 OCR 暂不可用（请配置 DEEPSEEK_API_KEY 或检查图片格式）",
    );
  }

  const text = await extractViaTesseract(buffer);

  if (!text) {
    throw new DocumentParseError("图片 OCR 未能识别出文字");
  }

  return { text, method: "ocr" };
}
