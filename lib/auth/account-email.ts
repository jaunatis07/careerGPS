/** 账号登录在 Supabase Auth 中使用的虚拟邮箱后缀（不发送真实邮件） */
export const USERNAME_AUTH_EMAIL_DOMAIN = "careergps.local";

const USERNAME_PATTERN = /^[a-z0-9_]{3,32}$/;

/**
 * 将用户输入的账号转为 Supabase 可接受的邮箱格式。
 * - myname → myname@careergps.local
 * - 已含 @ 则原样使用（兼容直接输入完整虚拟邮箱或真实邮箱）
 */
export function accountToAuthEmail(input: string): string {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed) {
    throw new Error("请输入账号");
  }

  if (trimmed.includes("@")) {
    return trimmed;
  }

  if (!USERNAME_PATTERN.test(trimmed)) {
    throw new Error("账号需为 3-32 位小写字母、数字或下划线");
  }

  return `${trimmed}@${USERNAME_AUTH_EMAIL_DOMAIN}`;
}

/**
 * 从 Supabase 邮箱还原用户可见的账号名。
 */
export function authEmailToDisplayName(email: string): string | null {
  const normalized = email.trim().toLowerCase();

  if (!normalized.endsWith(`@${USERNAME_AUTH_EMAIL_DOMAIN}`)) {
    return null;
  }

  return normalized.split("@")[0] || null;
}

export function isUsernameAuthEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${USERNAME_AUTH_EMAIL_DOMAIN}`);
}
