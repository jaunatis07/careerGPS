/** 手机号登录在 Supabase Auth 中使用的内部邮箱域名（不对用户展示、不发送邮件） */
export const PHONE_AUTH_EMAIL_DOMAIN = "phone.careergps.app";

/**
 * 将中国大陆手机号转为 Supabase Auth 内部邮箱标识。
 * 例：13800138000 → 13800138000@phone.careergps.app
 */
export function phoneToAuthEmail(phoneE164: string): string {
  const local = phoneE164.replace(/^\+86/, "");
  return `${local}@${PHONE_AUTH_EMAIL_DOMAIN}`;
}

/**
 * 从 Supabase 用户对象解析真实手机号（E.164）。
 */
export function getPhoneFromUser(user: {
  email?: string | null;
  phone?: string | null;
  user_metadata?: Record<string, unknown>;
}): string | null {
  if (user.phone) {
    return user.phone;
  }

  const metaPhone = user.user_metadata?.phone_e164;
  if (typeof metaPhone === "string" && metaPhone.trim()) {
    return metaPhone.trim();
  }

  const email = user.email ?? "";
  if (email.endsWith(`@${PHONE_AUTH_EMAIL_DOMAIN}`)) {
    return `+86${email.split("@")[0]}`;
  }

  return null;
}
