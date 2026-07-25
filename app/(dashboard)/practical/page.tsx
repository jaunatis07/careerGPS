import { ResumeAgentExperience } from "@/components/resume-agent/ResumeAgentExperience";
import { PageShell } from "@/components/shared/PageShell";

/**
 * 求职实战演练页（/practical），与 /resume-agent 共用同一套排雷分析能力。
 */
export default function PracticalPage() {
  return (
    <PageShell
      title="求职实战"
      description="输入岗位 JD 与个人简历，AI 将输出结构化排雷分析、匹配评估与 Markdown 改写建议。"
    >
      <ResumeAgentExperience />
    </PageShell>
  );
}
