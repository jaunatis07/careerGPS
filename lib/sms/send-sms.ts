import { createHash, createHmac, randomUUID } from "crypto";

import { getSmsPhoneNumber } from "@/lib/auth/phone-otp";

export type SmsProviderName = "console" | "webhook" | "aliyun" | "tencent";

function getSmsProviderName(): SmsProviderName {
  const provider = process.env.SMS_PROVIDER?.trim().toLowerCase();

  if (
    provider === "webhook" ||
    provider === "aliyun" ||
    provider === "tencent"
  ) {
    return provider;
  }

  return "console";
}

async function sendViaConsole(phoneE164: string, code: string): Promise<void> {
  console.info("[CareerGPS][sms:console]", {
    phone: phoneE164,
    code,
    message: "开发模式：验证码已输出到服务端日志",
  });
}

async function sendViaWebhook(phoneE164: string, code: string): Promise<void> {
  const webhookUrl = process.env.SMS_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    throw new Error("未配置 SMS_WEBHOOK_URL");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.SMS_WEBHOOK_SECRET
        ? { Authorization: `Bearer ${process.env.SMS_WEBHOOK_SECRET}` }
        : {}),
    },
    body: JSON.stringify({
      phone: getSmsPhoneNumber(phoneE164),
      phoneE164,
      code,
      template: "login",
    }),
  });

  if (!response.ok) {
    throw new Error(`短信网关返回异常（${response.status}）`);
  }
}

function percentEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/\+/g, "%20")
    .replace(/\*/g, "%2A")
    .replace(/%7E/g, "~");
}

function buildAliyunSignature(
  params: Record<string, string>,
  accessKeySecret: string,
): string {
  const canonicalized = Object.keys(params)
    .sort()
    .map((key) => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join("&");

  const stringToSign = `GET&${percentEncode("/")}&${percentEncode(canonicalized)}`;

  return createHmac("sha1", `${accessKeySecret}&`)
    .update(stringToSign)
    .digest("base64");
}

async function sendViaAliyun(phoneE164: string, code: string): Promise<void> {
  const accessKeyId = process.env.ALIYUN_SMS_ACCESS_KEY_ID?.trim();
  const accessKeySecret = process.env.ALIYUN_SMS_ACCESS_KEY_SECRET?.trim();
  const signName = process.env.ALIYUN_SMS_SIGN_NAME?.trim();
  const templateCode = process.env.ALIYUN_SMS_TEMPLATE_CODE?.trim();

  if (!accessKeyId || !accessKeySecret || !signName || !templateCode) {
    throw new Error("阿里云短信环境变量未配置完整");
  }

  const params: Record<string, string> = {
    AccessKeyId: accessKeyId,
    Action: "SendSms",
    Format: "JSON",
    PhoneNumbers: getSmsPhoneNumber(phoneE164),
    RegionId: process.env.ALIYUN_SMS_REGION_ID?.trim() || "cn-hangzhou",
    SignName: signName,
    SignatureMethod: "HMAC-SHA1",
    SignatureNonce: randomUUID(),
    SignatureVersion: "1.0",
    TemplateCode: templateCode,
    TemplateParam: JSON.stringify({ code }),
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    Version: "2017-05-25",
  };

  params.Signature = buildAliyunSignature(params, accessKeySecret);

  const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

  const response = await fetch(`https://dysmsapi.aliyuncs.com/?${query}`);
  const data = (await response.json()) as { Code?: string; Message?: string };

  if (!response.ok || data.Code !== "OK") {
    throw new Error(data.Message ?? "阿里云短信发送失败");
  }
}

async function sendViaTencent(phoneE164: string, code: string): Promise<void> {
  const secretId = process.env.TENCENT_SMS_SECRET_ID?.trim();
  const secretKey = process.env.TENCENT_SMS_SECRET_KEY?.trim();
  const sdkAppId = process.env.TENCENT_SMS_SDK_APP_ID?.trim();
  const signName = process.env.TENCENT_SMS_SIGN_NAME?.trim();
  const templateId = process.env.TENCENT_SMS_TEMPLATE_ID?.trim();

  if (!secretId || !secretKey || !sdkAppId || !signName || !templateId) {
    throw new Error("腾讯云短信环境变量未配置完整");
  }

  const service = "sms";
  const host = "sms.tencentcloudapi.com";
  const action = "SendSms";
  const version = "2021-01-11";
  const region = process.env.TENCENT_SMS_REGION?.trim() || "ap-guangzhou";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = JSON.stringify({
    PhoneNumberSet: [`+86${getSmsPhoneNumber(phoneE164)}`],
    SmsSdkAppId: sdkAppId,
    SignName: signName,
    TemplateId: templateId,
    TemplateParamSet: [code],
  });

  const canonicalHeaders =
    "content-type:application/json; charset=utf-8\nhost:sms.tencentcloudapi.com\n";
  const signedHeaders = "content-type;host";
  const hashedRequestPayload = createHash("sha256").update(payload).digest("hex");
  const canonicalRequest = [
    "POST",
    "/",
    "",
    canonicalHeaders,
    signedHeaders,
    hashedRequestPayload,
  ].join("\n");

  const credentialScope = `${timestamp.slice(0, 8)}/${service}/tc3_request`;
  const stringToSign = [
    "TC3-HMAC-SHA256",
    timestamp,
    credentialScope,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  const secretDate = createHmac("sha256", `TC3${secretKey}`)
    .update(timestamp.slice(0, 8))
    .digest();
  const secretService = createHmac("sha256", secretDate).update(service).digest();
  const secretSigning = createHmac("sha256", secretService)
    .update("tc3_request")
    .digest();
  const signature = createHmac("sha256", secretSigning)
    .update(stringToSign)
    .digest("hex");

  const authorization = `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(`https://${host}`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json; charset=utf-8",
      Host: host,
      "X-TC-Action": action,
      "X-TC-Timestamp": timestamp,
      "X-TC-Version": version,
      "X-TC-Region": region,
    },
    body: payload,
  });

  const data = (await response.json()) as {
    Response?: { Error?: { Message?: string }; SendStatusSet?: Array<{ Code?: string }> };
  };

  const sendStatus = data.Response?.SendStatusSet?.[0];

  if (
    !response.ok ||
    data.Response?.Error ||
    (sendStatus?.Code && sendStatus.Code !== "Ok")
  ) {
    throw new Error(
      data.Response?.Error?.Message ?? sendStatus?.Code ?? "腾讯云短信发送失败",
    );
  }
}

/**
 * 通过国内可直连通道发送登录验证码短信。
 */
export async function sendLoginSms(
  phoneE164: string,
  code: string,
): Promise<void> {
  const provider = getSmsProviderName();

  switch (provider) {
    case "webhook":
      await sendViaWebhook(phoneE164, code);
      return;
    case "aliyun":
      await sendViaAliyun(phoneE164, code);
      return;
    case "tencent":
      await sendViaTencent(phoneE164, code);
      return;
    case "console":
    default:
      await sendViaConsole(phoneE164, code);
  }
}

export function shouldExposeDevOtpHint(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    getSmsProviderName() === "console"
  );
}
