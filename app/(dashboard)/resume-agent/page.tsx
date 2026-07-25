import { ResumeAgentExperience } from "@/components/resume-agent/ResumeAgentExperience";
import { PageShell } from "@/components/shared/PageShell";

export default function ResumeAgentPage() {
  return (
    <PageShell
      title="简历排雷"
      description="求职实战：粘贴或上传 JD 与简历，平台自动脱敏后由 DeepSeek 输出结构化排雷分析、Match 打分与改写建议。"
    >
      <ResumeAgentExperience />
    </PageShell>
  );
}
