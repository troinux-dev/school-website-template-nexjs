"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Menu, UserRound, X, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
  { href: "/calendar", label: "Calendar" },
  { href: "/contact", label: "Contact Us" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

export function Logo({ name, logoUrl }: { name: string; logoUrl: string }) {
  return (
    <Link href="/" className="flex min-h-12 min-w-0 items-center gap-3 rounded-lg" aria-label={`${name} — home`}>
      {logoUrl ? (
        <Image src={logoUrl} alt="" width={44} height={44} className="size-11 shrink-0 rounded-lg object-contain" />
      ) : (
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary text-accent-on-primary" aria-hidden>
          <GraduationCap className="size-6" />
        </span>
      )}
      <span className="truncate font-heading text-base font-semibold leading-tight text-primary-ink sm:text-lg">{name}</span>
    </Link>
  );
}

export function Header({ name, logoUrl, admissionsOpen }: { name: string; logoUrl: string; admissionsOpen: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuId = useId();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="container-page flex h-18 items-center justify-between gap-4 py-2">
        <Logo name={name} logoUrl={logoUrl} />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => {
              const active = isActive(pathname, n.href);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex min-h-12 items-center px-3 font-semibold text-slate-700 hover:text-primary-ink",
                      active && "text-primary-ink after:absolute after:inset-x-3 after:bottom-1.5 after:h-[3px] after:rounded-full after:bg-accent",
                    )}
                  >
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/portal" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <UserRound aria-hidden /> Portal
          </Link>
          {admissionsOpen && (
            <Link href="/apply" className={buttonVariants({ variant: "accent", size: "sm" })}>
              Apply Now
            </Link>
          )}
        </div>

        <button
          type="button"
          className="inline-flex size-12 items-center justify-center rounded-xl text-primary-ink hover:bg-primary-soft lg:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
        </button>
      </div>

      <div id={menuId} hidden={!open} className="border-t border-slate-200 bg-white shadow-lg lg:hidden">
        <nav aria-label="Main (mobile)" className="container-page py-3">
          <ul className="space-y-1">
            {NAV.map((n) => {
              const active = isActive(pathname, n.href);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center rounded-xl px-4 text-lg font-semibold",
                      active ? "bg-accent-soft text-accent-ink" : "text-slate-800 hover:bg-slate-100",
                    )}
                  >
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 grid gap-3 border-t border-slate-200 pt-4">
            <Link href="/portal" className={buttonVariants({ variant: "outline", size: "full" })}>
              <UserRound aria-hidden /> Portal
            </Link>
            {admissionsOpen && (
              <Link href="/apply" className={buttonVariants({ variant: "accent", size: "full" })}>
                Apply Now
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
