"use client";

import type { UIMessage } from "ai";

import { ChatMarkdown } from "@/components/chat/ChatMarkdown";

export function getTextFromMessageParts(parts: UIMessage["parts"]): string {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

interface ChatMessageContentProps {
  role: UIMessage["role"];
  parts: UIMessage["parts"];
}

/**
 * 按角色渲染消息：AI 用 Markdown，用户消息保持纯文本。
 */
export function ChatMessageContent({ role, parts }: ChatMessageContentProps) {
  const text = getTextFromMessageParts(parts);

  if (!text) {
    return null;
  }

  if (role === "assistant") {
    return <ChatMarkdown content={text} />;
  }

  return <div className="whitespace-pre-wrap">{text}</div>;
}
