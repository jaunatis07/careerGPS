"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { QuotaBadge } from "@/components/shared/QuotaBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NAV_ITEMS } from "@/lib/constants/navigation";
import { QUOTA_ENFORCEMENT_ENABLED } from "@/lib/constants/quota";
import { cn } from "@/lib/utils";
import type { QuotaSummary } from "@/types";

interface NavbarProps {
  displayName: string;
  quota: QuotaSummary;
}

/**
 * 获取展示名称首字符，用作头像占位符。
 */
function getDisplayInitial(displayName: string) {
  const trimmed = displayName.trim();
  return trimmed.charAt(trimmed.length - 1).toUpperCase() || "U";
}

/**
 * Dashboard 顶部导航：Logo、模块 Tab、额度徽章与头像；移动端使用 Sheet 抽屉。
 */
export function Navbar({ displayName, quota }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-8">
          <Link
            href="/mindmap"
            className="shrink-0 text-sm font-semibold tracking-tight sm:text-base"
          >
            CareerGPS
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {QUOTA_ENFORCEMENT_ENABLED ? <QuotaBadge quota={quota} /> : null}

          <Link
            href="/profile"
            aria-label="个人主页"
            title="个人主页"
            className={cn(
              "inline-flex shrink-0 cursor-pointer rounded-full ring-offset-background transition-opacity hover:opacity-80",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              (pathname === "/profile" || pathname.startsWith("/profile/")) &&
                "ring-2 ring-primary ring-offset-2",
            )}
          >
            <Avatar size="sm">
              <AvatarFallback>{getDisplayInitial(displayName)}</AvatarFallback>
            </Avatar>
          </Link>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden"
                  aria-label="打开导航菜单"
                />
              }
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>模块导航</SheetTitle>
              </SheetHeader>
              <div className="mt-4 px-4">
                {QUOTA_ENFORCEMENT_ENABLED ? (
                  <p className="mb-4 text-sm text-muted-foreground">
                    {quota.remaining <= 0
                      ? "今日额度已用尽"
                      : `今日剩余 ${quota.remaining}/${quota.limit} 次`}
                  </p>
                ) : null}
                <nav className="flex flex-col gap-1">
                  {NAV_ITEMS.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
