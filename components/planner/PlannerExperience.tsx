"use client";

import type { UIMessage } from "ai";

import { PlannerChat } from "@/components/planner/PlannerChat";
import { PlannerProfilePanel } from "@/components/planner/PlannerProfilePanel";
import type { PlannerProfile } from "@/lib/constants/planner";

interface PlannerExperienceProps {
  profile: PlannerProfile;
  initialSessionId?: string | null;
  initialMessages?: UIMessage[];
}

/**
 * Planner 页面客户端容器：左侧档案/标签，右侧专属 Agent 对话。
 */
export function PlannerExperience({
  profile,
  initialSessionId,
  initialMessages = [],
}: PlannerExperienceProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6">
      <div className="order-2 lg:order-1">
        <PlannerProfilePanel profile={profile} />
      </div>
      <div className="order-1 flex min-h-0 min-w-0 flex-col lg:order-2">
        <PlannerChat
          key={initialSessionId ?? "new-session"}
          initialSessionId={initialSessionId}
          initialMessages={initialMessages}
        />
      </div>
    </div>
  );
}
