import {
  assertOtpSendAllowed,
  createOtpToken,
  generateOtpCode,
  markOtpSent,
} from "@/lib/auth/phone-otp";
import { sendLoginSms, shouldExposeDevOtpHint } from "@/lib/sms/send-sms";
import { normalizePhoneToE164 } from "@/lib/utils/phone";

export const runtime = "nodejs";

interface SendOtpBody {
  phone?: string;
}

/**
 * POST /api/auth/send-otp — 发送登录短信验证码（国内通道）
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SendOtpBody;
    const phoneE164 = normalizePhoneToE164(body.phone ?? "");

    if (!phoneE164) {
      return Response.json({ error: "请输入有效的中国大陆手机号" }, { status: 400 });
    }

    assertOtpSendAllowed(phoneE164);

    const code = generateOtpCode();
    await sendLoginSms(phoneE164, code);
    markOtpSent(phoneE164);

    const otpToken = createOtpToken(phoneE164, code);

    return Response.json({
      success: true,
      otpToken,
      expiresIn: 300,
      ...(shouldExposeDevOtpHint()
        ? { devHint: "开发模式：验证码见服务端终端日志" }
        : {}),
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "验证码发送失败，请稍后重试",
      },
      { status: 500 },
    );
  }
}
