import { revalidatePath } from "next/cache";

import {
  getSavedJobs,
  toggleSavedJob,
} from "@/lib/jobs/saved-jobs";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function revalidateSavedJobPaths() {
  revalidatePath("/profile");
  revalidatePath("/mindmap");
}

/**
 * GET /api/saved-jobs — 获取当前用户收藏岗位列表
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "请先登录" }, { status: 401 });
    }

    const jobs = await getSavedJobs(user.id);
    return Response.json({ jobs });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "读取收藏失败，请稍后重试",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/saved-jobs — 切换岗位收藏
 * Body: { title: string }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "请先登录" }, { status: 401 });
    }

    const body = (await request.json()) as { title?: string };
    const title = body.title?.trim();

    if (!title) {
      return Response.json({ error: "请提供岗位名称" }, { status: 400 });
    }

    const result = await toggleSavedJob(user.id, title);
    revalidateSavedJobPaths();
    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "保存收藏失败，请稍后重试",
      },
      { status: 500 },
    );
  }
}
