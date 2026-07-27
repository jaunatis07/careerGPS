import { NextResponse } from "next/server";

import { DEFAULT_AUTH_REDIRECT } from "@/lib/constants/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * 处理 OAuth 回调（遗留路由，当前登录页使用手机号验证码，不经过此路由）。
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
