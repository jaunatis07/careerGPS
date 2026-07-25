"use client";

import { Compass, Map } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useQuota } from "@/components/providers/QuotaProvider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CareerSuggestionCardProps {
  tags: string[];
  mbti?: string | null;
  holland?: string | null;
}

/**
 * 基于测评标签的 AI 职业选择建议卡片。
 */
export function CareerSuggestionCard({
  tags,
  mbti,
  holland,
}: CareerSuggestionCardProps) {
  const { quotaAwareFetch, refreshQuota, showQuotaExhausted } = useQuota();
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestion = useCallback(async () => {
    if (tags.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await quotaAwareFetch("/api/career-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mbti, holland, tags }),
      });

      const data = (await response.json()) as {
        suggestion?: string;
        error?: string;
      };

      if (!response.ok) {
        if (response.status === 429) {
          showQuotaExhausted();
        }

        throw new Error(data.error ?? "职业建议生成失败");
      }

      setSuggestion(data.suggestion ?? null);
      void refreshQuota();
    } catch (fetchError) {
      setSuggestion(null);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "职业建议生成失败，请稍后重试",
      );
    } finally {
      setIsLoading(false);
    }
  }, [tags, mbti, holland, quotaAwareFetch, refreshQuota, showQuotaExhausted]);

  useEffect(() => {
    void fetchSuggestion();
  }, [fetchSuggestion]);

  return (
    <section className="rounded-xl border bg-card p-4 sm:p-6">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">职业选择建议</h2>
        <p className="text-sm text-muted-foreground">
          基于你的 MBTI、霍兰德代码与性格标签，AI 为你梳理适配方向
        </p>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[92%]" />
            <Skeleton className="h-4 w-[85%]" />
            <Skeleton className="h-4 w-[78%]" />
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={fetchSuggestion}>
              重新生成
            </Button>
          </div>
        ) : null}

        {!isLoading && suggestion ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
            {suggestion}
          </p>
        ) : null}
      </div>

      <div
        className={cn(
          "mt-5 flex flex-col gap-2 sm:flex-row",
          isLoading && "pointer-events-none opacity-60",
        )}
      >
        <Button render={<Link href="/planner" />} className="flex-1 sm:flex-none">
          <Compass className="size-4" />
          前往 AI 生涯导师
        </Button>
        <Button
          render={<Link href="/mindmap" />}
          variant="outline"
          className="flex-1 sm:flex-none"
        >
          <Map className="size-4" />
          探索岗位数据库
        </Button>
      </div>
    </section>
  );
}
