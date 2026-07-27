import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileChatHistoryCard } from "@/components/profile/ProfileChatHistoryCard";
import { ProfileDataSync } from "@/components/profile/ProfileDataSync";
import { ProfileSavedJobsCard } from "@/components/profile/ProfileSavedJobsCard";
import { ProfileSignOutButton } from "@/components/profile/ProfileSignOutButton";
import { QuotaBadge } from "@/components/shared/QuotaBadge";
import { PageShell } from "@/components/shared/PageShell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listPlannerSessionsForProfile } from "@/lib/chat/session-manager";
import {
  getUserAvatarInitial,
  getUserDisplayName,
} from "@/lib/auth/user-display";
import { QUOTA_ENFORCEMENT_ENABLED } from "@/lib/constants/quota";
import { getSavedJobs } from "@/lib/jobs/saved-jobs";
import { getCurrentUserQuota } from "@/lib/quota/get-current-user-quota";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName = getUserDisplayName(user);
  const quota = await getCurrentUserQuota();

  const [{ data: profileRow }, savedJobs, plannerSessions] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("grade_level, target_role, mbti, holland, saved_jobs")
      .eq("id", user.id)
      .maybeSingle(),
    getSavedJobs(user.id).catch(() => []),
    listPlannerSessionsForProfile(user.id).catch(() => []),
  ]);

  return (
    <PageShell
      title="个人主页"
      description="查看账号信息、收藏岗位与生涯规划对话历史。"
    >
      <ProfileDataSync serverSavedJobCount={savedJobs.length} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,280px)_minmax(0,1fr)] xl:gap-6">
        <Card>
          <CardHeader className="items-center text-center">
            <Avatar size="lg">
              <AvatarFallback className="text-lg">
                {getUserAvatarInitial(user)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-base">{displayName}</CardTitle>
            <CardDescription>CareerGPS 账号</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            {QUOTA_ENFORCEMENT_ENABLED ? <QuotaBadge quota={quota} /> : null}
            <ProfileSignOutButton />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">生涯档案</CardTitle>
              <CardDescription>来自测评与 Planner 的基础信息</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <ProfileField label="年级" value={profileRow?.grade_level} />
              <ProfileField label="目标岗位" value={profileRow?.target_role} />
              <ProfileField label="MBTI" value={profileRow?.mbti} />
              <ProfileField label="霍兰德" value={profileRow?.holland} />
            </CardContent>
          </Card>

          <ProfileSavedJobsCard jobs={savedJobs} />
          <ProfileChatHistoryCard sessions={plannerSessions} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">快捷入口</CardTitle>
              <CardDescription>继续你的职业探索旅程</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button render={<Link href="/mindmap" />} variant="outline" size="sm">
                岗位全景
              </Button>
              <Button render={<Link href="/assessment" />} variant="outline" size="sm">
                自我探索
              </Button>
              <Button render={<Link href="/planner" />} variant="outline" size="sm">
                生涯规划
              </Button>
              <Button render={<Link href="/resume-agent" />} variant="outline" size="sm">
                简历排雷
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value?.trim() || "未填写"}</p>
    </div>
  );
}
