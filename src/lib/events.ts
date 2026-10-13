import "server-only";
import { and, asc, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { addDays, diffDays, fmtShort, todayISO } from "./dates";
export { EVENT_TYPES, EVENT_STYLE, AUDIENCES, type EventType } from "./event-types";

export type CalendarEvent = typeof schema.events.$inferSelect;

const endOf = sql`coalesce(${schema.events.endDate}, ${schema.events.startDate})`;

function visibility(includePrivate: boolean): SQL | undefined {
  return includePrivate ? undefined : eq(schema.events.visibility, "public");
}

function typeFilter(type?: string): SQL | undefined {
  return type ? eq(schema.events.type, type) : undefined;
}

/** Events that haven't finished yet (in-progress events count as upcoming — HM-05.6). */
export async function upcomingEvents(opts: { limit: number; includePrivate?: boolean; type?: string }) {
  return db
    .select()
    .from(schema.events)
    .where(and(gte(endOf, todayISO()), visibility(Boolean(opts.includePrivate)), typeFilter(opts.type)))
    .orderBy(asc(schema.events.startDate), asc(schema.events.id))
    .limit(opts.limit);
}

/** Events overlapping [from, to]. */
export async function eventsBetween(from: string, to: string, opts: { includePrivate?: boolean; type?: string }) {
  return db
    .select()
    .from(schema.events)
    .where(and(lte(schema.events.startDate, to), gte(endOf, from), visibility(Boolean(opts.includePrivate)), typeFilter(opts.type)))
    .orderBy(asc(schema.events.startDate), asc(schema.events.id));
}

export async function countHiddenPrivate(from: string, to: string) {
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.events)
    .where(and(eq(schema.events.visibility, "private"), lte(schema.events.startDate, to), gte(endOf, from)));
  return r?.n ?? 0;
}

export function eventDays(e: Pick<CalendarEvent, "startDate" | "endDate">) {
  return e.endDate ? diffDays(e.startDate, e.endDate) + 1 : 1;
}

/** "Thu 22 Oct – Mon 2 Nov · 12 days" or "Thu 22 Oct · 08:00" */
export function eventWhen(e: Pick<CalendarEvent, "startDate" | "endDate" | "time">) {
  const days = eventDays(e);
  if (days > 1) return `${fmtShort(e.startDate)} – ${fmtShort(e.endDate!)} · ${days} days`;
  return e.time ? `${fmtShort(e.startDate)} · ${e.time}` : fmtShort(e.startDate);
}

/** "Happening now" / "Tomorrow" / "In N days" / "Today" */
export function howSoon(e: Pick<CalendarEvent, "startDate" | "endDate">) {
  const t = todayISO();
  if (e.startDate <= t && (e.endDate ?? e.startDate) >= t) {
    return e.startDate === t && !e.endDate ? "Today" : "Happening now";
  }
  const n = diffDays(t, e.startDate);
  return n === 1 ? "Tomorrow" : `In ${n} days`;
}

export { addDays };
