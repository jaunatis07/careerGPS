"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_AUTH_REDIRECT } from "@/lib/constants/auth";
import { cn } from "@/lib/utils";

interface LoginFormProps {
  redirectTo?: string;
  initialError?: string;
}

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * 手机号 + 短信验证码登录/注册（统一入口，无境外邮件跳转）。
 */
export function LoginForm({ redirectTo, initialError }: LoginFormProps) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(initialError ?? null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [devHint, setDevHint] = useState<string | null>(null);

  const destination = redirectTo || DEFAULT_AUTH_REDIRECT;
  const isBusy = isSending || isVerifying;

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  function resetFeedback() {
    setMessage(null);
    setIsSuccess(false);
  }

  async function handleSendOtp() {
    resetFeedback();
    setDevHint(null);

    if (!phone.trim()) {
      setMessage("请输入手机号");
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = (await response.json()) as {
        otpToken?: string;
        devHint?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "验证码发送失败");
      }

      setOtpToken(data.otpToken ?? null);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setIsSuccess(true);
      setMessage("验证码已发送，请注意查收短信");
      setDevHint(data.devHint ?? null);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "验证码发送失败，请稍后重试",
      );
    } finally {
      setIsSending(false);
    }
  }

  async function handleVerifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();

    if (!otpToken) {
      setMessage("请先点击「获取验证码」");
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          code: otpCode,
          otpToken,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "登录失败");
      }

      router.push(destination);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "登录失败，请稍后重试",
      );
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>登录 / 注册 CareerGPS</CardTitle>
        <CardDescription>
          使用手机号与短信验证码登录，新用户验证通过后自动注册
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={handleVerifyOtp}>
          <div className="space-y-2">
            <Label htmlFor="phone">手机号</Label>
            <div className="flex gap-2">
              <div className="flex h-9 shrink-0 items-center rounded-lg border bg-muted/40 px-3 text-sm text-muted-foreground">
                +86
              </div>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="请输入 11 位手机号"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
                autoComplete="tel"
                disabled={isBusy}
                maxLength={13}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="otp-code">短信验证码</Label>
            <div className="flex gap-2">
              <Input
                id="otp-code"
                type="text"
                inputMode="numeric"
                placeholder={`${OTP_LENGTH} 位验证码`}
                value={otpCode}
                onChange={(event) =>
                  setOtpCode(event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))
                }
                required
                autoComplete="one-time-code"
                disabled={isBusy}
                maxLength={OTP_LENGTH}
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0 px-3"
                disabled={isBusy || cooldown > 0}
                onClick={() => void handleSendOtp()}
              >
                {isSending
                  ? "发送中..."
                  : cooldown > 0
                    ? `${cooldown}s`
                    : "获取验证码"}
              </Button>
            </div>
          </div>

          <Button className="w-full" type="submit" disabled={isBusy}>
            {isVerifying ? "登录中..." : "登录 / 注册"}
          </Button>
        </form>

        {message ? (
          <p
            className={cn(
              "text-sm",
              isSuccess
                ? "text-green-600 dark:text-green-400"
                : "text-destructive",
            )}
          >
            {message}
          </p>
        ) : null}

        {devHint ? (
          <p className="text-xs text-muted-foreground">{devHint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
