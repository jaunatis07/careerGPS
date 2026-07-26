import {
  getLocalSavedJobs,
  toggleLocalSavedJob,
} from "@/lib/jobs/saved-jobs-local";
import type { SavedJob } from "@/lib/jobs/saved-jobs";

export async function fetchSavedJobs(): Promise<SavedJob[]> {
  try {
    const response = await fetch("/api/saved-jobs");

    if (!response.ok) {
      return getLocalSavedJobs();
    }

    const data = (await response.json()) as { jobs?: SavedJob[] };
    return data.jobs ?? [];
  } catch {
    return getLocalSavedJobs();
  }
}

export async function toggleSavedJob(title: string): Promise<{
  saved: boolean;
  jobs: SavedJob[];
}> {
  try {
    const response = await fetch("/api/saved-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    const data = (await response.json()) as {
      saved?: boolean;
      jobs?: SavedJob[];
      error?: string;
    };

    if (!response.ok) {
      throw new Error(data.error ?? "保存收藏失败");
    }

    return {
      saved: Boolean(data.saved),
      jobs: data.jobs ?? [],
    };
  } catch {
    return toggleLocalSavedJob(title);
  }
}
