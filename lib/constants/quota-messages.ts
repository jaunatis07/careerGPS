/** 额度耗尽时的 Toast / 弹窗文案 */
export const QUOTA_EXHAUSTED_MESSAGE = "今日 AI 额度已用尽，请明日再试";

export const QUOTA_EXHAUSTED_DIALOG = {
  title: "今日 AI 额度已用尽",
  description:
    "普通用户每日享有固定次数的免费 AI 调用。额度将于明日 0 点自动刷新，届时可继续使用。",
  confirm: "我知道了",
} as const;

export const GENERIC_API_ERROR_MESSAGE = "网络开小差了，请稍后重试";
