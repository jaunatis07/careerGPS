import { extractTextFromImageWithDeepSeek } from "@/lib/ai/deepseek-vision-request";
import { DocumentParseError } from "@/lib/resume/document-parse-error";
import {
  logDocumentError,
  toDocumentErrorMessage,
} from "@/lib/resume/log-document-error";

function isServerlessRuntime() {
  return Boolean(process.env.VERCEL);
}

async function extractViaDeepSeekVision(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  try {
    return await extractTextFromImageWithDeepSeek(buffer, mimeType);
  } catch (error) {
    logDocumentError("DeepSeek OCR request failed", error, {
      mimeType,
      bufferSize: buffer.length,
    });

    throw new DocumentParseError(
      error instanceof Error
        ? error.message
        : toDocumentErrorMessage(error, "DeepSeek OCR 请求失败"),
    );
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
      "图片 OCR 暂不可用（请配置 DEEPSEEK_API_KEY，并确认 DEEPSEEK_VISION_MODEL 支持识图）",
    );
  }

  const text = await extractViaTesseract(buffer);

  if (!text) {
    throw new DocumentParseError("图片 OCR 未能识别出文字");
  }

  return { text, method: "ocr" };
}
