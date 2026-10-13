import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText, Images, Lock, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Logo } from "@/components/site/header";
import { getPage, getSiteSettings } from "@/lib/content";
import { getCurrentUser } from "@/lib/session";
import { DEV_LOGIN_ENABLED } from "@/auth";
import { signInAction } from "./actions";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  CredentialsSignin: "That email and password don't match an account. Check them and try again.",
  NotInvited: "That account hasn't been given access yet. Ask the school admin to invite you.",
  AccessDenied: "That account hasn't been given access yet. Ask the school admin to invite you.",
  Default: "We couldn't sign you in. Please try again.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PortalPage({ searchParams }: Props) {
  const sp = await searchParams;
  const s = await getSiteSettings();
  if (!s.onboarded) redirect("/onboarding");
  if (await getCurrentUser().catch(() => null)) redirect("/dashboard");
  const contact = await getPage("contact");
  const officePhone = contact.phone;
  const errKey = typeof sp.error === "string" ? sp.error : "";
  const error = errKey ? ERRORS[errKey] ?? ERRORS.Default : "";
  const email = typeof sp.email === "string" ? sp.email : "";

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="container-page flex h-18 items-center justify-between gap-4 py-2">
          <Logo name={s.schoolName} logoUrl={s.logoUrl} />
          <Link href="/" className="inline-flex min-h-12 items-center gap-2 font-semibold text-primary-ink">
            <ArrowLeft className="size-5" aria-hidden /> Back to website
          </Link>
        </div>
      </header>
      <main id="main" className="container-page grid gap-8 py-10 lg:grid-cols-[minmax(0,28rem)_1fr] lg:items-start">
        <div className="card p-5 sm:p-8">
          <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-slate-700">Use your school Microsoft account. You&apos;ll confirm with the Microsoft Authenticator app.</p>
          {sp.welcome === "1" && (
            <p className="mt-4 rounded-xl bg-green-50 p-4 font-semibold text-green-900" role="status">
              Your website is set up. Sign in with the administrator email you entered to open the dashboard.
            </p>
          )}
          {error && (
            <p className="mt-4 rounded-xl bg-red-50 p-4 font-semibold text-red-800" role="alert">{error}</p>
          )}
          <form action={signInAction} className="mt-6 space-y-5">
            <Field label="School email" htmlFor="email" required>
              <Input id="email" name="email" type="email" autoComplete="username" autoCapitalize="none" autoCorrect="off" defaultValue={email} required />
            </Field>
            {DEV_LOGIN_ENABLED && (
              <Field label="Password" htmlFor="password" required hint="Development sign-in only (AUTH_DEV_LOGIN). Your real password is entered on Microsoft's page.">
                <Input id="password" name="password" type="password" autoComplete="current-password" />
              </Field>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="inline-flex min-h-12 cursor-pointer items-center gap-3 font-semibold">
                <input type="checkbox" name="remember" className="size-5 accent-[var(--brand-primary)]" />
                Keep me signed in
              </label>
              <a href="https://passwordreset.microsoftonline.com/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center font-semibold text-primary-ink underline underline-offset-4">
                Forgot password?
              </a>
            </div>
            <Button type="submit" name="intent" value="entra" size="full">
              <ShieldCheck aria-hidden /> Sign in with Microsoft
            </Button>
            {DEV_LOGIN_ENABLED && (
              <Button type="submit" name="intent" value="dev" variant="outline" size="full">
                Sign in (development)
              </Button>
            )}
          </form>
          {officePhone && (
            <p className="mt-6 text-slate-700">
              Need help? Call the school office on{" "}
              <a href={`tel:${officePhone.replace(/[^\d+]/g, "")}`} className="inline-flex min-h-12 items-center font-semibold text-primary-ink underline underline-offset-4">{officePhone}</a>.
            </p>
          )}
        </div>

        {/* PO-02 */}
        <aside className="rounded-2xl bg-primary p-6 text-primary-fg sm:p-8">
          <h2 className="text-xl font-semibold text-primary-fg">What you can manage</h2>
          <ul className="mt-5 space-y-4">
            {[
              { icon: Images, label: "Gallery", text: "Upload and remove photos." },
              { icon: CalendarDays, label: "Calendar", text: "Add public and private events." },
              { icon: FileText, label: "Admissions", text: "Open or close admissions." },
              { icon: Lock, label: "Website content", text: "Edit pages, news and users.", adminOnly: true },
            ].map(({ icon: Icon, label, text, adminOnly }) => (
              <li key={label} className="flex gap-3">
                <Icon className="mt-0.5 size-6 shrink-0 text-accent-on-primary" aria-hidden />
                <div>
                  <p className="font-semibold">
                    {label}
                    {adminOnly && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-fg">Admin only</span>}
                  </p>
                  <p className="opacity-90">{text}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 flex items-center gap-2 text-sm opacity-90">
            <CalendarDays className="size-4" aria-hidden /> Signed-in users also see private calendar events.
          </p>
        </aside>
      </main>
    </div>
  );
}
