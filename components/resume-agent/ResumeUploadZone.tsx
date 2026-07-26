"use client";

import { Camera, ChevronDown, FolderOpen, Images, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { extractDocumentFromFile } from "@/lib/client/extract-document";
import { RESUME_DOCUMENT_ACCEPT } from "@/lib/resume/document-types";
import { cn } from "@/lib/utils";

interface ResumeUploadZoneProps {
  label: string;
  disabled?: boolean;
  onExtracted: (text: string) => void;
  onExtractingChange?: (isExtracting: boolean) => void;
}

const menuLabelClassName = cn(
  "flex w-full cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden",
  "focus-visible:bg-accent focus-visible:text-accent-foreground",
);

/**
 * 简历/JD 上传按钮：下拉选择相册、拍照或文件。
 */
export function ResumeUploadZone({
  label,
  disabled = false,
  onExtracted,
  onExtractingChange,
}: ResumeUploadZoneProps) {
  const [isParsing, setIsParsing] = useState(false);

  async function handleFile(
    file: File | undefined,
    input: HTMLInputElement,
  ) {
    if (!file || disabled || isParsing) {
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

  function createFileInputChangeHandler() {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      void handleFile(event.target.files?.[0], event.currentTarget);
    };
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled || isParsing}
        render={
          <Button type="button" variant="outline" size="sm" className="shrink-0" />
        }
      >
        {isParsing ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : null}
        {isParsing ? "解析中…" : label}
        {!isParsing ? <ChevronDown className="size-3.5 opacity-60" /> : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          className="p-0"
          render={<label className={menuLabelClassName} />}
        >
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={disabled || isParsing}
            onChange={createFileInputChangeHandler()}
          />
          <Images className="size-4" />
          照片图库
        </DropdownMenuItem>
        <DropdownMenuItem
          className="p-0"
          render={<label className={menuLabelClassName} />}
        >
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            disabled={disabled || isParsing}
            onChange={createFileInputChangeHandler()}
          />
          <Camera className="size-4" />
          拍照
        </DropdownMenuItem>
        <DropdownMenuItem
          className="p-0"
          render={<label className={menuLabelClassName} />}
        >
          <input
            type="file"
            accept={RESUME_DOCUMENT_ACCEPT}
            className="sr-only"
            disabled={disabled || isParsing}
            onChange={createFileInputChangeHandler()}
          />
          <FolderOpen className="size-4" />
          选取文件
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
