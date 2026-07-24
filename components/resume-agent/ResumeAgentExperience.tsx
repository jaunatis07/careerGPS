"use client";

import { useCompletion } from "@ai-sdk/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useQuota } from "@/components/providers/QuotaProvider";
import { ResumeAnalysisPanel } from "@/components/resume-agent/ResumeAnalysisPanel";
import { ResumeInputPanel } from "@/components/resume-agent/ResumeInputPanel";
import type { CompanyRiskReport } from "@/lib/ai/prompts/resume-system-prompt";
import { fetchJsonWithToast } from "@/lib/client/quota-fetch";
import {
  extractCompanyName,
  shouldRunCompanyCheck,
} from "@/lib/resume/company-utils";
import { detectAnalysisMode } from "@/lib/resume/detect-analysis-mode";

/**
 * 简历排雷 Agent 主体验：输入 → 脱敏预览 → 企业排雷 → 流式分析。
 */
export function ResumeAgentExperience() {
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [companyRisk, setCompanyRisk] = useState<CompanyRiskReport | null>(
    null,
  );
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
        toast.error(completionError.message);
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

  async function handleAnalyze() {
    if (!mode || isLoading || !assertQuotaAvailable()) {
      return;
    }

    setCompletion("");
    stop();

    await complete("", {
      body: {
        jdText,
        resumeText,
      },
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <ResumeInputPanel
        jdText={jdText}
        resumeText={resumeText}
        onJdChange={setJdText}
        onResumeChange={setResumeText}
        onAnalyze={() => void handleAnalyze()}
        isAnalyzing={isLoading}
      />
      <ResumeAnalysisPanel
        mode={mode}
        companyRisk={companyRisk}
        completion={completion}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
