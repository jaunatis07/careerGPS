"use client";

import { FileUp, ImagePlus, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { extractDocumentFromFile } from "@/lib/client/extract-document";
import { RESUME_FILE_ACCEPT } from "@/lib/resume/document-types";
import { cn } from "@/lib/utils";

interface ResumeUploadZoneProps {
  label: string;
  disabled?: boolean;
  onExtracted: (text: string) => void;
}

/**
 * 简历/JD 上传区：点击选文件、拖拽、粘贴图片。
 */
export function ResumeUploadZone({
  label,
  disabled = false,
  onExtracted,
}: ResumeUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file || disabled || isParsing) {
      return;
    }

    setIsParsing(true);

    try {
      const result = await extractDocumentFromFile(file);
      onExtracted(result.text);
      toast.success(result.message);
    } catch {
      // fetchJsonWithToast 已展示错误
    } finally {
      setIsParsing(false);
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    if (disabled || isParsing) {
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
          void handleFile(
            new File([file], file.name || "clipboard-image.png", {
              type: file.type,
            }),
          );
        }

        return;
      }
    }
  }

  return (
    <div
      tabIndex={0}
      onPaste={handlePaste}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled && !isParsing) {
          setIsDragging(true);
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);

        if (disabled || isParsing) {
          return;
        }

        void handleFile(event.dataTransfer.files?.[0]);
      }}
      className={cn(
        "rounded-lg border border-dashed p-3 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border/80 bg-muted/20",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={RESUME_FILE_ACCEPT}
        className="hidden"
        disabled={disabled || isParsing}
        onChange={(event) =>
          void handleFile(event.target.files?.[0]).finally(() => {
            event.target.value = "";
          })
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium">{label}</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            支持 PDF、Word (.docx)、.txt、JD/简历截图；可拖拽或 Ctrl+V 粘贴图片
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isParsing}
            onClick={() => inputRef.current?.click()}
          >
            {isParsing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileUp className="size-3.5" />
            )}
            {isParsing ? "解析中…" : "选择文件"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || isParsing}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="size-3.5" />
            相册/图片
          </Button>
        </div>
      </div>
    </div>
  );
}
