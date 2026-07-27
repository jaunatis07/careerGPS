"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { extractDocumentFromFile } from "@/lib/client/extract-document";
import { RESUME_FILE_ACCEPT } from "@/lib/resume/document-types";
import { appendExtractedContent } from "@/lib/utils/append-extracted-text";
import { cn } from "@/lib/utils";

interface ResumeUploadZoneProps {
  label: string;
  currentText: string;
  disabled?: boolean;
  onExtracted: (text: string) => void;
  onExtractingChange?: (isExtracting: boolean) => void;
}

/**
 * 简历/JD 上传：支持多文件连续追加识别，新内容拼接到输入框末尾。
 */
export function ResumeUploadZone({
  label,
  currentText,
  disabled = false,
  onExtracted,
  onExtractingChange,
}: ResumeUploadZoneProps) {
  const [isParsing, setIsParsing] = useState(false);
  const isDisabled = disabled || isParsing;

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = input.files ? Array.from(input.files) : [];

    if (files.length === 0 || isDisabled) {
      return;
    }

    setIsParsing(true);
    onExtractingChange?.(true);

    try {
      let accumulated = currentText;

      for (const file of files) {
        const result = await extractDocumentFromFile(file);
        accumulated = appendExtractedContent(accumulated, result.text);
        onExtracted(accumulated);
      }

      if (files.length === 1) {
        toast.success(`内容已追加到输入框末尾`);
      } else {
        toast.success(`已从 ${files.length} 个文件追加内容到输入框末尾`);
      }
    } catch (error) {
      console.error("[CareerGPS][ResumeUploadZone]", error);
    } finally {
      setIsParsing(false);
      onExtractingChange?.(false);
      input.value = "";
    }
  }

  return (
    <label
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "inline-flex shrink-0 cursor-pointer items-center gap-1.5",
        isDisabled && "pointer-events-none opacity-50",
      )}
    >
      <input
        type="file"
        accept={RESUME_FILE_ACCEPT}
        multiple
        className="sr-only"
        disabled={isDisabled}
        onChange={(event) => void handleChange(event)}
      />
      {isParsing ? <Loader2 className="size-3.5 animate-spin" /> : null}
      {isParsing ? "解析中…" : label}
    </label>
  );
}
