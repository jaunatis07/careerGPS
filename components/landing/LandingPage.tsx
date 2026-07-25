import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    title: "岗位全景数据库",
    description:
      "直观展示各类目标岗位的核心信息与行业全貌，告别信息差。",
  },
  {
    title: "职业测评与定位",
    description:
      "通过深度测试全面了解自己，精准定位最适合的发展方向与岗位。",
  },
  {
    title: "AI 生涯导师规划",
    description:
      "确定目标职业后，由 AI 导师为你量身定制分阶段、可执行的成长规划。",
  },
  {
    title: "求职实战全链路赋能",
    description:
      "提供 AI 岗位排雷、JD 深度拆解与智能简历修改，助你高效通关。",
  },
] as const;

/**
 * 产品落地页：极简居中布局，介绍核心价值并引导登录注册。
 */
export function LandingPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-xl text-center">
        <header className="space-y-3">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            CareerGPS
          </h1>
          <p className="mx-auto max-w-lg text-base leading-6 text-muted-foreground sm:text-[1.0625rem]">
            一款专为求职者打造的 AI 智能职业规划平台，帮你从认知自我到精准通关。
          </p>
        </header>

        <ol className="mt-10 space-y-7 sm:mt-11 sm:space-y-8">
          {FEATURES.map((feature, index) => (
            <li key={feature.title} className="list-none">
              <div className="mx-auto max-w-md space-y-1">
                <p
                  aria-hidden
                  className="text-[0.6875rem] font-medium tracking-[0.28em] text-muted-foreground/45 tabular-nums"
                >
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="text-[0.9375rem] font-medium leading-snug tracking-wide text-foreground/90 sm:text-base">
                  {feature.title}
                </h2>
                <p className="pt-0.5 text-sm leading-snug text-muted-foreground sm:text-[0.9375rem]">
                  {feature.description}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 sm:mt-11">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "h-11 min-w-[220px] px-8 text-base shadow-sm",
            )}
          >
            前往登录 / 注册
          </Link>
        </div>
      </div>
    </main>
  );
}
