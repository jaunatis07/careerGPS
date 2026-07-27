"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { syncSavedJobsWithServer } from "@/lib/client/saved-jobs";

interface ProfileDataSyncProps {
  /** 服务端已读到的收藏数量，用于触发同步后刷新 */
  serverSavedJobCount: number;
}

/**
 * 个人主页挂载时，将 localStorage 中的收藏与 Supabase 双向合并，并刷新服务端数据。
 */
export function ProfileDataSync({ serverSavedJobCount }: ProfileDataSyncProps) {
  const router = useRouter();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (syncedRef.current) {
      return;
    }

    syncedRef.current = true;

    void syncSavedJobsWithServer().then((didSync) => {
      if (didSync) {
        router.refresh();
      }
    });
  }, [router, serverSavedJobCount]);

  return null;
}
