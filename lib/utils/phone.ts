const CN_MOBILE_PATTERN = /^1[3-9]\d{9}$/;

/**
 * 校验中国大陆 11 位手机号（不含国家码）。
 */
export function isValidCnMobile(phone: string): boolean {
  return CN_MOBILE_PATTERN.test(phone.trim());
}

/**
 * 规范化用户输入为 E.164（默认 +86）。
 */
export function normalizePhoneToE164(input: string): string | null {
  const digits = input.replace(/\D/g, "");

  if (digits.length === 11 && isValidCnMobile(digits)) {
    return `+86${digits}`;
  }

  if (digits.length === 13 && digits.startsWith("86") && isValidCnMobile(digits.slice(2))) {
    return `+${digits}`;
  }

  return null;
}

/**
 * 将 E.164 格式化为用户可读形式：+86 138****8000
 */
export function formatPhoneDisplay(phoneE164: string): string {
  const local = phoneE164.replace(/^\+86/, "");

  if (local.length === 11) {
    return `+86 ${local.slice(0, 3)}****${local.slice(7)}`;
  }

  return phoneE164;
}

/**
 * 获取手机号本地 11 位数字（不含 +86）。
 */
export function getCnMobileLocal(phoneE164: string): string {
  return phoneE164.replace(/^\+86/, "");
}
