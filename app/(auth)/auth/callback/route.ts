import { NextResponse } from "next/server";

import { DEFAULT_AUTH_REDIRECT } from "@/lib/constants/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * 处理 GitHub OAuth 回调：将授权码交换为会话并跳转 Dashboard。
 * 邮箱+密码登录在客户端直接建立会话，不经过此路由。
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? DEFAULT_AUTH_REDIRECT;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("登录回调失败，请重试")}`,
  );
}
