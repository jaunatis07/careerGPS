import { ResumeAgentExperience } from "@/components/resume-agent/ResumeAgentExperience";
import { PageShell } from "@/components/shared/PageShell";

export default function ResumeAgentPage() {
  return (
    <PageShell
      title="简历排雷"
      description="粘贴或上传 JD 与简历，平台自动脱敏后由 AI 进行匹配分析、风险排雷与改写建议。"
    >
      <ResumeAgentExperience />
    </PageShell>
  );
}
