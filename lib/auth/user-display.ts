import { formatPhoneDisplay, getCnMobileLocal } from "@/lib/utils/phone";

import { getPhoneFromUser, PHONE_AUTH_EMAIL_DOMAIN } from "./phone-email";

/**
 * 获取导航栏 / 个人主页展示用的用户标识（优先手机号）。
 */
export function getUserDisplayName(user: {
  email?: string | null;
  phone?: string | null;
  user_metadata?: Record<string, unknown>;
}): string {
  const metaPhone = user.user_metadata?.phone;
  if (typeof metaPhone === "string" && metaPhone.trim()) {
    return metaPhone.trim();
  }

  const phoneE164 = getPhoneFromUser(user);
  if (phoneE164) {
    return formatPhoneDisplay(phoneE164);
  }

  const email = user.email?.trim();
  if (email && !email.endsWith(`@${PHONE_AUTH_EMAIL_DOMAIN}`)) {
    return email;
  }

  return "用户";
}

/**
 * 头像占位符字符：手机号取尾号，邮箱取首字母。
 */
export function getUserAvatarInitial(user: {
  email?: string | null;
  phone?: string | null;
  user_metadata?: Record<string, unknown>;
}): string {
  const phoneE164 = getPhoneFromUser(user);

  if (phoneE164) {
    const local = getCnMobileLocal(phoneE164);
    return local.slice(-1) || "U";
  }

  const email = user.email?.trim();
  if (email && !email.endsWith(`@${PHONE_AUTH_EMAIL_DOMAIN}`)) {
    return email.charAt(0).toUpperCase() || "U";
  }

  return "U";
}
