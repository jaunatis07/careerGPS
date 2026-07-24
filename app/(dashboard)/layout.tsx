import { QuotaProvider } from "@/components/providers/QuotaProvider";
import { getCurrentUserQuota } from "@/lib/quota/get-current-user-quota";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Dashboard 通用布局：顶部 Navbar + 响应式内容区。
 */
export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const quota = await getCurrentUserQuota();

  return (
    <QuotaProvider email={user.email ?? "用户"} initialQuota={quota}>
      <div className="flex min-h-screen flex-col bg-background">
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </QuotaProvider>
  );
}
