/**
 * 读取并校验 Supabase 相关的环境变量。
 * 客户端可安全读取 NEXT_PUBLIC_* 变量；服务端密钥仅在 Server 环境使用。
 */
export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "缺少 Supabase 环境变量：请在 .env.local 中配置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  if (url.includes("your-project-id") || anonKey.includes("your-anon-key")) {
    throw new Error(
      "Supabase 环境变量仍为占位符：请替换 .env.local 中的真实 Project URL 与 anon key",
    );
  }

  return { url, anonKey };
}

/**
 * 读取服务端专用的 Supabase Service Role Key。
 * 该密钥拥有绕过 RLS 的权限，只能在服务端使用。
 */
export function getSupabaseServiceRoleKey() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "缺少 Supabase 环境变量：请在 .env.local 中配置 SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  if (serviceRoleKey.includes("your-service-role-key")) {
    throw new Error(
      "Supabase 环境变量仍为占位符：请替换 .env.local 中的真实 service role key",
    );
  }

  return serviceRoleKey;
}
