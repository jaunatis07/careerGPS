import {
  DAILY_QUOTA_LIMIT,
  QUOTA_ENFORCEMENT_ENABLED,
} from "@/lib/constants/quota";
import { getQuotaSummary } from "@/lib/quota/get-quota-summary";
import { QuotaExceededError } from "@/lib/quota/quota-errors";
import { createClient } from "@/lib/supabase/server";

function unlimitedQuotaSummary() {
  return {
    limit: DAILY_QUOTA_LIMIT,
    used: 0,
    remaining: DAILY_QUOTA_LIMIT,
  };
}

/**
 * 校验用户是否仍有可用 AI 额度；不足时抛出 QuotaExceededError。
 */
export async function assertQuotaAvailable(userId: string) {
  if (!QUOTA_ENFORCEMENT_ENABLED) {
    return;
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("daily_quota_used, last_quota_reset")
    .eq("id", userId)
    .maybeSingle();

  const summary = getQuotaSummary(profile);

  if (summary.remaining <= 0) {
    throw new QuotaExceededError();
  }
}

/**
 * 成功完成一次 AI 对话后扣减 daily_quota_used；跨天自动重置计数。
 */
export async function consumeUserQuota(userId: string) {
  if (!QUOTA_ENFORCEMENT_ENABLED) {
    return unlimitedQuotaSummary();
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("daily_quota_used, last_quota_reset")
    .eq("id", userId)
    .maybeSingle();

  const summary = getQuotaSummary(profile);

  if (summary.remaining <= 0) {
    throw new QuotaExceededError();
  }

  const isSameDay =
    profile &&
    new Date(profile.last_quota_reset).toDateString() ===
      new Date().toDateString();

  const nextUsed = isSameDay ? (profile?.daily_quota_used ?? 0) + 1 : 1;

  const { error } = await supabase
    .from("user_profiles")
    .update({
      daily_quota_used: nextUsed,
      last_quota_reset: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw new Error("额度扣减失败，请稍后重试");
  }

  return {
    limit: DAILY_QUOTA_LIMIT,
    used: nextUsed,
    remaining: Math.max(0, DAILY_QUOTA_LIMIT - nextUsed),
  };
}
