"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useQuota } from "@/components/providers/QuotaProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  createChatTransport,
  submitChatMessage,
} from "@/lib/client/chat-transport";
import type { AgentType } from "@/lib/ai/system-prompts";
import { CHAT_FORM_CLASS, CHAT_MESSAGE_SCROLL_CLASS, CHAT_PANEL_HEIGHT_CLASS } from "@/lib/constants/layout";
import { cn } from "@/lib/utils";

interface ChatBoxProps {
  agentType: AgentType;
  initialSessionId?: string | null;
  initialMessages?: UIMessage[];
  className?: string;
}

/**
 * 通用 AI 聊天框：基于 /api/chat 的 SSE 流式打字，支持会话 ID 与上下文恢复。
 */
export function ChatBox({
  agentType,
  initialSessionId = null,
  initialMessages = [],
  className,
}: ChatBoxProps) {
  const [input, setInput] = useState("");
  const { assertQuotaAvailable, refreshQuota, quotaAwareFetch } = useQuota();
  const sessionIdRef = useRef<string | null>(initialSessionId);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);

  const transport = useMemo(
    () =>
      createChatTransport({
        agentType,
        getSessionId: () => sessionIdRef.current,
        onSessionId: (nextSessionId) => {
          sessionIdRef.current = nextSessionId;
          setSessionId(nextSessionId);
        },
        quotaAwareFetch,
      }),
    [agentType, quotaAwareFetch],
  );

  const { messages, sendMessage, status, error, stop } = useChat({
    id: `${agentType}-${initialSessionId ?? "new"}`,
    messages: initialMessages,
    transport,
    onFinish: () => {
      void refreshQuota();
    },
    onError: (chatError) => {
      console.error("[CareerGPS][Chat] useChat onError", {
        agentType,
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

    try {
      await submitChatMessage({
        text: input,
        agentType,
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

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card",
        CHAT_PANEL_HEIGHT_CLASS,
        className,
      )}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-sm font-medium">AI 对话</p>
          <p className="text-xs text-muted-foreground">
            {sessionId ? `会话 ${sessionId.slice(0, 8)}...` : "新会话"}
          </p>
        </div>
        {isGenerating ? (
          <Button type="button" variant="outline" size="sm" onClick={stop}>
            停止
          </Button>
        ) : null}
      </div>

      <ScrollArea className={CHAT_MESSAGE_SCROLL_CLASS}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              发送第一条消息，体验 DeepSeek 流式回复。
            </p>
          ) : null}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "max-w-[95%] rounded-lg px-3 py-2 text-sm leading-relaxed sm:max-w-[85%]",
                message.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted",
              )}
            >
              {message.parts
                .filter((part) => part.type === "text")
                .map((part, index) => (
                  <span key={`${message.id}-${index}`}>{part.text}</span>
                ))}
            </div>
          ))}

          {isGenerating ? (
            <p className="text-xs text-muted-foreground">AI 正在输入...</p>
          ) : null}
        </div>
      </ScrollArea>

      <form className={CHAT_FORM_CLASS} onSubmit={handleSubmit}>
        <Input
          value={input}
          placeholder="输入你的问题..."
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
    </div>
  );
}
