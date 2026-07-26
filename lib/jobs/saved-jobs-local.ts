import type { SavedJob } from "@/lib/jobs/saved-jobs";

const STORAGE_KEY = "careergps-saved-jobs";

function parseSavedJobs(raw: string | null): SavedJob[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
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
          return {
            title: (item as SavedJob).title.trim(),
            savedAt: (item as SavedJob).savedAt ?? "",
          };
        }

        return null;
      })
      .filter((item): item is SavedJob => Boolean(item?.title));
  } catch {
    return [];
  }
}

export function getLocalSavedJobs(): SavedJob[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseSavedJobs(window.localStorage.getItem(STORAGE_KEY));
}

export function setLocalSavedJobs(jobs: SavedJob[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

export function toggleLocalSavedJob(title: string) {
  const normalizedTitle = title.trim();
  const current = getLocalSavedJobs();
  const exists = current.some((job) => job.title === normalizedTitle);

  const nextJobs = exists
    ? current.filter((job) => job.title !== normalizedTitle)
    : [
        { title: normalizedTitle, savedAt: new Date().toISOString() },
        ...current,
      ];

  setLocalSavedJobs(nextJobs);

  return { saved: !exists, jobs: nextJobs };
}
