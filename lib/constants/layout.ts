/** 聊天面板高度：移动端用 dvh 扣除 Navbar，桌面端用 vh */
export const CHAT_PANEL_HEIGHT_CLASS =
  "h-[min(calc(100dvh-11rem),720px)] sm:h-[min(75vh,720px)]";

/** 聊天输入区：移动端纵向堆叠，桌面端横向排列 */
export const CHAT_FORM_CLASS =
  "flex flex-col gap-2 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:p-4";

/** 思维导图树滚动区：小屏限制高度避免整页过长 */
export const MINDMAP_TREE_SCROLL_CLASS =
  "max-h-[min(calc(100dvh-14rem),560px)] overflow-y-auto overscroll-contain pr-1 sm:max-h-none sm:overflow-visible";
