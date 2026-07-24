import { NextResponse } from "next/server";

import { getAllLeafLabels } from "@/lib/constants/career-tree";
import { JOB_INSIGHTS, getJobInsightByTitle } from "@/lib/constants/job-insights";

/**
 * 模拟 AI 生成延迟，让前端展示加载态（阶段四将替换为真实 DeepSeek 流式响应）。
 */
const SIMULATED_AI_DELAY_MS = 700;

/**
 * GET /api/job-insight?title=AI产品经理
 * 返回岗位透视数据：薪资、学历、硬技能、内卷烈度与发展路径。
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title")?.trim();

    if (!title) {
      return NextResponse.json(
        { error: "缺少岗位名称参数 title" },
        { status: 400 },
      );
    }

    const allowedTitles = getAllLeafLabels();

    if (!allowedTitles.includes(title)) {
      return NextResponse.json(
        { error: "未找到该岗位节点" },
        { status: 404 },
      );
    }

    await new Promise((resolve) => setTimeout(resolve, SIMULATED_AI_DELAY_MS));

    const insight = getJobInsightByTitle(title);

    return NextResponse.json({
      ...insight,
      source: title in JOB_INSIGHTS ? "seed" : "fallback",
      aiGenerated: false,
    });
  } catch {
    return NextResponse.json(
      { error: "岗位透视数据获取失败，请稍后重试" },
      { status: 500 },
    );
  }
}
