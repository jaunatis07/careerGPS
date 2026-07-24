import { PlannerExperience } from "@/components/planner/PlannerExperience";
import { PageShell } from "@/components/shared/PageShell";
import type { PlannerProfile } from "@/lib/constants/planner";
import {
  getLatestChatSession,
  loadChatMessages,
  toUIMessages,
} from "@/lib/chat/session-manager";
import { createClient } from "@/lib/supabase/server";

export default async function PlannerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileRow } = user
    ? await supabase
        .from("user_profiles")
        .select(
          "grade_level, target_role, mbti, holland, assessment_tags",
        )
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const profile: PlannerProfile = {
    grade_level: profileRow?.grade_level ?? null,
    target_role: profileRow?.target_role ?? null,
    mbti: profileRow?.mbti ?? null,
    holland: profileRow?.holland ?? null,
    assessment_tags: Array.isArray(profileRow?.assessment_tags)
      ? (profileRow.assessment_tags as string[])
      : [],
  };

  const latestSession = user
    ? await getLatestChatSession(user.id, "planner")
    : null;

  const storedMessages = latestSession
    ? await loadChatMessages(latestSession.id)
    : [];

  return (
    <PageShell
      title="生涯规划"
      description="与 AI 生涯规划 Agent 对话。系统会自动读取你的年级、目标岗位与测评标签，生成可执行的分阶段成长计划。"
    >
      <PlannerExperience
        profile={profile}
        initialSessionId={latestSession?.id ?? null}
        initialMessages={toUIMessages(storedMessages)}
      />
    </PageShell>
  );
}
