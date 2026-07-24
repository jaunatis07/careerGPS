"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
import { createClient } from "@/lib/supabase/client";

type LoginStep = "email" | "otp";

interface LoginFormProps {
  redirectTo?: string;
  initialError?: string;
}

/**
 * 登录/注册表单：支持邮箱验证码（OTP）与 GitHub OAuth 两种方式。
 */
export function LoginForm({ redirectTo, initialError }: LoginFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState<string | null>(initialError ?? null);
  const [isLoading, setIsLoading] = useState(false);

  const destination = redirectTo || DEFAULT_AUTH_REDIRECT;

  async function handleSendOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        throw error;
      }

      setStep("otp");
      setMessage("验证码已发送，请查收邮箱（含垃圾箱）");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "发送验证码失败，请稍后重试",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) {
        throw error;
      }

      router.push(destination);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "验证码无效或已过期，请重试",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGitHubLogin() {
    setMessage(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", destination);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "GitHub 登录失败，请稍后重试",
      );
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>登录 / 注册 CareerGPS</CardTitle>
        <CardDescription>
          使用邮箱验证码或 GitHub 账号登录，新用户将自动注册
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === "email" ? (
          <form className="space-y-4" onSubmit={handleSendOtp}>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱地址</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "发送中..." : "发送验证码"}
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleVerifyOtp}>
            <div className="space-y-2">
              <Label htmlFor="otp">邮箱验证码</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="输入 6 位验证码"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                required
                maxLength={6}
                autoComplete="one-time-code"
              />
              <p className="text-xs text-muted-foreground">
                验证码已发送至 {email}
              </p>
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "验证中..." : "验证并登录"}
            </Button>
            <Button
              className="w-full"
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => {
                setStep("email");
                setOtp("");
                setMessage(null);
              }}
            >
              更换邮箱
            </Button>
          </form>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">或</span>
          </div>
        </div>

        <Button
          className="w-full"
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={handleGitHubLogin}
        >
          使用 GitHub 登录
        </Button>

        {message ? (
          <p
            className={`text-sm ${
              message.includes("已发送")
                ? "text-green-600 dark:text-green-400"
                : "text-destructive"
            }`}
          >
            {message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
