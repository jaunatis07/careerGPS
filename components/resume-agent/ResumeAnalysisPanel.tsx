"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CompanyRiskReport } from "@/lib/ai/prompts/resume-system-prompt";
import {
  ANALYSIS_MODE_LABELS,
  type ResumeAnalysisMode,
} from "@/lib/resume/detect-analysis-mode";
import { cn } from "@/lib/utils";

interface ResumeAnalysisPanelProps {
  mode: ResumeAnalysisMode | null;
  companyRisk: CompanyRiskReport | null;
  completion: string;
  isLoading: boolean;
  error?: Error;
}

const RISK_VARIANT: Record<
  CompanyRiskReport["riskLevel"],
  "default" | "secondary" | "destructive"
> = {
  low: "secondary",
  medium: "destructive",
  high: "destructive",
};

/**
 * 流式分析报告展示区，含企业排雷摘要。
 */
export function ResumeAnalysisPanel({
  mode,
  companyRisk,
  completion,
  isLoading,
  error,
}: ResumeAnalysisPanelProps) {
  const hasOutput = Boolean(completion) || isLoading;

  return (
    <section className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-xl border bg-card sm:min-h-[420px]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold">分析报告</p>
          <p className="text-xs text-muted-foreground">
            {mode
              ? `当前：${ANALYSIS_MODE_LABELS[mode]}`
              : "完成输入后点击「开始排雷分析」"}
          </p>
        </div>
        {mode === "jd_and_resume" ? (
          <Badge variant="default">含 Match 打分</Badge>
        ) : null}
      </div>

      {companyRisk ? (
        <div
          className={cn(
            "mx-4 mt-4 rounded-lg border px-3 py-3 text-sm",
            companyRisk.riskLevel === "low"
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-amber-500/30 bg-amber-500/10",
          )}
        >
          <div className="mb-2 flex items-center gap-2 font-medium">
            {companyRisk.riskLevel === "low" ? (
              <ShieldCheck className="size-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="size-4 text-amber-600" />
            )}
            企业排雷 · {companyRisk.companyName}
            <Badge variant={RISK_VARIANT[companyRisk.riskLevel]}>
              {companyRisk.riskLevel}
            </Badge>
          </div>
          <p className="text-muted-foreground">{companyRisk.summary}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            {companyRisk.risks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <ScrollArea className="flex-1 px-4 py-4">
        {!hasOutput ? (
          <p className="text-sm text-muted-foreground">
            AI 将根据你提供的内容输出：JD 拆解 / 简历诊断 / 匹配打分与 Markdown
            改写建议。初创或未知公司会附带企业风险提醒。
          </p>
        ) : (
          <article className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
            {completion}
            {isLoading ? (
              <span className="inline-block animate-pulse text-muted-foreground">
                ▍
              </span>
            ) : null}
          </article>
        )}
      </ScrollArea>

      {error ? (
        <p className="border-t px-4 py-2 text-sm text-destructive">
          {error.message}
        </p>
      ) : null}
    </section>
  );
}
