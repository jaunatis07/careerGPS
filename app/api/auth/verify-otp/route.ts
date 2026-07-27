import { establishPhoneAuthSession } from "@/lib/auth/phone-session";
import { verifyOtpToken } from "@/lib/auth/phone-otp";
import { normalizePhoneToE164 } from "@/lib/utils/phone";

export const runtime = "nodejs";

interface VerifyOtpBody {
  phone?: string;
  code?: string;
  otpToken?: string;
}

/**
 * POST /api/auth/verify-otp — 校验短信验证码并建立 Supabase 会话
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyOtpBody;
    const phoneE164 = normalizePhoneToE164(body.phone ?? "");
    const code = body.code?.trim() ?? "";
    const otpToken = body.otpToken?.trim() ?? "";

    if (!phoneE164) {
      return Response.json({ error: "请输入有效的中国大陆手机号" }, { status: 400 });
    }

    if (!/^\d{6}$/.test(code)) {
      return Response.json({ error: "请输入 6 位数字验证码" }, { status: 400 });
    }

    if (!otpToken) {
      return Response.json({ error: "请先获取验证码" }, { status: 400 });
    }

    if (!verifyOtpToken(otpToken, phoneE164, code)) {
      return Response.json({ error: "验证码错误或已过期，请重新获取" }, { status: 400 });
    }

    await establishPhoneAuthSession(phoneE164);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "登录失败，请稍后重试",
      },
      { status: 500 },
    );
  }
}
