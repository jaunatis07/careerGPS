import { Suspense } from "react";

import { MindmapExperience } from "@/components/mindmap/MindmapExperience";
import { PageShell } from "@/components/shared/PageShell";

function MindmapFallback() {
  return (
    <div className="rounded-xl border bg-muted/20 px-4 py-16 text-center text-sm text-muted-foreground">
      岗位全景加载中…
    </div>
  );
}

export default function MindmapPage() {
  return (
    <PageShell
      title="岗位全景"
      description="从「市场化 vs 非市场化」两大路径出发，探索细分岗位。点击末端岗位节点，查看 AI 生成的岗位透视信息。"
    >
      <Suspense fallback={<MindmapFallback />}>
        <MindmapExperience />
      </Suspense>
    </PageShell>
  );
}
