interface PageShellProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

/**
 * Dashboard 子页面的统一标题与内容容器。
 */
export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <section className="space-y-4 sm:space-y-6">
      <header className="space-y-1.5 sm:space-y-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
          {title}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          {description}
        </p>
      </header>
      {children}
    </section>
  );
}
