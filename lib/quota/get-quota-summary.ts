import {
  DAILY_QUOTA_LIMIT,
  QUOTA_ENFORCEMENT_ENABLED,
} from "@/lib/constants/quota";
import type { QuotaSummary, UserProfileQuota } from "@/types";

/**
 * 根据 user_profiles 中的额度字段，计算当日已用次数与剩余额度。
 * 若 last_quota_reset 不是今天，则视为已跨天重置。
 */
export function getQuotaSummary(profile: UserProfileQuota | null): QuotaSummary {
  if (!QUOTA_ENFORCEMENT_ENABLED) {
    return {
      limit: DAILY_QUOTA_LIMIT,
      used: 0,
      remaining: DAILY_QUOTA_LIMIT,
    };
  }

  const limit = DAILY_QUOTA_LIMIT;

  if (!profile) {
    return { limit, used: 0, remaining: limit };
  }

  const isSameDay =
    new Date(profile.last_quota_reset).toDateString() ===
    new Date().toDateString();
  const used = isSameDay ? profile.daily_quota_used : 0;
  const remaining = Math.max(0, limit - used);

  return { limit, used, remaining };
}
