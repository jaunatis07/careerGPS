"use client";

import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  QUOTA_EXHAUSTED_DIALOG,
} from "@/lib/constants/quota-messages";
import type { QuotaSummary } from "@/types";

interface QuotaExhaustedDialogProps {
  open: boolean;
  quota: QuotaSummary;
  onOpenChange: (open: boolean) => void;
}

/**
 * 额度耗尽时的居中弹窗，提示用户明日刷新。
 */
export function QuotaExhaustedDialog({
  open,
  quota,
  onOpenChange,
}: QuotaExhaustedDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quota-exhausted-title"
    >
      <div className="w-full max-w-md rounded-t-2xl border bg-card p-6 shadow-lg sm:rounded-xl">
        <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Clock className="size-5" />
        </div>
        <h2 id="quota-exhausted-title" className="text-lg font-semibold">
          {QUOTA_EXHAUSTED_DIALOG.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {QUOTA_EXHAUSTED_DIALOG.description}
        </p>
        <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-sm">
          今日已用 {quota.used}/{quota.limit} 次 · 剩余 {quota.remaining} 次
        </p>
        <div className="mt-6 flex justify-end pb-[env(safe-area-inset-bottom)] sm:pb-0">
          <Button type="button" onClick={() => onOpenChange(false)}>
            {QUOTA_EXHAUSTED_DIALOG.confirm}
          </Button>
        </div>
      </div>
    </div>
  );
}
