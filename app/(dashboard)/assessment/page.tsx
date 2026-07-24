import { AssessmentExperience } from "@/components/assessment/AssessmentExperience";
import { PageShell } from "@/components/shared/PageShell";
import { createClient } from "@/lib/supabase/server";

export default async function AssessmentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("user_profiles")
        .select("mbti, holland, assessment_tags")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <PageShell
      title="自我探索"
      description="录入 MBTI / 霍兰德结果（可选），完成 12 道自研单选题，生成并同步你的职业性格标签。"
    >
      <AssessmentExperience initialProfile={profile} />
    </PageShell>
  );
}
