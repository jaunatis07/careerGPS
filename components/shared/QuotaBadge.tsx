import { Badge } from "@/components/ui/badge";
import type { QuotaSummary } from "@/types";

interface QuotaBadgeProps {
  quota: QuotaSummary;
}

/**
 * 展示用户当日剩余 AI Agent 免费调用额度。
 */
export function QuotaBadge({ quota }: QuotaBadgeProps) {
  const isExhausted = quota.remaining <= 0;
  const isLow = !isExhausted && quota.remaining <= 2;

  return (
    <Badge
      variant={isExhausted ? "destructive" : isLow ? "destructive" : "secondary"}
      className="whitespace-nowrap text-[10px] sm:text-xs"
    >
      <span className="sm:hidden">
        {isExhausted ? "额度用尽" : `${quota.remaining}/${quota.limit}`}
      </span>
      <span className="hidden sm:inline">
        {isExhausted
          ? "今日额度已用尽"
          : `今日剩余 ${quota.remaining}/${quota.limit} 次`}
      </span>
    </Badge>
  );
}
