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
import { cn } from "@/lib/utils";

type AuthMode = "signin" | "signup";

interface LoginFormProps {
  redirectTo?: string;
  initialError?: string;
}

const MIN_PASSWORD_LENGTH = 6;

/**
 * 登录/注册表单：邮箱 + 密码，以及 GitHub OAuth。
 */
export function LoginForm({ redirectTo, initialError }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(initialError ?? null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const destination = redirectTo || DEFAULT_AUTH_REDIRECT;

  function resetFeedback() {
    setMessage(null);
    setIsSuccess(false);
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    resetFeedback();
  }

  async function handleEmailAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();
    setIsLoading(true);

    try {
      if (password.length < MIN_PASSWORD_LENGTH) {
        throw new Error(`密码至少 ${MIN_PASSWORD_LENGTH} 位`);
      }

      if (mode === "signup" && password !== confirmPassword) {
        throw new Error("两次输入的密码不一致");
      }

      const supabase = createClient();

      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        if (!data.session) {
          setIsSuccess(true);
          setMessage(
            "注册成功。若 Supabase 开启了邮箱确认，请先查收确认邮件；否则请直接切换到「登录」",
          );
          return;
        }
      }

      router.push(destination);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "操作失败，请稍后重试",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGitHubLogin() {
    resetFeedback();
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
          使用邮箱与密码注册或登录，也可通过 GitHub 快捷登录
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
          <button
            type="button"
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              mode === "signin"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            disabled={isLoading}
            onClick={() => switchMode("signin")}
          >
            登录
          </button>
          <button
            type="button"
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              mode === "signup"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            disabled={isLoading}
            onClick={() => switchMode("signup")}
          >
            注册
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleEmailAuth}>
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
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder={`至少 ${MIN_PASSWORD_LENGTH} 位`}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              disabled={isLoading}
            />
          </div>

          {mode === "signup" ? (
            <div className="space-y-2">
              <Label htmlFor="confirm-password">确认密码</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>
          ) : null}

          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading
              ? "处理中..."
              : mode === "signin"
                ? "登录"
                : "注册并登录"}
          </Button>
        </form>

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
      </CardContent>
    </Card>
  );
}
