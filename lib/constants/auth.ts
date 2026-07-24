/** 登录成功后默认跳转的 Dashboard 路径 */
export const DEFAULT_AUTH_REDIRECT = "/mindmap";

/** 需要登录才能访问的路由前缀 */
export const PROTECTED_ROUTE_PREFIXES = [
  "/mindmap",
  "/assessment",
  "/planner",
  "/resume-agent",
] as const;

/** 仅未登录用户可访问的路由（已登录则重定向到 Dashboard） */
export const AUTH_ROUTE_PREFIXES = ["/login"] as const;
