import { ExternalLink } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EXTERNAL_ASSESSMENT_LINKS } from "@/lib/constants/assessment-questions";

interface ProfileBasicsSectionProps {
  mbti: string;
  holland: string;
  onMbtiChange: (value: string) => void;
  onHollandChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * MBTI / 霍兰德手动录入区，附带免费外链测试入口。
 */
export function ProfileBasicsSection({
  mbti,
  holland,
  onMbtiChange,
  onHollandChange,
  disabled = false,
}: ProfileBasicsSectionProps) {
  return (
    <section className="rounded-xl border bg-card p-4 sm:p-6">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">标准测评（可选）</h2>
        <p className="text-sm text-muted-foreground">
          若已有 MBTI / 霍兰德结果可直接填入；也可跳过，仅完成下方 12 题自研测评。
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mbti">MBTI 类型</Label>
          <Input
            id="mbti"
            placeholder="如 INTJ、ENFP"
            value={mbti}
            maxLength={10}
            disabled={disabled}
            onChange={(event) => onMbtiChange(event.target.value)}
          />
          <a
            href={EXTERNAL_ASSESSMENT_LINKS.mbti.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {EXTERNAL_ASSESSMENT_LINKS.mbti.label}
            <ExternalLink className="size-3" />
          </a>
        </div>

        <div className="space-y-2">
          <Label htmlFor="holland">霍兰德代码</Label>
          <Input
            id="holland"
            placeholder="如 RIA、SEC"
            value={holland}
            maxLength={10}
            disabled={disabled}
            onChange={(event) => onHollandChange(event.target.value)}
          />
          <a
            href={EXTERNAL_ASSESSMENT_LINKS.holland.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {EXTERNAL_ASSESSMENT_LINKS.holland.label}
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    </section>
  );
}
