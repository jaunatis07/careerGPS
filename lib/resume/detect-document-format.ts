import type { ResumeDocumentFormat } from "@/lib/resume/document-types";

const IMAGE_MIME_PREFIX = "image/";

export function detectResumeDocumentFormat(
  file: File | { name: string; type: string },
): ResumeDocumentFormat {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (type.startsWith(IMAGE_MIME_PREFIX) || /\.(png|jpe?g|gif|webp|bmp|heic)$/i.test(name)) {
    return "image";
  }

  if (
    type === "application/pdf" ||
    name.endsWith(".pdf")
  ) {
    return "pdf";
  }

  if (
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    return "docx";
  }

  if (
    type === "text/plain" ||
    type === "text/markdown" ||
    name.endsWith(".txt") ||
    name.endsWith(".md")
  ) {
    return "txt";
  }

  return "unknown";
}

export function getResumeFormatLabel(format: ResumeDocumentFormat): string {
  switch (format) {
    case "pdf":
      return "PDF";
    case "docx":
      return "Word";
    case "image":
      return "图片";
    case "txt":
      return "文本";
    default:
      return "文件";
  }
}
