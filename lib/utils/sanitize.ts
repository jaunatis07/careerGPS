/**
 * 对文本中的中国大陆手机号进行脱敏，保留前 3 位与后 4 位。
 * 示例：13800138000 -> 138****8000
 */
function maskPhoneNumbers(text: string): string {
  const mobilePattern =
    /(?<!\d)(?:\+?86[-\s]?)?(1[3-9]\d)[-\s]?(\d{4})[-\s]?(\d{4})(?!\d)/g;

  return text.replace(mobilePattern, (_match, prefix, middle, suffix) => {
    return `${prefix}****${suffix}`;
  });
}

/**
 * 对邮箱地址进行脱敏，保留域名，本地部分首尾各 1 字符（过短则全替换为 **）。
 */
function maskEmails(text: string): string {
  return text.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    (email) => {
      const [localPart, domain] = email.split("@");

      if (!localPart || !domain) {
        return "**@**.**";
      }

      if (localPart.length <= 2) {
        return `**@${domain}`;
      }

      return `${localPart[0]}***${localPart.at(-1)}@${domain}`;
    },
  );
}

/**
 * 对 18 位身份证号进行脱敏，保留前 3 位与后 4 位。
 */
function maskIdCards(text: string): string {
  return text.replace(/\b(\d{6})(\d{8,11})(\d{3}[\dXx])\b/g, (_match, start, _middle, end) => {
    return `${start}**********${end}`;
  });
}

/**
 * 对常见中文姓名上下文进行脱敏（如「我叫张三」「姓名：李四」）。
 */
function maskChineseNames(text: string): string {
  let result = text;

  result = result.replace(
    /(我叫)([\u4e00-\u9fa5]{2,4})/g,
    (_match, prefix: string, name: string) => `${prefix}${"*".repeat(name.length)}`,
  );

  result = result.replace(
    /(姓名|联系人|真实姓名)\s*[:：]?\s*([\u4e00-\u9fa5]{2,4})/g,
    (_match, label: string, name: string) =>
      `${label}：${"*".repeat(name.length)}`,
  );

  return result;
}

export interface SanitizeResult {
  /** 脱敏后的文本 */
  text: string;
  /** 是否检测到并处理了敏感信息 */
  hasSensitiveData: boolean;
}

/**
 * 对简历或 JD 文本中的手机号、邮箱、身份证与真实姓名进行正则脱敏。
 * 建议在将用户内容提交给大模型之前调用。
 */
export function sanitizeResumeText(input: string): string {
  return sanitizeResumeTextDetailed(input).text;
}

/**
 * 脱敏并返回是否命中敏感字段，便于 API 层记录或提示。
 */
export function sanitizeResumeTextDetailed(input: string): SanitizeResult {
  const original = input;

  if (!original.trim()) {
    return { text: original, hasSensitiveData: false };
  }

  let text = original;
  text = maskIdCards(text);
  text = maskEmails(text);
  text = maskPhoneNumbers(text);
  text = maskChineseNames(text);

  return {
    text,
    hasSensitiveData: text !== original,
  };
}
