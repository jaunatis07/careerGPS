import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublicEnv } from "./env";

/**
 * 创建服务端 Supabase 客户端，供 Server Components、Route Handlers 使用。
 * 通过 cookies 读写用户会话，支持 SSR 场景下的 Auth 状态同步。
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabasePublicEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component 中无法写 cookie 时忽略，Middleware 会负责刷新会话
        }
      },
    },
  });
}
