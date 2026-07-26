"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { extractDocumentFromFile } from "@/lib/client/extract-document";
import { RESUME_FILE_ACCEPT } from "@/lib/resume/document-types";
import { cn } from "@/lib/utils";

interface ResumeUploadZoneProps {
  label: string;
  disabled?: boolean;
  onExtracted: (text: string) => void;
  onExtractingChange?: (isExtracting: boolean) => void;
}

/**
 * 简历/JD 上传：单个原生 file input，由系统弹出相册/拍照/文件选择面板。
 */
export function ResumeUploadZone({
  label,
  disabled = false,
  onExtracted,
  onExtractingChange,
}: ResumeUploadZoneProps) {
  const [isParsing, setIsParsing] = useState(false);
  const isDisabled = disabled || isParsing;

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file || isDisabled) {
      return;
    }

    setIsParsing(true);
    onExtractingChange?.(true);

    try {
      const result = await extractDocumentFromFile(file);
      onExtracted(result.text);
      toast.success(result.message);
    } catch {
      // fetchJsonWithToast 已展示错误
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
        className="sr-only"
        disabled={isDisabled}
        onChange={(event) => void handleChange(event)}
      />
      {isParsing ? <Loader2 className="size-3.5 animate-spin" /> : null}
      {isParsing ? "解析中…" : label}
    </label>
  );
}
