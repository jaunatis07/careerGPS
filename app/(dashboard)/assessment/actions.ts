"use server";

import { revalidatePath } from "next/cache";

import {
  calculateAssessmentTags,
  isAssessmentComplete,
} from "@/lib/assessment/calculate-tags";
import { ensureUserProfile } from "@/lib/supabase/ensure-user-profile";
import { createClient } from "@/lib/supabase/server";

export interface SubmitAssessmentInput {
  mbti?: string;
  holland?: string;
  answers: Record<string, string>;
}

export interface SubmitAssessmentResult {
  tags: string[];
  mbti: string | null;
  holland: string | null;
}

/**
 * 提交测评结果：计算标签并写入 user_profiles 表。
 */
export async function submitAssessment(
  input: SubmitAssessmentInput,
): Promise<SubmitAssessmentResult> {
  if (!isAssessmentComplete(input.answers)) {
    throw new Error("请完成全部 12 道题目后再提交");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("请先登录后再提交测评");
  }

  const tags = calculateAssessmentTags(input.answers);
  const mbti = input.mbti?.trim().toUpperCase() || null;
  const holland = input.holland?.trim().toUpperCase() || null;

  await ensureUserProfile(user.id);

  const { error } = await supabase
    .from("user_profiles")
    .update({
      mbti,
      holland,
      assessment_tags: tags,
    })
    .eq("id", user.id);

  if (error) {
    throw new Error("测评结果保存失败，请稍后重试");
  }

  revalidatePath("/assessment");
  revalidatePath("/profile");
  revalidatePath("/planner");

  return { tags, mbti, holland };
}
