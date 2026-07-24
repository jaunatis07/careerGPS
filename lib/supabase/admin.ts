import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv, getSupabaseServiceRoleKey } from "./env";

/**
 * 创建服务端 Admin 客户端，使用 Service Role Key 绕过 RLS。
 * 仅用于受信任的服务端逻辑（如后台任务、管理接口），切勿暴露到浏览器。
 */
export function createAdminClient() {
  const { url } = getSupabasePublicEnv();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
