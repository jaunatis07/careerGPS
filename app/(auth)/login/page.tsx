import { LoginForm } from "@/components/auth/LoginForm";

interface LoginPageProps {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background p-4 sm:p-6">
      <LoginForm
        redirectTo={params.next}
        initialError={params.error}
      />
    </main>
  );
}
