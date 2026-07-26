/** 简历/JD 上传允许的最大文件体积（10MB） */
export const MAX_RESUME_UPLOAD_BYTES = 10 * 1024 * 1024;

/** 前端 file input accept 属性（含图片） */
export const RESUME_FILE_ACCEPT =
  ".txt,.md,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,image/*";

/** 文档类文件 accept（不含图片） */
export const RESUME_DOCUMENT_ACCEPT =
  ".txt,.md,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown";

export type ResumeDocumentFormat =
  | "txt"
  | "pdf"
  | "docx"
  | "image"
  | "unknown";

export interface ParsedResumeDocument {
  text: string;
  format: ResumeDocumentFormat;
  fileName: string;
  extractionMethod: "text" | "pdf" | "docx" | "vision" | "ocr";
  charCount: number;
}
