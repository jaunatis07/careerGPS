"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { createPlannerSession } from "@/app/(dashboard)/planner/actions";
import { useQuota } from "@/components/providers/QuotaProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  createChatTransport,
  submitChatMessage,
} from "@/lib/client/chat-transport";
import { PLANNER_QUICK_PROMPTS } from "@/lib/ai/prompts/planner-system-prompt";
import { CHAT_FORM_CLASS, CHAT_MESSAGE_SCROLL_CLASS, CHAT_PANEL_HEIGHT_CLASS } from "@/lib/constants/layout";
import { cn } from "@/lib/utils";

interface PlannerChatProps {
  initialSessionId?: string | null;
  initialMessages?: UIMessage[];
}

/**
 * 生涯规划 Agent 专属对话区：流式回复、快捷提问与新对话。
 */
export function PlannerChat({
  initialSessionId = null,
  initialMessages = [],
}: PlannerChatProps) {
  const router = useRouter();
  const { assertQuotaAvailable, refreshQuota, quotaAwareFetch } = useQuota();
  const [input, setInput] = useState("");
  const sessionIdRef = useRef<string | null>(initialSessionId);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [isCreatingSession, startCreateSession] = useTransition();

  const transport = useMemo(
    () =>
      createChatTransport({
        agentType: "planner",
        getSessionId: () => sessionIdRef.current,
        onSessionId: (nextSessionId) => {
          sessionIdRef.current = nextSessionId;
          setSessionId(nextSessionId);
        },
        quotaAwareFetch,
      }),
    [quotaAwareFetch],
  );

  const { messages, sendMessage, status, error, stop, setMessages } = useChat({
    id: `planner-${initialSessionId ?? "new"}`,
    messages: initialMessages,
    transport,
    onFinish: () => {
      void refreshQuota();
    },
    onError: (chatError) => {
      console.error("[CareerGPS][Chat] useChat onError", {
        agentType: "planner",
        message: chatError.message,
        error: chatError,
      });
      toast.error(chatError.message || "发送失败，请稍后重试");
    },
  });

  useEffect(() => {
    sessionIdRef.current = initialSessionId;
    setSessionId(initialSessionId);
  }, [initialSessionId]);

  const isGenerating = status === "submitted" || status === "streaming";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitText(input);
  }

  async function submitText(text: string) {
    try {
      await submitChatMessage({
        text,
        agentType: "planner",
        isGenerating,
        assertQuotaAvailable,
        sendMessage,
        getSessionId: () => sessionIdRef.current,
        onBeforeSend: () => setInput(""),
        onSendFailed: (failedText) => setInput(failedText),
      });
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : "发送失败，请稍后重试";
      toast.error(message);
    }
  }

  function handleNewChat() {
    startCreateSession(async () => {
      const { sessionId: newSessionId } = await createPlannerSession();
      sessionIdRef.current = newSessionId;
      setSessionId(newSessionId);
      setMessages([]);
      router.refresh();
    });
  }

  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card",
        CHAT_PANEL_HEIGHT_CLASS,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">生涯规划 Agent</p>
            <p className="text-xs text-muted-foreground">
              {sessionId
                ? `会话 ${sessionId.slice(0, 8)}…`
                : "发送消息开始新对话"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isGenerating ? (
            <Button type="button" variant="outline" size="sm" onClick={stop}>
              停止
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isCreatingSession || isGenerating}
            onClick={handleNewChat}
          >
            新对话
          </Button>
        </div>
      </div>

      <ScrollArea className={CHAT_MESSAGE_SCROLL_CLASS}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                我会结合你的年级、目标岗位与测评标签，按「诊断 → 目标 →
                阶段规划 → 行动清单」给出可执行建议。
              </p>
              <div className="flex flex-wrap gap-2">
                {PLANNER_QUICK_PROMPTS.map((prompt) => (
                  <Button
                    key={prompt}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-auto whitespace-normal text-left"
                    disabled={isGenerating}
                    onClick={() => void submitText(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "max-w-[95%] rounded-xl px-3 py-2 text-sm leading-relaxed sm:max-w-[92%]",
                message.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "border bg-muted/40",
              )}
            >
              <p className="mb-1 text-[11px] font-medium opacity-70">
                {message.role === "user" ? "你" : "规划 Agent"}
              </p>
              <div className="whitespace-pre-wrap">
                {message.parts
                  .filter((part) => part.type === "text")
                  .map((part, index) => (
                    <span key={`${message.id}-${index}`}>{part.text}</span>
                  ))}
              </div>
            </div>
          ))}

          {isGenerating ? (
            <p className="text-xs text-muted-foreground">Agent 正在思考并输入…</p>
          ) : null}
        </div>
      </ScrollArea>

      <form className={CHAT_FORM_CLASS} onSubmit={handleSubmit}>
        <Input
          value={input}
          placeholder="描述你的阶段目标或困惑..."
          disabled={isGenerating}
          className="min-h-10 flex-1"
          onChange={(event) => setInput(event.target.value)}
        />
        <Button
          type="submit"
          className="w-full shrink-0 sm:w-auto"
          disabled={isGenerating || !input.trim()}
        >
          发送
        </Button>
      </form>

      {error ? (
        <p className="border-t px-4 py-2 text-sm text-destructive">
          {error.message}
        </p>
      ) : null}
    </section>
  );
}
