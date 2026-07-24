import type { CareerNode } from "@/types";

/**
 * 岗位全景树：市场化 vs 非市场化两大分支，末端节点可点击查看岗位透视。
 */
export const CAREER_TREE: CareerNode[] = [
  {
    id: "market",
    label: "市场化就业",
    children: [
      {
        id: "market-internet",
        label: "互联网 / 科技",
        children: [
          {
            id: "market-internet-product",
            label: "产品方向",
            children: [
              { id: "job-ai-pm", label: "AI产品经理" },
              { id: "job-data-pm", label: "数据产品经理" },
              { id: "job-growth-pm", label: "增长产品经理" },
            ],
          },
          {
            id: "market-internet-engineering",
            label: "研发方向",
            children: [
              { id: "job-fe-dev", label: "前端工程师" },
              { id: "job-algo-engineer", label: "算法工程师" },
              { id: "job-fullstack", label: "全栈工程师" },
            ],
          },
        ],
      },
      {
        id: "market-operations",
        label: "运营 / 增长",
        children: [
          { id: "job-overseas-ops", label: "出海运营" },
          { id: "job-user-ops", label: "用户运营" },
          { id: "job-content-ops", label: "内容运营" },
        ],
      },
      {
        id: "market-consulting",
        label: "咨询 / 商业",
        children: [
          { id: "job-mgmt-consultant", label: "管理咨询顾问" },
          { id: "job-business-analyst", label: "商业分析师" },
        ],
      },
    ],
  },
  {
    id: "non-market",
    label: "非市场化就业",
    children: [
      {
        id: "non-market-public",
        label: "体制内 / 事业单位",
        children: [
          { id: "job-civil-servant", label: "公务员" },
          { id: "job-public-institution", label: "事业单位职员" },
        ],
      },
      {
        id: "non-market-academia",
        label: "学术 / 科研",
        children: [
          { id: "job-researcher", label: "高校研究员" },
          { id: "job-lab-assistant", label: "实验室助理" },
        ],
      },
      {
        id: "non-market-state-owned",
        label: "国企 / 央企",
        children: [
          { id: "job-soe-mgmt-trainee", label: "国企管培生" },
          { id: "job-soe-engineer", label: "国企技术岗" },
        ],
      },
    ],
  },
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
