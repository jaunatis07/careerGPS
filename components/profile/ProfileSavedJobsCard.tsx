import Link from "next/link";
import { Heart, MapPin } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SavedJob } from "@/lib/jobs/saved-jobs";

interface ProfileSavedJobsCardProps {
  jobs: SavedJob[];
}

export function ProfileSavedJobsCard({ jobs }: ProfileSavedJobsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Heart className="size-4" />
          我的收藏
        </CardTitle>
        <CardDescription>在岗位全景中收藏的末端岗位</CardDescription>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            还没有收藏岗位。
            <Link href="/mindmap" className="ml-1 text-primary underline-offset-4 hover:underline">
              去岗位全景看看
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {jobs.map((job) => (
              <li key={`${job.title}-${job.savedAt}`}>
                <Link
                  href={`/mindmap?job=${encodeURIComponent(job.title)}`}
                  className="flex items-start justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{job.title}</p>
                    {job.savedAt ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        收藏于 {formatSavedAt(job.savedAt)}
                      </p>
                    ) : null}
                  </div>
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function formatSavedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
