import { revalidatePath } from "next/cache";

import { mergeSavedJobs, type SavedJob } from "@/lib/jobs/saved-jobs";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * POST /api/saved-jobs/sync — 将 localStorage 收藏合并进 Supabase
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

    const body = (await request.json()) as { jobs?: SavedJob[] };
    const jobs = Array.isArray(body.jobs) ? body.jobs : [];
    const merged = await mergeSavedJobs(user.id, jobs);

    revalidatePath("/profile");
    revalidatePath("/mindmap");

    return Response.json({ jobs: merged });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "同步收藏失败，请稍后重试",
      },
      { status: 500 },
    );
  }
}
