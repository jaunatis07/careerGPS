/**
 * 从 JD 文本中粗略提取公司名称，供企业排雷接口使用。
 */
export function extractCompanyName(jdText: string): string | null {
  const patterns = [
    /(?:公司|企业)名称\s*[:：]\s*([^\n，,。；;]{2,40})/,
    /([^\n，,。；;]{2,30}(?:有限公司|股份有限公司|集团))/,
    /(?:关于|join)\s*([A-Za-z0-9\u4e00-\u9fa5]{2,20})/i,
  ];

  for (const pattern of patterns) {
    const match = jdText.match(pattern);

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/** 常见大厂关键词，用于区分「已知大厂」与「需排雷的初创/未知公司」 */
export const KNOWN_LARGE_COMPANIES = [
  "腾讯",
  "阿里巴巴",
  "阿里",
  "字节跳动",
  "字节",
  "百度",
  "美团",
  "京东",
  "华为",
  "小米",
  "网易",
  "拼多多",
  "快手",
  "滴滴",
  "蚂蚁",
  "微软",
  "Google",
  "Amazon",
  "苹果",
  "Apple",
] as const;

/**
 * 判断公司是否属于已知大厂（无需深度排雷）。
 */
export function isKnownLargeCompany(companyName: string): boolean {
  return KNOWN_LARGE_COMPANIES.some((keyword) =>
    companyName.includes(keyword),
  );
}

/**
 * 启发式判断是否为初创/未知公司，需要触发企业排雷。
 */
export function shouldRunCompanyCheck(
  companyName: string | null,
): companyName is string {
  if (!companyName) {
    return false;
  }

  return !isKnownLargeCompany(companyName);
}
