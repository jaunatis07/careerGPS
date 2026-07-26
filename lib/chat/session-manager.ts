import type { UIMessage } from "ai";

import type { AgentType } from "@/lib/ai/system-prompts";
import { createClient } from "@/lib/supabase/server";

export interface ChatSessionRecord {
  id: string;
  agent_type: AgentType;
  title: string;
  created_at?: string;
}

export interface PlannerSessionSummary extends ChatSessionRecord {
  created_at: string;
  preview: string;
  messageCount: number;
}

export interface StoredChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

/**
 * 从 UIMessage 中提取纯文本内容，用于持久化到 chat_messages 表。
 */
export function getTextFromUIMessage(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("")
    .trim();
}

/**
 * 将数据库消息转换为 UI 渲染所需的 UIMessage 格式。
 */
export function toUIMessages(messages: StoredChatMessage[]): UIMessage[] {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      id: message.id,
      role: message.role,
      parts: [{ type: "text" as const, text: message.content }],
    }));
}

/**
 * 获取或创建指定 Agent 的聊天会话。
 */
export async function resolveChatSession(
  userId: string,
  sessionId: string | undefined,
  agentType: AgentType,
): Promise<ChatSessionRecord> {
  const supabase = await createClient();

  if (sessionId) {
    const { data: existingSession, error } = await supabase
      .from("chat_sessions")
      .select("id, agent_type, title, created_at")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error("读取会话失败，请稍后重试");
    }

    if (existingSession) {
      return existingSession as ChatSessionRecord;
    }
  }

  const { data: createdSession, error: createError } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: userId,
      agent_type: agentType,
      title: "新对话",
    })
    .select("id, agent_type, title, created_at")
    .single();

  if (createError || !createdSession) {
    throw new Error("创建会话失败，请稍后重试");
  }

  return createdSession as ChatSessionRecord;
}

/**
 * 读取会话下的历史消息，按时间升序返回。
 */
export async function loadChatMessages(
  sessionId: string,
): Promise<StoredChatMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("读取聊天记录失败，请稍后重试");
  }

  return (data ?? []) as StoredChatMessage[];
}

/**
 * 将单条聊天消息写入 chat_messages 表。
 */
export async function saveChatMessage(
  sessionId: string,
  role: "user" | "assistant" | "system",
  content: string,
) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("chat_messages").insert({
    session_id: sessionId,
    role,
    content: trimmedContent,
  });

  if (error) {
    throw new Error("保存聊天记录失败，请稍后重试");
  }
}

/**
 * 查找当前用户最近一个指定 Agent 的会话，供页面恢复上下文。
 */
export async function getLatestChatSession(
  userId: string,
  agentType: AgentType,
): Promise<ChatSessionRecord | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chat_sessions")
    .select("id, agent_type, title, created_at")
    .eq("user_id", userId)
    .eq("agent_type", agentType)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as ChatSessionRecord | null) ?? null;
}

/**
 * 读取指定用户的单个会话（校验归属）。
 */
export async function getChatSessionForUser(
  userId: string,
  sessionId: string,
  agentType: AgentType,
): Promise<ChatSessionRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id, agent_type, title, created_at")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .eq("agent_type", agentType)
    .maybeSingle();

  if (error) {
    throw new Error("读取会话失败，请稍后重试");
  }

  return (data as ChatSessionRecord | null) ?? null;
}

/**
 * 列出用户指定 Agent 的会话，附带首条用户消息预览。
 */
export async function listPlannerSessionsForProfile(
  userId: string,
  limit = 20,
): Promise<PlannerSessionSummary[]> {
  const supabase = await createClient();
  const { data: sessions, error } = await supabase
    .from("chat_sessions")
    .select("id, agent_type, title, created_at")
    .eq("user_id", userId)
    .eq("agent_type", "planner")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error("读取对话历史失败，请稍后重试");
  }

  const sessionList = (sessions ?? []) as PlannerSessionSummary[];

  if (sessionList.length === 0) {
    return [];
  }

  const sessionIds = sessionList.map((session) => session.id);
  const { data: messages, error: messagesError } = await supabase
    .from("chat_messages")
    .select("session_id, role, content, created_at")
    .in("session_id", sessionIds)
    .order("created_at", { ascending: true });

  if (messagesError) {
    throw new Error("读取对话预览失败，请稍后重试");
  }

  const previewBySession = new Map<string, string>();
  const countBySession = new Map<string, number>();

  for (const message of messages ?? []) {
    const sessionId = message.session_id as string;
    countBySession.set(sessionId, (countBySession.get(sessionId) ?? 0) + 1);

    if (
      message.role === "user" &&
      !previewBySession.has(sessionId) &&
      typeof message.content === "string"
    ) {
      previewBySession.set(sessionId, message.content.trim());
    }
  }

  return sessionList.map((session) => {
    const preview = previewBySession.get(session.id) ?? "";
    const customTitle =
      session.title.trim() && session.title !== "新对话" ? session.title : "";

    return {
      ...session,
      preview:
        preview ||
        customTitle ||
        "尚未发送消息的生涯规划对话",
      messageCount: countBySession.get(session.id) ?? 0,
    };
  });
}
