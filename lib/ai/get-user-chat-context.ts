import { createClient } from "@/lib/supabase/server";
import type { UserChatContext } from "@/lib/ai/system-prompts";

/**
 * 读取用户 profile 中的 Planner 上下文（年级、目标岗位、测评标签等）。
 */
export async function getUserChatContext(
  userId: string,
): Promise<UserChatContext | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_profiles")
    .select(
      "grade_level, target_role, mbti, holland, assessment_tags",
    )
    .eq("id", userId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    grade_level: data.grade_level ?? null,
    target_role: data.target_role ?? null,
    mbti: data.mbti,
    holland: data.holland,
    assessment_tags: Array.isArray(data.assessment_tags)
      ? (data.assessment_tags as string[])
      : null,
  };
}
