"use server";

import { revalidatePath } from "next/cache";

import { ensureUserProfile } from "@/lib/supabase/ensure-user-profile";
import { createClient } from "@/lib/supabase/server";

export interface SavePlannerProfileInput {
  gradeLevel?: string;
  targetRole?: string;
}

/**
 * 保存 Planner Agent 所需的用户年级与目标岗位到 user_profiles。
 */
export async function savePlannerProfile(input: SavePlannerProfileInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("请先登录");
  }

  await ensureUserProfile(user.id);

  const { error } = await supabase
    .from("user_profiles")
    .update({
      grade_level: input.gradeLevel?.trim() || null,
      target_role: input.targetRole?.trim() || null,
    })
    .eq("id", user.id);

  if (error) {
    throw new Error("保存规划档案失败，请稍后重试");
  }

  revalidatePath("/planner");
  revalidatePath("/profile");

  return { success: true };
}

/**
 * 创建新的 Planner 对话会话，用于「新对话」功能。
 */
export async function createPlannerSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("请先登录");
  }

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: user.id,
      agent_type: "planner",
      title: "生涯规划对话",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("创建新对话失败，请稍后重试");
  }

  revalidatePath("/planner");

  return { sessionId: data.id };
}
