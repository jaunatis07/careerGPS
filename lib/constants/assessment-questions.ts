export type AssessmentDimension =
  | "risk_stability"
  | "work_life_balance"
  | "ability_talent"
  | "tolerance_baseline";

export interface AssessmentOption {
  id: string;
  text: string;
  tag: string;
}

export interface AssessmentQuestion {
  id: string;
  orderIndex: number;
  dimension: AssessmentDimension;
  questionText: string;
  options: AssessmentOption[];
}

export const ASSESSMENT_DIMENSION_LABELS: Record<AssessmentDimension, string> = {
  risk_stability: "风险与稳定性偏好",
  work_life_balance: "强度与生活平衡度",
  ability_talent: "能力与天赋倾向",
  tolerance_baseline: "避坑与耐受底线",
};

/**
 * 12 道自研测评题（4 维度 × 3 题），与 assessment_questions 表结构对齐。
 */
export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "q1",
    orderIndex: 1,
    dimension: "risk_stability",
    questionText: "如果有两份 Offer：A 稳定但涨薪慢，B 高风险高回报，你更倾向？",
    options: [
      { id: "q1-a", text: "选 A，稳定最重要", tag: "稳定优先" },
      { id: "q1-b", text: "选 B，愿意承担波动换成长", tag: "冒险进取" },
      { id: "q1-c", text: "看行业阶段再决定", tag: "平衡型" },
      { id: "q1-d", text: "优先选有明确晋升通道的", tag: "稳定优先" },
    ],
  },
  {
    id: "q2",
    orderIndex: 2,
    dimension: "risk_stability",
    questionText: "你更能接受哪种职业状态？",
    options: [
      { id: "q2-a", text: "流程清晰、变化少", tag: "稳定优先" },
      { id: "q2-b", text: "规则常变、需要快速适应", tag: "冒险进取" },
      { id: "q2-c", text: "核心稳定 + 局部创新", tag: "平衡型" },
      { id: "q2-d", text: "短期不确定但长期上限高", tag: "冒险进取" },
    ],
  },
  {
    id: "q3",
    orderIndex: 3,
    dimension: "risk_stability",
    questionText: "面对「创业公司 vs 成熟大厂」，你的第一反应是？",
    options: [
      { id: "q3-a", text: "大厂，抗风险能力更重要", tag: "稳定优先" },
      { id: "q3-b", text: "创业公司，想参与从 0 到 1", tag: "冒险进取" },
      { id: "q3-c", text: "看业务赛道和团队再选", tag: "平衡型" },
      { id: "q3-d", text: "先去快节奏环境练能力", tag: "冒险进取" },
    ],
  },
  {
    id: "q4",
    orderIndex: 4,
    dimension: "work_life_balance",
    questionText: "理想的一周工作节奏是？",
    options: [
      { id: "q4-a", text: "准点下班，周末尽量不加班", tag: "生活平衡" },
      { id: "q4-b", text: "项目期可以冲刺，平时高效", tag: "弹性调节" },
      { id: "q4-c", text: "为了关键目标可以长期高强度", tag: "事业优先" },
      { id: "q4-d", text: "远程/弹性办公优先", tag: "生活平衡" },
    ],
  },
  {
    id: "q5",
    orderIndex: 5,
    dimension: "work_life_balance",
    questionText: "当工作与生活冲突时，你通常会？",
    options: [
      { id: "q5-a", text: "优先保证生活安排", tag: "生活平衡" },
      { id: "q5-b", text: "先完成工作再补偿生活", tag: "事业优先" },
      { id: "q5-c", text: "根据阶段目标动态调整", tag: "弹性调节" },
      { id: "q5-d", text: "设定边界，拒绝无限加班", tag: "生活平衡" },
    ],
  },
  {
    id: "q6",
    orderIndex: 6,
    dimension: "work_life_balance",
    questionText: "你如何看待「内卷式竞争」？",
    options: [
      { id: "q6-a", text: "能避则避，不想耗在无意义竞争", tag: "生活平衡" },
      { id: "q6-b", text: "关键窗口期可以全力投入", tag: "事业优先" },
      { id: "q6-c", text: "看回报是否匹配付出", tag: "弹性调节" },
      { id: "q6-d", text: "愿意短期卷换取跃迁机会", tag: "事业优先" },
    ],
  },
  {
    id: "q7",
    orderIndex: 7,
    dimension: "ability_talent",
    questionText: "解决陌生问题时，你第一反应通常是？",
    options: [
      { id: "q7-a", text: "先动手试，边做边校正", tag: "实践派" },
      { id: "q7-b", text: "先拆解框架再找规律", tag: "分析派" },
      { id: "q7-c", text: "从用户/场景出发重新定义问题", tag: "创意派" },
      { id: "q7-d", text: "找成功案例快速复用", tag: "实践派" },
    ],
  },
  {
    id: "q8",
    orderIndex: 8,
    dimension: "ability_talent",
    questionText: "哪类任务最容易让你进入「心流」？",
    options: [
      { id: "q8-a", text: "把想法快速落地验证", tag: "实践派" },
      { id: "q8-b", text: "分析数据并输出结论", tag: "分析派" },
      { id: "q8-c", text: "构思新方案或新表达", tag: "创意派" },
      { id: "q8-d", text: "协调资源推进项目", tag: "实践派" },
    ],
  },
  {
    id: "q9",
    orderIndex: 9,
    dimension: "ability_talent",
    questionText: "同学更常请你帮哪类忙？",
    options: [
      { id: "q9-a", text: "执行落地、赶进度", tag: "实践派" },
      { id: "q9-b", text: "逻辑梳理、方案对比", tag: "分析派" },
      { id: "q9-c", text: "脑暴创意、Presentation", tag: "创意派" },
      { id: "q9-d", text: "结构化写作/报告", tag: "分析派" },
    ],
  },
  {
    id: "q10",
    orderIndex: 10,
    dimension: "tolerance_baseline",
    questionText: "连续高压工作 2 周后，你会？",
    options: [
      { id: "q10-a", text: "仍能保持效率", tag: "高度抗压" },
      { id: "q10-b", text: "效率下降但还能撑", tag: "中度抗压" },
      { id: "q10-c", text: "必须休息，否则质量崩盘", tag: "底线清晰" },
      { id: "q10-d", text: "会主动和上级对齐优先级", tag: "中度抗压" },
    ],
  },
  {
    id: "q11",
    orderIndex: 11,
    dimension: "tolerance_baseline",
    questionText: "哪种职场环境你最难长期忍受？",
    options: [
      { id: "q11-a", text: "重复填表、流程形式主义", tag: "拒绝形式主义" },
      { id: "q11-b", text: "目标频繁变更没解释", tag: "底线清晰" },
      { id: "q11-c", text: "长期无反馈的机械劳动", tag: "拒绝形式主义" },
      { id: "q11-d", text: "以上都能阶段性接受", tag: "高度抗压" },
    ],
  },
  {
    id: "q12",
    orderIndex: 12,
    dimension: "tolerance_baseline",
    questionText: "遇到明显不合理的任务安排，你会？",
    options: [
      { id: "q12-a", text: "直接沟通边界与替代方案", tag: "底线清晰" },
      { id: "q12-b", text: "先完成再复盘流程问题", tag: "中度抗压" },
      { id: "q12-c", text: "若价值不大会争取调整", tag: "拒绝形式主义" },
      { id: "q12-d", text: "服从安排，避免冲突", tag: "高度抗压" },
    ],
  },
];

/** 免费 MBTI / 霍兰德测试外链 */
export const EXTERNAL_ASSESSMENT_LINKS = {
  mbti: {
    label: "16Personalities 免费 MBTI 测试",
    href: "https://www.16personalities.com/ch",
  },
  holland: {
    label: "霍兰德职业兴趣测试（免费）",
    href: "https://www.apesk.com/holland/",
  },
} as const;
