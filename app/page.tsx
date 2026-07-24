import Link from "next/link";

import { SupabaseStatus } from "@/components/shared/SupabaseStatus";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold tracking-tight">Hello World</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400">
        CareerGPS 项目脚手架已就绪
      </p>
      <SupabaseStatus />
      <Link
        href="/login"
        className="text-sm text-primary underline-offset-4 hover:underline"
      >
        前往登录 / 注册
      </Link>
    </main>
  );
}
