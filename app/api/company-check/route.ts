import { NextResponse } from "next/server";

import { checkCompanyRisk } from "@/lib/resume/company-check";
import { shouldRunCompanyCheck } from "@/lib/resume/company-utils";

interface CompanyCheckBody {
  companyName?: string;
}

/**
 * POST /api/company-check
 * 查询企业资质风险（MVP 为 mock，预留真实 API 接入）。
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CompanyCheckBody;
    const companyName = body.companyName?.trim();

    if (!companyName) {
      return NextResponse.json(
        { error: "请提供公司名称" },
        { status: 400 },
      );
    }

    if (!shouldRunCompanyCheck(companyName)) {
      return NextResponse.json({
        skipped: true,
        reason: "命中大厂白名单，无需深度排雷",
        report: null,
      });
    }

    const report = await checkCompanyRisk(companyName);

    return NextResponse.json({ skipped: false, report });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "企业查询失败，请稍后重试",
      },
      { status: 500 },
    );
  }
}
