"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { accountToAuthEmail } from "@/lib/auth/account-email";
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

function mapAuthErrorMessage(error: Error): string {
  const message = error.message.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "账号或密码错误，请检查后重试";
  }

  if (message.includes("user already registered")) {
    return "该账号已存在，请直接登录";
  }

  if (message.includes("password") && message.includes("least")) {
    return `密码至少 ${MIN_PASSWORD_LENGTH} 位`;
  }

  if (message.includes("email rate limit")) {
    return "操作过于频繁，请稍后再试";
  }

  return error.message || "操作失败，请稍后重试";
}

/**
 * 账号 + 密码登录/注册（底层走 Supabase Email Auth，账号自动映射为虚拟邮箱）。
 */
export function LoginForm({ redirectTo, initialError }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(initialError ?? null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const destination = redirectTo || DEFAULT_AUTH_REDIRECT;

  const accountPreview = useMemo(() => {
    if (!account.trim()) {
      return "账号@careergps.local";
    }

    try {
      return accountToAuthEmail(account);
    } catch {
      return "账号@careergps.local";
    }
  }, [account]);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

      const authEmail = accountToAuthEmail(account);
      const supabase = createClient();

      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password,
        });

        if (error) {
          throw error;
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password,
        });

        if (error) {
          throw error;
        }

        if (!data.session) {
          setIsSuccess(true);
          setMessage(
            "注册成功。若无法直接登录，请在 Supabase 控制台关闭 Email Confirm 后重试，或切换到「登录」",
          );
          return;
        }
      }

      router.push(destination);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? mapAuthErrorMessage(error)
          : "操作失败，请稍后重试",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>登录 / 注册 CareerGPS</CardTitle>
        <CardDescription>
          使用账号与密码登录，无需绑定真实邮箱
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

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="account">账号</Label>
            <Input
              id="account"
              type="text"
              placeholder="例如：myname"
              value={account}
              onChange={(event) => setAccount(event.target.value)}
              required
              autoComplete="username"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              系统将自动映射为 {accountPreview}
            </p>
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
