import { phoneToAuthEmail } from "@/lib/auth/phone-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/supabase/ensure-user-profile";
import { formatPhoneDisplay } from "@/lib/utils/phone";

/**
 * 验证码通过后，在 Supabase 中创建/获取手机号用户并写入 Cookie 会话。
 * 使用内部邮箱桥接，无需邮件确认或境外回调链接。
 */
export async function establishPhoneAuthSession(phoneE164: string): Promise<void> {
  const admin = createAdminClient();
  const email = phoneToAuthEmail(phoneE164);
  const displayPhone = formatPhoneDisplay(phoneE164);

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      phone: displayPhone,
      phone_e164: phoneE164,
      auth_method: "phone",
    },
  });

  if (
    createError &&
    !createError.message.toLowerCase().includes("already") &&
    createError.status !== 422
  ) {
    throw new Error(createError.message || "创建账号失败，请稍后重试");
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkError || !linkData.properties.hashed_token) {
    throw new Error(linkError?.message || "建立登录会话失败，请稍后重试");
  }

  const supabase = await createClient();
  const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "email",
  });

  if (verifyError || !sessionData.user) {
    throw new Error(verifyError?.message || "登录验证失败，请重试");
  }

  await ensureUserProfile(sessionData.user.id);
}
