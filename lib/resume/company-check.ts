import type { CompanyRiskReport } from "@/lib/ai/prompts/resume-system-prompt";
import { isKnownLargeCompany } from "@/lib/resume/company-utils";

/**
 * MVP 企业排雷模拟。后续可接入天眼查 / 企查查 API（COMPANY_API_KEY）。
 */
export function mockCompanyRiskCheck(companyName: string): CompanyRiskReport {
  if (isKnownLargeCompany(companyName)) {
    return {
      companyName,
      riskLevel: "low",
      summary: "命中知名大厂白名单，招聘流程相对规范，仍建议核实具体团队与业务线。",
      risks: ["关注是否为外包/子公司主体", "确认 JD 职责与实际团队匹配"],
      source: "seed",
    };
  }

  const startupKeywords = ["科技", "网络", "创新", "智能", "数字"];

  const looksLikeStartup = startupKeywords.some((keyword) =>
    companyName.includes(keyword),
  );

  if (looksLikeStartup) {
    return {
      companyName,
      riskLevel: "medium",
      summary: "检测到疑似初创/中小型公司，建议进一步核实工商与融资信息。",
      risks: [
        "公开渠道暂未能完全验证融资轮次与实缴资本，建议通过工商公示系统进一步核实",
        "建议确认劳动合同主体、社保缴纳与办公地址是否一致",
        "关注是否存在岗位挂羊头卖狗肉或过度加班文化信号",
      ],
      source: "seed",
    };
  }

  return {
    companyName,
    riskLevel: "medium",
    summary: "未命中大厂白名单，建议手动核实企业资质与招聘真实性。",
    risks: [
      "通过国家企业信用信息公示系统查询工商状态",
      "警惕培训贷、押金、异地培训等常见套路",
    ],
    source: "seed",
  };
}

/**
 * 统一企业排雷入口：MVP 使用 mock；有 API Key 时可扩展真实查询。
 */
export async function checkCompanyRisk(
  companyName: string,
): Promise<CompanyRiskReport> {
  const apiKey = process.env.COMPANY_API_KEY;

  if (apiKey) {
    // 预留真实 API 接入点
    return mockCompanyRiskCheck(companyName);
  }

  return mockCompanyRiskCheck(companyName);
}
