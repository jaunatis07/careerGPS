"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AgentType } from "@/lib/ai/system-prompts";
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
  const sessionIdRef = useRef<string | null>(initialSessionId);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, id }) => ({
          body: {
            messages,
            id,
            sessionId: sessionIdRef.current,
            agentType,
          },
        }),
        fetch: async (input, init) => {
          const response = await fetch(input, init);
          const nextSessionId = response.headers.get("X-Chat-Session-Id");

          if (nextSessionId && nextSessionId !== sessionIdRef.current) {
            sessionIdRef.current = nextSessionId;
            setSessionId(nextSessionId);
          }

          return response;
        },
      }),
    [agentType],
  );

  const { messages, sendMessage, status, error, stop } = useChat({
    id: `${agentType}-${initialSessionId ?? "new"}`,
    messages: initialMessages,
    transport,
  });

  useEffect(() => {
    sessionIdRef.current = initialSessionId;
    setSessionId(initialSessionId);
  }, [initialSessionId]);

  const isGenerating = status === "submitted" || status === "streaming";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = input.trim();

    if (!text || isGenerating) {
      return;
    }

    setInput("");
    await sendMessage({ text });
  }

  return (
    <div
      className={cn(
        "flex h-[min(70vh,640px)] flex-col overflow-hidden rounded-xl border bg-card",
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

      <ScrollArea className="flex-1 px-4 py-4">
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
                "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed",
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

      <form
        className="flex items-center gap-2 border-t p-4"
        onSubmit={handleSubmit}
      >
        <Input
          value={input}
          placeholder="输入你的问题..."
          disabled={isGenerating}
          onChange={(event) => setInput(event.target.value)}
        />
        <Button type="submit" disabled={isGenerating || !input.trim()}>
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
