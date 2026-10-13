import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { CalendarPlus, ChevronLeft, ChevronRight, Download, Lock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DateBlock, PrivateTag, TypePill } from "@/components/site/bits";
import { cn } from "@/lib/utils";
import { getSiteSettings } from "@/lib/content";
import { getCurrentUser } from "@/lib/session";
import { countHiddenPrivate, eventsBetween, eventWhen, howSoon, upcomingEvents, type CalendarEvent } from "@/lib/events";
import { EVENT_STYLE, EVENT_TYPES } from "@/lib/event-types";
import { addDays, diffDays, fmtLong, fmtMonthYear, monthKey, parseMonthKey, shiftMonth, todayISO, weekdayMon } from "@/lib/dates";

export const metadata: Metadata = { title: "Calendar" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Segment = { e: CalendarEvent; start: number; end: number; lane: number };

/** Split events into per-week bars and stack overlapping bars into lanes. */
function layoutWeek(weekStart: string, events: CalendarEvent[]): { segments: Segment[]; lanes: number } {
  const weekEnd = addDays(weekStart, 6);
  const segs: Segment[] = [];
  const laneEnds: number[] = [];
  const inWeek = events
    .filter((e) => e.startDate <= weekEnd && (e.endDate ?? e.startDate) >= weekStart)
    .sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : eventLen(b) - eventLen(a)));
  for (const e of inWeek) {
    const start = Math.max(0, diffDays(weekStart, e.startDate));
    const end = Math.min(6, diffDays(weekStart, e.endDate ?? e.startDate));
    let lane = laneEnds.findIndex((le) => le < start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else laneEnds[lane] = end;
    segs.push({ e, start, end, lane });
  }
  return { segments: segs, lanes: laneEnds.length };
}

function eventLen(e: CalendarEvent) {
  return e.endDate ? diffDays(e.startDate, e.endDate) : 0;
}

function href(m: string, type?: string) {
  const q = new URLSearchParams({ m });
  if (type) q.set("type", type);
  return `/calendar?${q}`;
}

