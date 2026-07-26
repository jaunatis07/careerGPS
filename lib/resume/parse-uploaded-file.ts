import {
  MAX_RESUME_UPLOAD_BYTES,
  type ParsedResumeDocument,
} from "@/lib/resume/document-types";
import {
  detectResumeDocumentFormat,
} from "@/lib/resume/detect-document-format";
import { extractDocxText } from "@/lib/resume/extract-docx-text";
import { extractImageText } from "@/lib/resume/extract-image-text";
import { extractPdfText } from "@/lib/resume/extract-pdf-text";

function assertFileSize(size: number, fileName: string) {
  if (size > MAX_RESUME_UPLOAD_BYTES) {
    throw new Error(
      `${fileName} 超过 ${Math.round(MAX_RESUME_UPLOAD_BYTES / 1024 / 1024)}MB 大小限制`,
    );
  }

  if (size === 0) {
    throw new Error(`${fileName} 为空文件，请选择有效内容`);
  }
}

/**
 * 解析上传的 JD / 简历文件为纯文本。
 */
export async function parseUploadedResumeDocument(
  file: File,
): Promise<ParsedResumeDocument> {
  assertFileSize(file.size, file.name);

  const format = detectResumeDocumentFormat(file);
  const buffer = Buffer.from(await file.arrayBuffer());

  switch (format) {
    case "txt": {
      const text = buffer.toString("utf-8").trim();
      if (!text) {
        throw new Error("文本文件内容为空");
      }
      return {
        text,
        format,
        fileName: file.name,
        extractionMethod: "text",
        charCount: text.length,
      };
    }
    case "pdf": {
      const text = await extractPdfText(buffer);
      if (!text) {
        throw new Error("PDF 中未提取到文字，可能是扫描件，请改上传截图或图片");
      }
      return {
        text,
        format,
        fileName: file.name,
        extractionMethod: "pdf",
        charCount: text.length,
      };
    }
    case "docx": {
      const text = await extractDocxText(buffer);
      if (!text) {
        throw new Error("Word 文档中未提取到文字");
      }
      return {
        text,
        format,
        fileName: file.name,
        extractionMethod: "docx",
        charCount: text.length,
      };
    }
    case "image": {
      const mimeType = file.type || "image/png";
      const { text, method } = await extractImageText(buffer, mimeType);
      return {
        text,
        format,
        fileName: file.name,
        extractionMethod: method,
        charCount: text.length,
      };
    }
    default:
      throw new Error(
        `不支持的文件格式：${file.name}。请上传 PDF、Word (.docx)、文本或图片`,
      );
  }
}

export function documentNeedsQuota(
  document: Pick<ParsedResumeDocument, "format" | "extractionMethod">,
) {
  return document.format === "image";
}
