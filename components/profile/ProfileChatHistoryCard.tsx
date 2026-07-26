import Link from "next/link";
import { MessageSquareText } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PlannerSessionSummary } from "@/lib/chat/session-manager";

interface ProfileChatHistoryCardProps {
  sessions: PlannerSessionSummary[];
}

export function ProfileChatHistoryCard({
  sessions,
}: ProfileChatHistoryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquareText className="size-4" />
          对话历史
        </CardTitle>
        <CardDescription>生涯规划 Agent 的历史会话，点击可继续查看</CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            还没有对话记录。
            <Link href="/planner" className="ml-1 text-primary underline-offset-4 hover:underline">
              去生涯规划聊聊
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {sessions.map((session) => (
              <li key={session.id}>
                <Link
                  href={`/planner?session=${session.id}`}
                  className="block rounded-lg border bg-muted/20 px-3 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-2 text-sm font-medium">
                      {truncatePreview(session.preview)}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {session.messageCount} 条
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatSessionTime(session.created_at)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function truncatePreview(text: string, maxLength = 72) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}…`;
}

function formatSessionTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
