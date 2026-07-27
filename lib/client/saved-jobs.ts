import {
  getLocalSavedJobs,
  setLocalSavedJobs,
} from "@/lib/jobs/saved-jobs-local";
import type { SavedJob } from "@/lib/jobs/saved-jobs";

export async function fetchSavedJobs(): Promise<SavedJob[]> {
  const response = await fetch("/api/saved-jobs");

  if (!response.ok) {
    return getLocalSavedJobs();
  }

  const data = (await response.json()) as { jobs?: SavedJob[] };
  const jobs = data.jobs ?? [];
  setLocalSavedJobs(jobs);
  return jobs;
}

export async function toggleSavedJob(title: string): Promise<{
  saved: boolean;
  jobs: SavedJob[];
}> {
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

  const jobs = data.jobs ?? [];
  setLocalSavedJobs(jobs);

  return {
    saved: Boolean(data.saved),
    jobs,
  };
}

/**
 * 将 localStorage 中尚未写入 Supabase 的收藏合并到服务端。
 * 返回 true 表示发生了合并，调用方应 refresh 个人主页。
 */
export async function syncSavedJobsWithServer(): Promise<boolean> {
  const localJobs = getLocalSavedJobs();

  try {
    const response = await fetch("/api/saved-jobs");

    if (!response.ok) {
      if (localJobs.length === 0) {
        return false;
      }

      const syncResponse = await fetch("/api/saved-jobs/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobs: localJobs }),
      });

      if (!syncResponse.ok) {
        return false;
      }

      const syncData = (await syncResponse.json()) as { jobs?: SavedJob[] };
      setLocalSavedJobs(syncData.jobs ?? localJobs);
      return true;
    }

    const data = (await response.json()) as { jobs?: SavedJob[] };
    const serverJobs = data.jobs ?? [];
    setLocalSavedJobs(serverJobs);

    const missingOnServer = localJobs.filter(
      (job) => !serverJobs.some((serverJob) => serverJob.title === job.title),
    );

    if (missingOnServer.length === 0) {
      return false;
    }

    const syncResponse = await fetch("/api/saved-jobs/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobs: missingOnServer }),
    });

    if (!syncResponse.ok) {
      return false;
    }

    const syncData = (await syncResponse.json()) as { jobs?: SavedJob[] };
    setLocalSavedJobs(syncData.jobs ?? serverJobs);
    return true;
  } catch {
    if (localJobs.length === 0) {
      return false;
    }

    try {
      const syncResponse = await fetch("/api/saved-jobs/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobs: localJobs }),
      });

      if (!syncResponse.ok) {
        return false;
      }

      const syncData = (await syncResponse.json()) as { jobs?: SavedJob[] };
      setLocalSavedJobs(syncData.jobs ?? localJobs);
      return true;
    } catch {
      return false;
    }
  }
}
