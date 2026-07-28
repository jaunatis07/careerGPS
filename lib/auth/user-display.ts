import {
  authEmailToDisplayName,
  isUsernameAuthEmail,
} from "@/lib/auth/account-email";
import { formatPhoneDisplay, getCnMobileLocal } from "@/lib/utils/phone";

import { getPhoneFromUser, PHONE_AUTH_EMAIL_DOMAIN } from "./phone-email";

/**
 * 获取导航栏 / 个人主页展示用的用户标识（优先账号名 / 手机号）。
 */
export function getUserDisplayName(user: {
  email?: string | null;
  phone?: string | null;
  user_metadata?: Record<string, unknown>;
}): string {
  const email = user.email?.trim();

  if (email) {
    const username = authEmailToDisplayName(email);
    if (username) {
      return username;
    }
  }

  const metaPhone = user.user_metadata?.phone;
  if (typeof metaPhone === "string" && metaPhone.trim()) {
    return metaPhone.trim();
  }

  const phoneE164 = getPhoneFromUser(user);
  if (phoneE164) {
    return formatPhoneDisplay(phoneE164);
  }

  if (email && !email.endsWith(`@${PHONE_AUTH_EMAIL_DOMAIN}`)) {
    return email;
  }

  return "用户";
}

/**
 * 头像占位符字符：账号取首字母，手机号取尾号。
 */
export function getUserAvatarInitial(user: {
  email?: string | null;
  phone?: string | null;
  user_metadata?: Record<string, unknown>;
}): string {
  const email = user.email?.trim();

  if (email) {
    const username = authEmailToDisplayName(email);
    if (username) {
      return username.charAt(0).toUpperCase() || "U";
    }
  }

  const phoneE164 = getPhoneFromUser(user);

  if (phoneE164) {
    const local = getCnMobileLocal(phoneE164);
    return local.slice(-1) || "U";
  }

  if (email && !isUsernameAuthEmail(email) && !email.endsWith(`@${PHONE_AUTH_EMAIL_DOMAIN}`)) {
    return email.charAt(0).toUpperCase() || "U";
  }

  return "U";
}
