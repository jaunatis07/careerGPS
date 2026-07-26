import { createClient } from "@/lib/supabase/server";

export interface SavedJob {
  title: string;
  savedAt: string;
}

function parseSavedJobs(raw: unknown): SavedJob[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => {
      if (typeof item === "string" && item.trim()) {
        return { title: item.trim(), savedAt: "" };
      }

      if (
        item &&
        typeof item === "object" &&
        "title" in item &&
        typeof (item as SavedJob).title === "string"
      ) {
        const record = item as SavedJob;
        return {
          title: record.title.trim(),
          savedAt: record.savedAt ?? "",
        };
      }

      return null;
    })
    .filter((item): item is SavedJob => Boolean(item?.title));
}

/**
 * 读取用户收藏的岗位列表。
 */
export async function getSavedJobs(userId: string): Promise<SavedJob[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("saved_jobs")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("读取收藏岗位失败，请稍后重试");
  }

  return parseSavedJobs(data?.saved_jobs).sort((a, b) =>
    b.savedAt.localeCompare(a.savedAt),
  );
}

/**
 * 切换岗位收藏状态，返回最新列表与是否已收藏。
 */
export async function toggleSavedJob(
  userId: string,
  title: string,
): Promise<{ saved: boolean; jobs: SavedJob[] }> {
  const normalizedTitle = title.trim();

  if (!normalizedTitle) {
    throw new Error("无效的岗位名称");
  }

  const current = await getSavedJobs(userId);
  const exists = current.some((job) => job.title === normalizedTitle);

  const nextJobs = exists
    ? current.filter((job) => job.title !== normalizedTitle)
    : [
        { title: normalizedTitle, savedAt: new Date().toISOString() },
        ...current,
      ];

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_profiles")
    .update({ saved_jobs: nextJobs })
    .eq("id", userId);

  if (error) {
    throw new Error("保存收藏失败，请确认已执行 docs/sql/003_profile_saved_jobs.sql");
  }

  return { saved: !exists, jobs: nextJobs };
}

export function isJobSaved(jobs: SavedJob[], title: string) {
  return jobs.some((job) => job.title === title.trim());
}
