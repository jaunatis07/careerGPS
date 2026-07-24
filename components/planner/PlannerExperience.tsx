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
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <PlannerProfilePanel profile={profile} />
      <PlannerChat
        key={initialSessionId ?? "new-session"}
        initialSessionId={initialSessionId}
        initialMessages={initialMessages}
      />
    </div>
  );
}
