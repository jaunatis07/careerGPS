"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { AppToaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/shared/Navbar";
import { QuotaExhaustedDialog } from "@/components/shared/QuotaExhaustedDialog";
import { createQuotaAwareFetch } from "@/lib/client/quota-fetch";
import { QUOTA_ENFORCEMENT_ENABLED } from "@/lib/constants/quota";
import type { QuotaSummary } from "@/types";

interface QuotaContextValue {
  quota: QuotaSummary;
  assertQuotaAvailable: () => boolean;
  markQuotaConsumed: () => void;
  refreshQuota: () => Promise<void>;
  showQuotaExhausted: () => void;
  quotaAwareFetch: typeof fetch;
}

const QuotaContext = createContext<QuotaContextValue | null>(null);

interface QuotaProviderProps {
  email: string;
  initialQuota: QuotaSummary;
  children: ReactNode;
}

/**
 * 全局额度 Context：客户端预检、429 弹窗、额度徽章同步。
 */
export function QuotaProvider({
  email,
  initialQuota,
  children,
}: QuotaProviderProps) {
  const [quota, setQuota] = useState(initialQuota);
  const [exhaustedOpen, setExhaustedOpen] = useState(false);

  const showQuotaExhausted = useCallback(() => {
    setExhaustedOpen(true);
  }, []);

  const assertQuotaAvailable = useCallback(() => {
    if (!QUOTA_ENFORCEMENT_ENABLED) {
      return true;
    }

    if (quota.remaining <= 0) {
      showQuotaExhausted();
      return false;
    }

    return true;
  }, [quota.remaining, showQuotaExhausted]);

  const markQuotaConsumed = useCallback(() => {
    setQuota((current) => ({
      limit: current.limit,
      used: Math.min(current.limit, current.used + 1),
      remaining: Math.max(0, current.remaining - 1),
    }));
  }, []);

  const refreshQuota = useCallback(async () => {
    try {
      const response = await fetch("/api/quota");

      if (!response.ok) {
        return;
      }

      const nextQuota = (await response.json()) as QuotaSummary;
      setQuota(nextQuota);
    } catch {
      // 静默失败，不影响主流程
    }
  }, []);

  const quotaAwareFetch = useMemo(
    () => createQuotaAwareFetch({ onQuotaExceeded: showQuotaExhausted }),
    [showQuotaExhausted],
  );

  const value = useMemo(
    () => ({
      quota,
      assertQuotaAvailable,
      markQuotaConsumed,
      refreshQuota,
      showQuotaExhausted,
      quotaAwareFetch,
    }),
    [
      quota,
      assertQuotaAvailable,
      markQuotaConsumed,
      refreshQuota,
      showQuotaExhausted,
      quotaAwareFetch,
    ],
  );

  return (
    <QuotaContext.Provider value={value}>
      <Navbar email={email} quota={quota} />
      {children}
      <QuotaExhaustedDialog
        open={QUOTA_ENFORCEMENT_ENABLED && exhaustedOpen}
        quota={quota}
        onOpenChange={setExhaustedOpen}
      />
      <AppToaster />
    </QuotaContext.Provider>
  );
}

export function useQuota() {
  const context = useContext(QuotaContext);

  if (!context) {
    throw new Error("useQuota 必须在 QuotaProvider 内使用");
  }

  return context;
}
