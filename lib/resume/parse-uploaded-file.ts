import {
  DocumentParseError,
  toDocumentParseError,
} from "@/lib/resume/document-parse-error";
import {
  MAX_RESUME_UPLOAD_BYTES,
  type ParsedResumeDocument,
} from "@/lib/resume/document-types";
import {
  detectResumeDocumentFormat,
} from "@/lib/resume/detect-document-format";
import { logDocumentError } from "@/lib/resume/log-document-error";

function assertFileSize(size: number, fileName: string) {
  if (size > MAX_RESUME_UPLOAD_BYTES) {
    throw new DocumentParseError(
      `${fileName} 超过 ${Math.round(MAX_RESUME_UPLOAD_BYTES / 1024 / 1024)}MB 大小限制`,
    );
  }

  if (size === 0) {
    throw new DocumentParseError(`${fileName} 为空文件，请选择有效内容`);
  }
}

/**
 * 解析上传的 JD / 简历文件为纯文本。
 */
export async function parseUploadedResumeDocument(
  file: File,
): Promise<ParsedResumeDocument> {
  const meta = {
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };

  try {
    assertFileSize(file.size, file.name);

    const format = detectResumeDocumentFormat(file);
    const buffer = Buffer.from(await file.arrayBuffer());

    switch (format) {
      case "txt": {
        const text = buffer.toString("utf-8").trim();
        if (!text) {
          throw new DocumentParseError("文本文件内容为空");
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
        const { extractPdfText } = await import("@/lib/resume/extract-pdf-text");
        const text = await extractPdfText(buffer);

        if (!text) {
          throw new DocumentParseError(
            "PDF 中未提取到文字，可能是扫描件，请改上传截图或图片",
          );
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
        const { extractDocxText } = await import("@/lib/resume/extract-docx-text");
        const text = await extractDocxText(buffer);

        if (!text) {
          throw new DocumentParseError("Word 文档中未提取到文字");
        }

        return {
          text,
          format,
          fileName: file.name,
          extractionMethod: "docx",
          charCount: text.length,
        };
      }
      case "image":
        throw new DocumentParseError(
          "图片 OCR 已在浏览器本地完成，请勿将图片上传到服务端",
        );
      default:
        throw new DocumentParseError(
          `不支持的文件格式：${file.name}。请上传 PDF、Word (.docx)、文本或图片`,
        );
    }
  } catch (error) {
    logDocumentError("parse uploaded document failed", error, meta);
    throw toDocumentParseError(error, "文件解析失败，请粘贴文本后重试");
  }
}

