"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  fetchSavedJobs,
  toggleSavedJob,
} from "@/lib/client/saved-jobs";
import { cn } from "@/lib/utils";

interface JobFavoriteButtonProps {
  jobTitle: string | null;
  className?: string;
}

/**
 * 岗位收藏/取消收藏按钮。
 */
export function JobFavoriteButton({
  jobTitle,
  className,
}: JobFavoriteButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!jobTitle) {
      setIsSaved(false);
      setIsReady(false);
      return;
    }

    let cancelled = false;

    void fetchSavedJobs()
      .then((jobs) => {
        if (!cancelled) {
          setIsSaved(jobs.some((job) => job.title === jobTitle));
          setIsReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [jobTitle]);

  async function handleToggle() {
    if (!jobTitle || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await toggleSavedJob(jobTitle);
      setIsSaved(result.saved);
      toast.success(result.saved ? "已加入收藏" : "已取消收藏");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "收藏操作失败，请稍后重试",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (!jobTitle) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!isReady || isLoading}
      onClick={() => void handleToggle()}
      className={cn("gap-1.5", className)}
    >
      <Heart
        className={cn("size-4", isSaved && "fill-primary text-primary")}
      />
      {isSaved ? "已收藏" : "收藏岗位"}
    </Button>
  );
}
