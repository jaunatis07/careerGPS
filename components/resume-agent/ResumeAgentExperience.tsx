"use client";

import { useCompletion } from "@ai-sdk/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useQuota } from "@/components/providers/QuotaProvider";
import { ResumeAnalysisPanel } from "@/components/resume-agent/ResumeAnalysisPanel";
import { ResumeInputPanel } from "@/components/resume-agent/ResumeInputPanel";
import { Button } from "@/components/ui/button";
import type { CompanyRiskReport } from "@/lib/ai/prompts/resume-system-prompt";
import { fetchJsonWithToast } from "@/lib/client/quota-fetch";
import { CHAT_PANEL_HEIGHT_CLASS } from "@/lib/constants/layout";
import {
  extractCompanyName,
  shouldRunCompanyCheck,
} from "@/lib/resume/company-utils";
import { detectAnalysisMode } from "@/lib/resume/detect-analysis-mode";
import { cn } from "@/lib/utils";

type MobileTab = "input" | "result";

/**
 * 简历排雷 Agent 主体验：输入 → 脱敏预览 → 企业排雷 → 流式分析。
 */
export function ResumeAgentExperience() {
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [companyRisk, setCompanyRisk] = useState<CompanyRiskReport | null>(
    null,
  );
  const [mobileTab, setMobileTab] = useState<MobileTab>("input");
  const { assertQuotaAvailable, refreshQuota, quotaAwareFetch } = useQuota();

  const mode = useMemo(
    () => detectAnalysisMode(jdText, resumeText),
    [jdText, resumeText],
  );

  const { completion, complete, isLoading, error, stop, setCompletion } =
    useCompletion({
      api: "/api/resume-agent",
      fetch: quotaAwareFetch,
      onFinish: () => {
        void refreshQuota();
      },
      onError: (completionError) => {
        console.error("[CareerGPS][resume-agent] stream error", completionError);
        const message =
          completionError.message === "Load failed"
            ? "分析流式响应失败，请检查网络或稍后重试"
            : completionError.message;
        toast.error(message);
      },
    });

  useEffect(() => {
    const companyName = jdText.trim() ? extractCompanyName(jdText) : null;

    if (!companyName || !shouldRunCompanyCheck(companyName)) {
      setCompanyRisk(null);
      return;
    }

    let cancelled = false;

    void fetchJsonWithToast<{ report?: CompanyRiskReport | null }>(
      "/api/company-check",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName }),
      },
    )
      .then((data) => {
        if (!cancelled) {
          setCompanyRisk(data.report ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCompanyRisk(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [jdText]);

  useEffect(() => {
    if (isLoading || completion) {
      setMobileTab("result");
    }
  }, [isLoading, completion]);

  async function handleAnalyze() {
    if (!mode || isLoading || !assertQuotaAvailable()) {
      return;
    }

    setCompletion("");
    stop();

    try {
      await complete("", {
        body: {
          jdText,
          resumeText,
        },
      });
    } catch (analyzeError) {
      console.error("[CareerGPS][resume-agent] analyze request failed", {
        mode,
        jdLength: jdText.length,
        resumeLength: resumeText.length,
        error: analyzeError,
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 lg:hidden">
        <Button
          type="button"
          size="sm"
          variant={mobileTab === "input" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setMobileTab("input")}
        >
          输入内容
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mobileTab === "result" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setMobileTab("result")}
        >
          分析报告
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className={cn(mobileTab !== "input" && "hidden lg:block")}>
          <ResumeInputPanel
            jdText={jdText}
            resumeText={resumeText}
            onJdChange={setJdText}
            onResumeChange={setResumeText}
            onAnalyze={() => void handleAnalyze()}
            isAnalyzing={isLoading}
          />
        </div>
        <div
          className={cn(
            mobileTab !== "result" && "hidden lg:block",
            CHAT_PANEL_HEIGHT_CLASS,
            "min-h-0 lg:min-h-[420px]",
          )}
        >
          <ResumeAnalysisPanel
            mode={mode}
            companyRisk={companyRisk}
            completion={completion}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
