"use client";

import { Camera, ChevronDown, FolderOpen, Images, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { extractDocumentFromFile } from "@/lib/client/extract-document";
import {
  RESUME_DOCUMENT_ACCEPT,
} from "@/lib/resume/document-types";

interface ResumeUploadZoneProps {
  label: string;
  disabled?: boolean;
  onExtracted: (text: string) => void;
  onExtractingChange?: (isExtracting: boolean) => void;
}

/**
 * 简历/JD 上传按钮：下拉选择相册、拍照或文件。
 */
export function ResumeUploadZone({
  label,
  disabled = false,
  onExtracted,
  onExtractingChange,
}: ResumeUploadZoneProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleFile(file: File | undefined) {
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
    }
  }

  function resetInput(input: HTMLInputElement | null) {
    if (input) {
      input.value = "";
    }
  }

  return (
    <>
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || isParsing}
        onChange={(event) =>
          void handleFile(event.target.files?.[0]).finally(() => {
            resetInput(event.target);
          })
        }
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={disabled || isParsing}
        onChange={(event) =>
          void handleFile(event.target.files?.[0]).finally(() => {
            resetInput(event.target);
          })
        }
      />
      <input
        ref={fileInputRef}
        type="file"
        accept={RESUME_DOCUMENT_ACCEPT}
        className="hidden"
        disabled={disabled || isParsing}
        onChange={(event) =>
          void handleFile(event.target.files?.[0]).finally(() => {
            resetInput(event.target);
          })
        }
      />

      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
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
            onClick={() => {
              setMenuOpen(false);
              galleryInputRef.current?.click();
            }}
          >
            <Images className="size-4" />
            照片图库
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setMenuOpen(false);
              cameraInputRef.current?.click();
            }}
          >
            <Camera className="size-4" />
            拍照
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setMenuOpen(false);
              fileInputRef.current?.click();
            }}
          >
            <FolderOpen className="size-4" />
            选取文件
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
