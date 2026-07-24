import { createClient } from "@/lib/supabase/server";
import { getQuotaSummary } from "@/lib/quota/get-quota-summary";
import type { QuotaSummary } from "@/types";

/**
 * 读取当前登录用户在 user_profiles 中的每日额度摘要。
 */
export async function getCurrentUserQuota(): Promise<QuotaSummary> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return getQuotaSummary(null);
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("daily_quota_used, last_quota_reset")
    .eq("id", user.id)
    .maybeSingle();

  return getQuotaSummary(profile);
}
