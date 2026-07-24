"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type ConnectionStatus = "checking" | "connected" | "error";

/**
 * 开发阶段用于验证 Supabase 客户端是否配置正确。
 * 挂载后会尝试建立连接，并在浏览器控制台输出结果。
 */
export function SupabaseStatus() {
  const [status, setStatus] = useState<ConnectionStatus>("checking");
  const [message, setMessage] = useState("正在检测 Supabase 连接...");

  useEffect(() => {
    async function checkConnection() {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        console.log("[CareerGPS] Supabase 连接正常 ✅");
        setStatus("connected");
        setMessage("Supabase 连接正常（详见浏览器控制台）");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "未知连接错误";

        console.error("[CareerGPS] Supabase 连接失败 ❌", errorMessage);
        setStatus("error");
        setMessage(errorMessage);
      }
    }

    void checkConnection();
  }, []);

  const statusColor = {
    checking: "text-amber-600 dark:text-amber-400",
    connected: "text-green-600 dark:text-green-400",
    error: "text-red-600 dark:text-red-400",
  }[status];

  return (
    <p className={`text-sm ${statusColor}`}>
      Supabase 状态：{message}
    </p>
  );
}
