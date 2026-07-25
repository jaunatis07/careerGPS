"use client";

import { Upload } from "lucide-react";
import { useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ANALYSIS_MODE_LABELS,
  detectAnalysisMode,
} from "@/lib/resume/detect-analysis-mode";
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
 * JD / 简历输入区：文本粘贴、.txt 上传与脱敏预览。
 */
export function ResumeInputPanel({
  jdText,
  resumeText,
  onJdChange,
  onResumeChange,
  onAnalyze,
  isAnalyzing,
}: ResumeInputPanelProps) {
  const jdFileRef = useRef<HTMLInputElement>(null);
  const resumeFileRef = useRef<HTMLInputElement>(null);

  const mode = detectAnalysisMode(jdText, resumeText);
  const jdSanitize = jdText ? sanitizeResumeTextDetailed(jdText) : null;
  const resumeSanitize = resumeText
    ? sanitizeResumeTextDetailed(resumeText)
    : null;

  const hasSensitiveData =
    Boolean(jdSanitize?.hasSensitiveData) ||
    Boolean(resumeSanitize?.hasSensitiveData);

  async function handleFileRead(
    file: File | undefined,
    onChange: (value: string) => void,
  ) {
    if (!file) {
      return;
    }

    if (
      !file.name.endsWith(".txt") &&
      !file.name.endsWith(".md") &&
      !["text/plain", "text/markdown"].includes(file.type)
    ) {
      alert("暂仅支持 .txt / .md 文本文件，图片 OCR 将在后续版本支持");
      return;
    }

    onChange(await file.text());
  }

  return (
    <section className="space-y-4 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">上传 / 粘贴内容</h2>
          <p className="text-xs text-muted-foreground">
            支持单 JD、单简历或 JD+简历 三种分析模式
          </p>
        </div>
        {mode ? (
          <Badge variant="secondary">{ANALYSIS_MODE_LABELS[mode]}</Badge>
        ) : (
          <Badge variant="outline">等待输入</Badge>
        )}
      </div>

      {hasSensitiveData ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
          已检测到手机号/邮箱/姓名等敏感信息，提交分析前将自动脱敏后再发送给 AI。
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="jd-text">JD 岗位描述</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isAnalyzing}
              onClick={() => jdFileRef.current?.click()}
            >
              <Upload className="size-3.5" />
              上传 .txt
            </Button>
            <input
              ref={jdFileRef}
              type="file"
              accept=".txt,.md,text/plain,text/markdown"
              className="hidden"
              onChange={(event) =>
                void handleFileRead(
                  event.target.files?.[0],
                  onJdChange,
                ).finally(() => {
                  event.target.value = "";
                })
              }
            />
          </div>
          <textarea
            id="jd-text"
            className={textareaClassName}
            placeholder="粘贴 JD 全文，或上传文本文件…"
            value={jdText}
            disabled={isAnalyzing}
            onChange={(event) => onJdChange(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="resume-text">简历内容</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isAnalyzing}
              onClick={() => resumeFileRef.current?.click()}
            >
              <Upload className="size-3.5" />
              上传 .txt
            </Button>
            <input
              ref={resumeFileRef}
              type="file"
              accept=".txt,.md,text/plain,text/markdown"
              className="hidden"
              onChange={(event) =>
                void handleFileRead(
                  event.target.files?.[0],
                  onResumeChange,
                ).finally(() => {
                  event.target.value = "";
                })
              }
            />
          </div>
          <textarea
            id="resume-text"
            className={textareaClassName}
            placeholder="粘贴简历全文，或上传文本文件…"
            value={resumeText}
            disabled={isAnalyzing}
            onChange={(event) => onResumeChange(event.target.value)}
          />
        </div>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-2 border-t bg-card px-4 py-3 sm:static sm:mx-0 sm:border-0 sm:px-0 sm:py-0">
        <Button
          type="button"
          className="w-full sm:ml-auto sm:w-auto"
          disabled={!mode || isAnalyzing}
          onClick={onAnalyze}
        >
          {isAnalyzing ? "DeepSeek 分析中…" : "开始排雷分析"}
        </Button>
      </div>
    </section>
  );
}
