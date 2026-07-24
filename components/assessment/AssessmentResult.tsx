import { Badge } from "@/components/ui/badge";

interface AssessmentResultProps {
  tags: string[];
  mbti?: string | null;
  holland?: string | null;
}

/**
 * 测评完成后的标签可视化展示。
 */
export function AssessmentResult({
  tags,
  mbti,
  holland,
}: AssessmentResultProps) {
  return (
    <section className="rounded-xl border bg-card p-4 sm:p-6">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">你的职业性格标签</h2>
        <p className="text-sm text-muted-foreground">
          以下标签已同步至个人档案，后续 AI Agent 将据此提供个性化建议。
        </p>
      </div>

      {(mbti || holland) && (
        <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
          {mbti ? <span>MBTI：{mbti}</span> : null}
          {holland ? <span>霍兰德：{holland}</span> : null}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} className="px-3 py-1 text-sm">
            [{tag}]
          </Badge>
        ))}
      </div>
    </section>
  );
}