export default async function CalendarPage({ searchParams }: Props) {
  const sp = await searchParams;
  const user = await getCurrentUser().catch(() => null);
  const signedIn = Boolean(user);
  const { y, m } = parseMonthKey(typeof sp.m === "string" ? sp.m : undefined);
  const types = signedIn ? [...EVENT_TYPES] : EVENT_TYPES.filter((t) => t !== "Meetings");
  const rawType = typeof sp.type === "string" ? sp.type : "";
  const type = (types as string[]).includes(rawType) ? rawType : undefined;

  const today = todayISO();
  const first = monthKey(y, m) + "-01";
  const next = shiftMonth(y, m, 1);
  const last = addDays(monthKey(next.y, next.m) + "-01", -1);
  const gridStart = addDays(first, -weekdayMon(first));
  const gridEnd = addDays(last, 6 - weekdayMon(last));
  const weeks: string[] = [];
  for (let w = gridStart; w <= gridEnd; w = addDays(w, 7)) weeks.push(w);

  const [monthEvents, upcoming, hidden, s, h] = await Promise.all([
    eventsBetween(gridStart, gridEnd, { includePrivate: signedIn, type }),
    upcomingEvents({ limit: 8, includePrivate: signedIn, type }),
    signedIn ? Promise.resolve(0) : countHiddenPrivate(first, last),
    getSiteSettings(),
    headers(),
  ]);
  const nextUp = upcoming[0];
  const prev = shiftMonth(y, m, -1);
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const webcal = `webcal://${host}/api/calendar.ics`;

  return (
    <>
      <section className="bg-primary-soft">
        <div className="container-page py-10 sm:py-14">
          <p className="eyebrow">Calendar</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">School calendar</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-700">Exams, holidays, sport and everything in between.</p>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          {/* CA-05 filters */}
          <nav aria-label="Filter events by type" className="mb-6">
            <ul className="flex flex-wrap gap-2">
              {[undefined, ...types].map((t) => {
                const active = t === type;
                const style = t ? EVENT_STYLE[t] : undefined;
                return (
                  <li key={t ?? "all"}>
                    <Link
                      href={href(monthKey(y, m), t)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "inline-flex min-h-12 items-center gap-2 rounded-full border-2 px-4 font-semibold",
                        active ? "border-primary bg-primary text-primary-fg" : "border-slate-300 bg-white text-slate-800 hover:border-primary-ink",
                      )}
                    >
                      {style && <span className="size-3 rounded-full" style={{ background: style.bg }} aria-hidden />}
                      {t ?? "All events"}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0">
              {/* CA-01 month header */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold" aria-live="polite">{fmtMonthYear(y, m)}</h2>
                <div className="flex gap-2">
                  <Link href={href(monthKey(prev.y, prev.m), type)} className={buttonVariants({ variant: "outline", size: "sm" })} aria-label="Previous month">
                    <ChevronLeft aria-hidden />
                  </Link>
                  <Link href={href(today.slice(0, 7), type)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Today
                  </Link>
                  <Link href={href(monthKey(next.y, next.m), type)} className={buttonVariants({ variant: "outline", size: "sm" })} aria-label="Next month">
                    <ChevronRight aria-hidden />
                  </Link>
                </div>
              </div>

              {/* CA-01.4: the grid scrolls inside its own box on narrow screens */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200" tabIndex={0} role="region" aria-label={`Month grid, ${fmtMonthYear(y, m)}`}>
                <div className="min-w-[44rem]">
                  <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-sm font-bold text-slate-700">
                    {WEEKDAYS.map((d) => (
                      <div key={d} className="py-2">{d}</div>
                    ))}
                  </div>
                  {weeks.map((ws) => {
                    const { segments, lanes } = layoutWeek(ws, monthEvents);
                    return (
                      <div key={ws} className="relative grid grid-cols-7 border-b border-slate-200 last:border-b-0" style={{ gridTemplateRows: `2.5rem repeat(${Math.max(lanes, 1)}, 1.75rem) 0.75rem` }}>
                        {Array.from({ length: 7 }, (_, i) => {
                          const day = addDays(ws, i);
                          const inMonth = day.slice(0, 7) === monthKey(y, m);
                          const isToday = day === today;
                          return (
                            <div
                              key={day}
                              className={cn("border-r border-slate-200 last:border-r-0", !inMonth && "bg-slate-50")}
                              style={{ gridColumn: i + 1, gridRow: `1 / span ${Math.max(lanes, 1) + 2}` }}
                            >
                              <span
                                className={cn(
                                  "m-1.5 inline-grid size-8 place-items-center rounded-full text-sm font-semibold",
                                  isToday ? "bg-accent text-accent-fg ring-2 ring-accent ring-offset-2" : inMonth ? "text-slate-900" : "text-slate-500",
                                )}
                              >
                                <span aria-hidden>{Number(day.slice(8))}</span>
                                <span className="sr-only">{fmtLong(day)}{isToday ? " (today)" : ""}</span>
                              </span>
                            </div>
                          );
                        })}
                        {segments.map(({ e, start, end, lane }) => {
                          const st = EVENT_STYLE[e.type] ?? EVENT_STYLE.Meetings;
                          const startsHere = diffDays(ws, e.startDate) === start;
                          const endsHere = diffDays(ws, e.endDate ?? e.startDate) === end;
                          return (
                            <div
                              key={`${e.id}-${ws}`}
                              className={cn(
                                "z-10 mx-0.5 flex items-center gap-1 overflow-hidden px-2 text-xs font-semibold text-white",
                                startsHere ? "ml-1 rounded-l-md" : "",
                                endsHere ? "mr-1 rounded-r-md" : "",
                              )}
                              style={{ gridColumn: `${start + 1} / ${end + 2}`, gridRow: lane + 2, background: st.bg, marginBlock: 2 }}
                              title={`${e.title} · ${eventWhen(e)}`}
                            >
                              {e.visibility === "private" && <Lock className="size-3 shrink-0" aria-label="Private" />}
                              <span className="truncate">{e.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CA-02.3 colour key */}
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2" aria-label="Colour key">
                {types.map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="size-3.5 rounded" style={{ background: EVENT_STYLE[t].bg }} aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>

              {/* CA-06 */}
              {!signedIn && hidden > 0 && (
                <p className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-slate-700">
                  <Lock className="size-4" aria-hidden />
                  {hidden} private event{hidden === 1 ? " is" : "s are"} hidden this month.
                  <Link href="/portal" className="inline-flex min-h-12 items-center font-semibold text-primary-ink underline underline-offset-4">
                    Sign in to the Portal to see them
                  </Link>
                </p>
              )}
            </div>

            <aside className="space-y-6">
              {/* CA-04 */}
              {nextUp && (
                <div className="rounded-2xl bg-primary p-5 text-primary-fg">
                  <p className="text-sm font-bold uppercase tracking-wider text-accent-on-primary">Next up · {howSoon(nextUp)}</p>
                  <p className="mt-1 font-heading text-xl font-semibold">{nextUp.title}</p>
                  <p className="mt-1 opacity-90">{eventWhen(nextUp)}</p>
                </div>
              )}
              <div>
                <h2 className="mb-3 text-xl font-semibold">Upcoming events</h2>
                {upcoming.length ? (
                  <ul className="space-y-3">
                    {upcoming.map((e) => (
                      <li key={e.id} className="card flex gap-3 p-4">
                        <DateBlock date={e.startDate} type={e.type} />
                        <div className="min-w-0 space-y-1">
                          <p className="font-semibold">{e.title}</p>
                          <p className="text-sm text-slate-700">{eventWhen(e)}</p>
                          <div className="flex flex-wrap gap-1.5">
                            <TypePill type={e.type} />
                            {e.visibility === "private" && <PrivateTag audience={e.audience} />}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-600">Nothing coming up.</p>
                )}
              </div>

              {/* CA-07 */}
              <div className="card p-5">
                <h2 className="mb-3 text-xl font-semibold">Term dates</h2>
                {s.termDates.length ? (
                  <dl className="space-y-2">
                    {[...s.termDates].sort((a, b) => a.term - b.term).map((t) => (
                      <div key={t.term} className="flex justify-between gap-3 border-b border-slate-100 pb-2 last:border-0">
                        <dt className="whitespace-nowrap font-semibold">Term {t.term}</dt>
                        <dd className="text-right text-slate-700">{t.start && t.end ? `${fmtLong(t.start)} – ${fmtLong(t.end)}` : "TBC"}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-slate-600">Term dates will be published soon.</p>
                )}
              </div>

              {/* CA-08 */}
              <div className="grid gap-3">
                <a href={webcal} className={buttonVariants({ variant: "primary", size: "full" })}>
                  <CalendarPlus aria-hidden /> Add to my calendar
                </a>
                <a href="/api/calendar.ics?download=1" className={buttonVariants({ variant: "outline", size: "full" })}>
                  <Download aria-hidden /> Download .ics
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
