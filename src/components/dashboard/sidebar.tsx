"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CalendarDays, FileText, Gauge, Images, LayoutTemplate, Menu, Newspaper, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Overview", icon: Gauge, admin: false },
  { href: "/dashboard/pages", label: "Website pages", icon: LayoutTemplate, admin: true },
  { href: "/dashboard/news", label: "News & blog", icon: Newspaper, admin: true },
  { href: "/dashboard/gallery", label: "Gallery", icon: Images, admin: false },
  { href: "/dashboard/events", label: "Calendar events", icon: CalendarDays, admin: false },
  { href: "/dashboard/admissions", label: "Admissions", icon: FileText, admin: false },
  { href: "/dashboard/users", label: "Users & roles", icon: Users, admin: true },
];

export function Sidebar({ role }: { role: "admin" | "staff" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = ITEMS.filter((i) => role === "admin" || !i.admin);

  const list = (
    <ul className="space-y-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 items-center gap-3 rounded-xl px-3 font-semibold",
                active ? "bg-primary text-primary-fg" : "text-slate-700 hover:bg-slate-100",
              )}
            >
              <Icon className="size-5" aria-hidden /> {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <div className="border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="dash-nav"
          className="inline-flex min-h-12 items-center gap-2 rounded-xl px-2 font-semibold text-primary-ink"
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          {open ? "Close menu" : "Dashboard menu"}
        </button>
        <nav id="dash-nav" aria-label="Dashboard" hidden={!open} className="pb-2 pt-1">
          {list}
        </nav>
      </div>
      <nav aria-label="Dashboard" className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-4 lg:block">
        {list}
      </nav>
    </>
  );
}
