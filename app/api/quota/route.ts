import { NextResponse } from "next/server";

import { getCurrentUserQuota } from "@/lib/quota/get-current-user-quota";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/quota
 * 返回当前登录用户的每日额度摘要，供前端刷新 QuotaBadge。
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const quota = await getCurrentUserQuota();

    return NextResponse.json(quota);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "额度查询失败，请稍后重试",
      },
      { status: 500 },
    );
  }
}
