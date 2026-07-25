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
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-16 sm:px-6">
      <div className="mx-auto w-full max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          CareerGPS
        </h1>

        <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
          一款专为求职者打造的 AI 智能职业规划平台，帮你从认知自我到精准通关。
        </p>

        <ul className="mt-12 space-y-4 text-left">
          {FEATURES.map((feature) => (
            <li
              key={feature.title}
              className="rounded-xl border bg-card/50 px-5 py-4 transition-colors hover:bg-card"
            >
              <h2 className="text-sm font-semibold">{feature.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-12">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "h-11 min-w-[200px] px-8 text-base",
            )}
          >
            前往登录 / 注册
          </Link>
        </div>
      </div>
    </main>
  );
}
