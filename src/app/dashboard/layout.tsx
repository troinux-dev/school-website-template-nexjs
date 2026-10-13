import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink, LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getSiteSettings } from "@/lib/content";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Flash } from "@/components/dashboard/flash";
import { Logo } from "@/components/site/header";
import { signOutAction } from "@/app/portal/actions";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const s = await getSiteSettings();
  if (!s.onboarded) redirect("/onboarding");
  const u = await requireUser();
  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="flex h-18 items-center justify-between gap-3 px-4 sm:px-6">
          <Logo name={s.schoolName} logoUrl={s.logoUrl} />
          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="font-semibold leading-tight">{u.name}</p>
              <p className="text-sm text-slate-600">{u.role === "admin" ? "Admin" : "Staff"}</p>
            </div>
            <Link href="/" target="_blank" className="inline-flex min-h-12 items-center gap-2 rounded-xl px-3 font-semibold text-primary-ink hover:bg-primary-soft">
              <ExternalLink className="size-5" aria-hidden /> <span className="hidden md:inline">View website</span>
              <span className="sr-only md:hidden">View website</span>
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="inline-flex min-h-12 items-center gap-2 rounded-xl px-3 font-semibold text-slate-700 hover:bg-slate-100">
                <LogOut className="size-5" aria-hidden /> <span className="hidden md:inline">Sign out</span>
                <span className="sr-only md:hidden">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="lg:flex">
        <Sidebar role={u.role} />
        <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Suspense>
            <Flash />
          </Suspense>
          {children}
        </main>
      </div>
    </div>
  );
}
