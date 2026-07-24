/** Dashboard 顶部导航模块 */
export const NAV_ITEMS = [
  { href: "/mindmap", label: "岗位全景" },
  { href: "/assessment", label: "自我探索" },
  { href: "/planner", label: "生涯规划" },
  { href: "/resume-agent", label: "简历排雷" },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];
