import type { CareerNode } from "@/types";

function role(id: string, label: string): CareerNode {
  return { id, label, kind: "role" };
}

function fn(id: string, label: string, children: CareerNode[]): CareerNode {
  return { id, label, kind: "function", children };
}

function industry(id: string, label: string, children: CareerNode[]): CareerNode {
  return { id, label, kind: "industry", children };
}

/**
 * 岗位全景树：宏观行业 → 职能方向 → 末端岗位（三层，前两层为导航，末端可查看 AI 透视）。
 */
export const CAREER_TREE: CareerNode[] = [
  industry("ind-internet", "互联网 / 科技大厂", [
    fn("fn-internet-product", "产品", [
      role("job-ai-pm", "AI产品经理"),
      role("job-data-pm", "数据产品经理"),
      role("job-strategy-pm", "策略产品经理"),
    ]),
    fn("fn-internet-ops", "运营 / 增长", [
      role("job-user-ops", "用户运营"),
      role("job-content-ops", "内容运营"),
      role("job-growth-ops", "增长运营"),
      role("job-overseas-ops", "出海运营"),
    ]),
    fn("fn-internet-engineering", "研发 / 算法", [
      role("job-fe-dev", "前端工程师"),
      role("job-be-dev", "后端工程师"),
      role("job-algo-engineer", "算法工程师"),
      role("job-fullstack", "全栈工程师"),
    ]),
    fn("fn-internet-design", "设计 / 体验", [
      role("job-ui-designer", "UI设计师"),
      role("job-ux-researcher", "UX研究员"),
    ]),
    fn("fn-internet-data", "数据 / 分析", [
      role("job-data-analyst", "数据分析师"),
      role("job-bi-analyst", "商业数据分析师"),
    ]),
  ]),
  industry("ind-finance", "金融 / 投资机构", [
    fn("fn-finance-ib", "投行 / 并购", [
      role("job-ib-analyst", "投行分析师"),
      role("job-ma-associate", "并购助理"),
    ]),
    fn("fn-finance-research", "行研 / 投资", [
      role("job-equity-research", "行业研究员"),
      role("job-fund-research", "基金研究员"),
      role("job-quant-research", "量化研究员"),
    ]),
    fn("fn-finance-banking", "银行 / 信贷", [
      role("job-bank-mt", "银行管培生"),
      role("job-corp-banker", "对公客户经理"),
    ]),
    fn("fn-finance-risk", "风控 / 合规", [
      role("job-risk-analyst", "风控专员"),
      role("job-compliance-officer", "合规专员"),
    ]),
    fn("fn-finance-asset", "保险 / 资管", [
      role("job-actuarial-analyst", "精算助理"),
      role("job-asset-mgmt-analyst", "资管研究员"),
    ]),
  ]),
  industry("ind-professional", "专业服务机构", [
    fn("fn-prof-legal", "法律服务 / 律所", [
      role("job-legal-assistant", "律师助理"),
      role("job-inhouse-counsel", "公司法务"),
    ]),
    fn("fn-prof-audit", "财务审计 / 四大", [
      role("job-audit-associate", "审计Associate"),
      role("job-tax-consultant", "税务咨询顾问"),
    ]),
    fn("fn-prof-consulting", "商业 / 战略咨询", [
      role("job-mgmt-consultant", "管理咨询顾问"),
      role("job-strategy-analyst", "战略咨询分析师"),
    ]),
    fn("fn-prof-hr", "人力 / 组织咨询", [
      role("job-hr-consultant", "HR咨询顾问"),
      role("job-org-development", "组织发展专员"),
    ]),
  ]),
  industry("ind-manufacturing", "实体产业 / 消费品 / 制造业", [
    fn("fn-mfg-supply", "供应链 / 采购", [
      role("job-supply-chain-mt", "供应链管培生"),
      role("job-procurement", "采购专员"),
    ]),
    fn("fn-mfg-marketing", "品牌 / 营销", [
      role("job-brand-mt", "品牌市场管培生"),
      role("job-product-marketing", "产品营销专员"),
    ]),
    fn("fn-mfg-engineering", "制造 / 工艺工程", [
      role("job-process-engineer", "工艺工程师"),
      role("job-quality-engineer", "质量工程师"),
    ]),
    fn("fn-mfg-sales", "销售 / 渠道", [
      role("job-key-account-sales", "大客户销售"),
      role("job-channel-sales", "渠道销售"),
    ]),
  ]),
  industry("ind-public", "体制内 / 公共部门 / 国企央企", [
    fn("fn-public-civil", "党政机关", [
      role("job-civil-servant", "公务员"),
      role("job-selected-graduate", "选调生"),
    ]),
    fn("fn-public-institution", "事业单位", [
      role("job-public-institution", "事业单位职员"),
      role("job-university-admin", "高校行政岗"),
    ]),
    fn("fn-public-soe", "国企 / 央企", [
      role("job-soe-mgmt-trainee", "国企管培生"),
      role("job-soe-engineer", "国企技术岗"),
      role("job-soe-finance", "国企财务岗"),
    ]),
    fn("fn-public-research", "科研 / 学术", [
      role("job-researcher", "高校研究员"),
      role("job-lab-assistant", "实验室助理"),
    ]),
  ]),
];

/** 判断节点是否为可点击的末端岗位 */
export function isCareerLeaf(node: CareerNode): boolean {
  return !node.children || node.children.length === 0;
}

/** 收集所有末端岗位名称，供 API 校验使用 */
export function getAllLeafLabels(nodes: CareerNode[] = CAREER_TREE): string[] {
  const labels: string[] = [];

  for (const node of nodes) {
    if (isCareerLeaf(node)) {
      labels.push(node.label);
      continue;
    }

    labels.push(...getAllLeafLabels(node.children));
  }

  return labels;
}

/** 默认展开：所有宏观行业 + 职能方向（便于浏览末端岗位） */
export function getDefaultExpandedIds(nodes: CareerNode[] = CAREER_TREE): string[] {
  const ids: string[] = [];

  for (const node of nodes) {
    if (isCareerLeaf(node)) {
      continue;
    }

    ids.push(node.id);

    for (const child of node.children ?? []) {
      if (!isCareerLeaf(child)) {
        ids.push(child.id);
      }
    }
  }

  return ids;
}
