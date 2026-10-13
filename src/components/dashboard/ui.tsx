import { cn } from "@/lib/utils";

export function PageTitle({ title, intro, children }: { title: string; intro?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {intro && <p className="mt-1 max-w-2xl text-slate-700">{intro}</p>}
      </div>
      {children}
    </div>
  );
}

export function Panel({ title, id, children, className, action }: { title?: string; id?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={title && id ? `${id}-title` : undefined} className={cn("card scroll-mt-24 p-5 sm:p-6", className)}>
      {title && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id={id ? `${id}-title` : undefined} className="text-lg font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatusPill({ tone, children }: { tone: "green" | "amber" | "slate" | "blue"; children: React.ReactNode }) {
  const map = {
    green: "bg-green-100 text-green-900",
    amber: "bg-amber-100 text-amber-900",
    slate: "bg-slate-100 text-slate-800",
    blue: "bg-blue-100 text-blue-900",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold", map[tone])}>{children}</span>;
}

export function AutoNote() {
  return <StatusPill tone="blue">Updates automatically</StatusPill>;
}
