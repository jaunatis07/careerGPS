import { createClient } from "@/lib/supabase/server";

/**
 * 确保 user_profiles 行存在。老用户或 trigger 未执行时，update 会静默影响 0 行。
 */
export async function ensureUserProfile(userId: string): Promise<void> {
  const supabase = await createClient();
  const { data, error: selectError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (selectError) {
    throw new Error("读取用户档案失败，请稍后重试");
  }

  if (data) {
    return;
  }

  const { error: insertError } = await supabase
    .from("user_profiles")
    .insert({ id: userId });

  if (insertError) {
    throw new Error("创建用户档案失败，请稍后重试");
  }
}
