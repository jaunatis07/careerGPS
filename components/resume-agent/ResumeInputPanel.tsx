"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ResumeUploadZone } from "@/components/resume-agent/ResumeUploadZone";
import { extractDocumentFromFile } from "@/lib/client/extract-document";
import { detectAnalysisMode } from "@/lib/resume/detect-analysis-mode";
import { appendExtractedContent } from "@/lib/utils/append-extracted-text";
import { cn } from "@/lib/utils";
import { sanitizeResumeTextDetailed } from "@/lib/utils/sanitize";

interface ResumeInputPanelProps {
  jdText: string;
  resumeText: string;
  onJdChange: (value: string) => void;
  onResumeChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const textareaClassName = cn(
  "min-h-[140px] w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-base transition-colors outline-none sm:min-h-[180px] sm:text-sm",
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
);

/**
 * JD / 简历输入区：文本粘贴、多格式上传与脱敏预览。
 */
export function ResumeInputPanel({
  jdText,
  resumeText,
  onJdChange,
  onResumeChange,
  onAnalyze,
  isAnalyzing,
}: ResumeInputPanelProps) {
  const [isExtracting, setIsExtracting] = useState(false);

  const mode = detectAnalysisMode(jdText, resumeText);
  const jdSanitize = jdText ? sanitizeResumeTextDetailed(jdText) : null;
  const resumeSanitize = resumeText
    ? sanitizeResumeTextDetailed(resumeText)
    : null;

  const hasSensitiveData =
    Boolean(jdSanitize?.hasSensitiveData) ||
    Boolean(resumeSanitize?.hasSensitiveData);

  async function extractIntoField(
    field: "jd" | "resume",
    files: File | File[] | undefined,
  ) {
    const fileList = files
      ? Array.isArray(files)
        ? files
        : [files]
      : [];

    if (fileList.length === 0 || isAnalyzing || isExtracting) {
      return;
    }

    setIsExtracting(true);

    try {
      let accumulated = field === "jd" ? jdText : resumeText;

      for (const file of fileList) {
        const result = await extractDocumentFromFile(file);
        accumulated = appendExtractedContent(accumulated, result.text);
      }

      if (field === "jd") {
        onJdChange(accumulated);
      } else {
        onResumeChange(accumulated);
      }

      toast.success(
        fileList.length === 1
          ? "内容已追加到输入框末尾"
          : `已从 ${fileList.length} 个文件追加内容到输入框末尾`,
      );
    } catch (error) {
      console.error("[CareerGPS][ResumeInputPanel]", error);
    } finally {
      setIsExtracting(false);
    }
  }

  function handlePaste(
    field: "jd" | "resume",
    event: React.ClipboardEvent<HTMLTextAreaElement>,
  ) {
    if (isAnalyzing || isExtracting) {
      return;
    }

    const items = event.clipboardData?.items;
    if (!items) {
      return;
    }

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          void extractIntoField(
            field,
            new File([file], file.name || "clipboard-image.png", {
              type: file.type,
            }),
          );
        }
        return;
      }
    }
  }

  function handleDrop(
    field: "jd" | "resume",
    event: React.DragEvent<HTMLTextAreaElement>,
  ) {
    event.preventDefault();

    if (isAnalyzing || isExtracting) {
      return;
    }

    void extractIntoField(
      field,
      event.dataTransfer.files ? Array.from(event.dataTransfer.files) : undefined,
    );
  }

  return (
    <section className="space-y-4 rounded-xl border bg-card p-4">
      {hasSensitiveData ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
          已检测到手机号/邮箱/姓名等敏感信息，提交分析前将自动脱敏后再发送给 AI。
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="jd-text">JD 岗位描述</Label>
            <ResumeUploadZone
              label="上传 JD"
              currentText={jdText}
              disabled={isAnalyzing || isExtracting}
              onExtracted={onJdChange}
              onExtractingChange={setIsExtracting}
            />
          </div>
          <textarea
            id="jd-text"
            className={textareaClassName}
            placeholder="粘贴 JD 全文…"
            value={jdText}
            disabled={isAnalyzing || isExtracting}
            onChange={(event) => onJdChange(event.target.value)}
            onPaste={(event) => handlePaste("jd", event)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop("jd", event)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="resume-text">简历内容</Label>
            <ResumeUploadZone
              label="上传简历"
              currentText={resumeText}
              disabled={isAnalyzing || isExtracting}
              onExtracted={onResumeChange}
              onExtractingChange={setIsExtracting}
            />
          </div>
          <textarea
            id="resume-text"
            className={textareaClassName}
            placeholder="粘贴简历全文…"
            value={resumeText}
            disabled={isAnalyzing || isExtracting}
            onChange={(event) => onResumeChange(event.target.value)}
            onPaste={(event) => handlePaste("resume", event)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop("resume", event)}
          />
        </div>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-2 border-t bg-card px-4 py-3 sm:static sm:mx-0 sm:border-0 sm:px-0 sm:py-0">
        <Button
          type="button"
          className="w-full sm:ml-auto sm:w-auto"
          disabled={!mode || isAnalyzing || isExtracting}
          onClick={onAnalyze}
        >
          {isAnalyzing ? "DeepSeek 分析中…" : "开始排雷分析"}
        </Button>
      </div>
    </section>
  );
}
