"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { JobInsight } from "@/types";

interface JobInsightPanelProps {
  jobTitle: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 请求岗位透视 API，并在半屏 Sheet 中展示结构化结果。
 */
export function JobInsightPanel({
  jobTitle,
  open,
  onOpenChange,
}: JobInsightPanelProps) {
  const [insight, setInsight] = useState<JobInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !jobTitle) {
      return;
    }

    const controller = new AbortController();

    const title = jobTitle;

    async function fetchInsight() {
      setIsLoading(true);
      setError(null);
      setInsight(null);

      try {
        const response = await fetch(
          `/api/job-insight?title=${encodeURIComponent(title)}`,
          { signal: controller.signal },
        );

        const data = (await response.json()) as JobInsight & { error?: string };

        if (!response.ok) {
          throw new Error(data.error ?? "获取岗位透视失败");
        }

        setInsight(data);
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "网络开小差了，请重试",
        );
        toast.error(
          fetchError instanceof Error
            ? fetchError.message
            : "网络开小差了，请重试",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void fetchInsight();

    return () => controller.abort();
  }, [open, jobTitle]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[min(92dvh,720px)] flex-col rounded-t-2xl pb-[env(safe-area-inset-bottom)] sm:mx-auto sm:max-w-3xl"
        showCloseButton
      >
        <SheetHeader className="shrink-0 border-b pb-4">
          <SheetTitle className="pr-8 text-base sm:text-lg">
            {jobTitle ?? "岗位透视"}
          </SheetTitle>
          <SheetDescription className="text-xs sm:text-sm">
            AI 实时生成的岗位基本信息（薪资、技能、内卷烈度与发展路径）
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 px-4 pb-6">
          {isLoading ? <JobInsightSkeleton /> : null}

          {!isLoading && error ? (
            <p className="py-8 text-center text-sm text-destructive">{error}</p>
          ) : null}

          {!isLoading && insight ? (
            <div className="space-y-6 py-4">
              <section className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  岗位摘要
                </h3>
                <p className="text-sm leading-relaxed">{insight.summary}</p>
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                <InsightField label="薪资区间" value={insight.salaryRange} />
                <InsightField label="学历要求" value={insight.education} />
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    内卷烈度
                  </h3>
                  <IntensityBadge
                    level={insight.intensity}
                    score={insight.intensityScore}
                  />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${insight.intensityScore * 10}%` }}
                  />
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  硬核技能
                </h3>
                <div className="flex flex-wrap gap-2">
                  {insight.hardSkills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  发展路径
                </h3>
                <ul className="space-y-2 text-sm">
                  {insight.careerPath.map((path) => (
                    <li
                      key={path}
                      className="rounded-lg border bg-muted/30 px-3 py-2"
                    >
                      {path}
                    </li>
                  ))}
                </ul>
              </section>

              <p className="text-xs text-muted-foreground">
                数据更新：{insight.updatedAt} · 阶段四将接入 DeepSeek 实时生成
              </p>
            </div>
          ) : null}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function InsightField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function IntensityBadge({
  level,
  score,
}: {
  level: JobInsight["intensity"];
  score: number;
}) {
  const variant =
    score >= 8 ? "destructive" : score >= 6 ? "default" : "secondary";

  return (
    <Badge variant={variant}>
      {level} · {score}/10
    </Badge>
  );
}

function JobInsightSkeleton() {
  return (
    <div className="space-y-4 py-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}
