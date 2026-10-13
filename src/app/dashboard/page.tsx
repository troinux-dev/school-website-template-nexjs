import Link from "next/link";
import { count, desc, gte, sql } from "drizzle-orm";
import { CalendarPlus, ImagePlus, LayoutTemplate, PenSquare } from "lucide-react";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/session";
import { getSiteSettings } from "@/lib/content";
import { todayISO } from "@/lib/dates";
import { AdmissionSwitch } from "@/components/dashboard/admission-switch";
import { PageTitle, Panel } from "@/components/dashboard/ui";

function ago(d: Date) {
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  return new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short" }).format(d);
}

export default async function Overview() {
  const u = await requireUser();
  const s = await getSiteSettings();
  const monthStart = new Date(todayISO().slice(0, 7) + "-01T00:00:00Z");
  const end = sql`coalesce(${schema.events.endDate}, ${schema.events.startDate})`;
  const [[photos], [events], [enq], [msgs], recent] = await Promise.all([
    db.select({ n: count() }).from(schema.photos),
    db.select({ n: count() }).from(schema.events).where(gte(end, todayISO())),
    db.select({ n: count() }).from(schema.enquiries).where(gte(schema.enquiries.createdAt, monthStart)),
    db.select({ n: count() }).from(schema.contactMessages).where(gte(schema.contactMessages.createdAt, monthStart)),
    db.select().from(schema.activity).orderBy(desc(schema.activity.createdAt)).limit(10),
  ]);

  const actions = [
    { href: "/dashboard/gallery#upload", label: "Upload photos", icon: ImagePlus, admin: false },
    { href: "/dashboard/events#add", label: "Add an event", icon: CalendarPlus, admin: false },
    { href: "/dashboard/pages?tab=home", label: "Edit the homepage", icon: LayoutTemplate, admin: true },
    { href: "/dashboard/news?new=1", label: "Write a news post", icon: PenSquare, admin: true },
  ].filter((a) => u.role === "admin" || !a.admin);

  const glance = [
    { label: "Photos in the gallery", value: photos.n },
    { label: "Upcoming events", value: events.n },
    { label: "Admission enquiries this month", value: enq.n },
    { label: "Contact messages this month", value: msgs.n },
  ];

  return (
    <>
      <PageTitle title={`Welcome, ${u.name.split(" ")[0]}`} intro={`You're signed in as ${u.role === "admin" ? "an Admin" : "Staff"}.`} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Admissions" id="admissions" className="xl:col-span-2">
          <AdmissionSwitch on={s.admissionPeriod} back="/dashboard" />
        </Panel>
        <Panel title="Quick actions" id="quick">
          <ul className="grid gap-3 sm:grid-cols-2">
            {actions.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 px-4 font-semibold text-primary-ink hover:bg-primary-soft">
                  <Icon className="size-5" aria-hidden /> {label}
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="At a glance" id="glance">
          <dl className="grid grid-cols-2 gap-4">
            {glance.map((g) => (
              <div key={g.label} className="rounded-xl bg-slate-50 p-4">
                <dd className="font-heading text-3xl font-semibold text-primary-ink">{g.value}</dd>
                <dt className="text-sm text-slate-700">{g.label}</dt>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel title="Recent activity" id="activity" className="xl:col-span-2">
          {recent.length ? (
            <ul className="divide-y divide-slate-100">
              {recent.map((a) => (
                <li key={a.id} className="flex flex-wrap justify-between gap-2 py-3">
                  <span><strong>{a.actor}</strong> {a.action}</span>
                  <time className="text-sm text-slate-600" dateTime={a.createdAt.toISOString()}>{ago(a.createdAt)}</time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600">No activity yet.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
