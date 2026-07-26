import { prepareUploadFile } from "@/lib/client/prepare-upload-file";

export interface ClientOcrProgress {
  status: string;
  progress: number;
}

/**
 * 在浏览器内用 Tesseract.js 识别图片文字（不消耗服务端 Vision API 额度）。
 */
export async function extractImageTextOnClient(
  file: File,
  onProgress?: (update: ClientOcrProgress) => void,
): Promise<string> {
  const preparedFile = await prepareUploadFile(file);
  const Tesseract = await import("tesseract.js");

  const { data } = await Tesseract.recognize(preparedFile, "chi_sim+eng", {
    logger: (message) => {
      if (!onProgress) {
        return;
      }

      if (message.status === "recognizing text") {
        onProgress({
          status: message.status,
          progress: message.progress,
        });
      }
    },
  });

  const text = data.text.trim();

  if (!text) {
    throw new Error("图片 OCR 未能识别出文字，请换更清晰的图片或直接粘贴文本");
  }

  return text;
}
