import { createHmac, randomInt, timingSafeEqual } from "crypto";

import { getCnMobileLocal } from "@/lib/utils/phone";

const OTP_TTL_MS = 5 * 60 * 1000;

function getOtpSecret(): string {
  return (
    process.env.OTP_HASH_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "careergps-dev-otp-secret"
  );
}

function hashOtp(code: string): string {
  return createHmac("sha256", getOtpSecret()).update(code).digest("hex");
}

function signPayload(payload: string): string {
  return createHmac("sha256", getOtpSecret()).update(payload).digest("base64url");
}

export function generateOtpCode(): string {
  return randomInt(100000, 1000000).toString();
}

export function createOtpToken(phoneE164: string, code: string): string {
  const payload = JSON.stringify({
    phone: phoneE164,
    hash: hashOtp(code),
    exp: Date.now() + OTP_TTL_MS,
  });

  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `${encoded}.${signPayload(encoded)}`;
}

export function verifyOtpToken(
  otpToken: string,
  phoneE164: string,
  code: string,
): boolean {
  const [encoded, signature] = otpToken.split(".");

  if (!encoded || !signature) {
    return false;
  }

  const expectedSignature = signPayload(encoded);

  try {
    const signatureBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return false;
    }
  } catch {
    return false;
  }

  let payload: { phone?: string; hash?: string; exp?: number };

  try {
    payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as { phone?: string; hash?: string; exp?: number };
  } catch {
    return false;
  }

  if (payload.phone !== phoneE164 || !payload.hash || !payload.exp) {
    return false;
  }

  if (Date.now() > payload.exp) {
    return false;
  }

  const codeHash = hashOtp(code.trim());

  try {
    const actualBuffer = Buffer.from(codeHash, "utf8");
    const expectedBuffer = Buffer.from(payload.hash, "utf8");

    return (
      actualBuffer.length === expectedBuffer.length &&
      timingSafeEqual(actualBuffer, expectedBuffer)
    );
  } catch {
    return false;
  }
}

const lastSentAtByPhone = new Map<string, number>();

export function assertOtpSendAllowed(phoneE164: string): void {
  const cooldownMs = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS ?? 60) * 1000;
  const lastSentAt = lastSentAtByPhone.get(phoneE164) ?? 0;

  if (Date.now() - lastSentAt < cooldownMs) {
    const waitSeconds = Math.ceil((cooldownMs - (Date.now() - lastSentAt)) / 1000);
    throw new Error(`请 ${waitSeconds} 秒后再获取验证码`);
  }
}

export function markOtpSent(phoneE164: string): void {
  lastSentAtByPhone.set(phoneE164, Date.now());
}

export function getSmsPhoneNumber(phoneE164: string): string {
  return getCnMobileLocal(phoneE164);
}
