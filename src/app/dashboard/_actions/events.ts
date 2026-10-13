"use server";

import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin, requireUser } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { done } from "@/lib/flash";
import { str } from "@/lib/utils";
import { AUDIENCES, EVENT_TYPES } from "@/lib/event-types";
import type { TermDate } from "@/db/schema";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const back = "/dashboard/events";

export async function addEvent(fd: FormData) {
  const u = await requireUser();
  const title = str(fd.get("title"));
  const type = str(fd.get("type"));
  const startDate = str(fd.get("startDate"));
  const endDate = str(fd.get("endDate"));
  const visibility = str(fd.get("visibility")) === "private" ? "private" : "public";
  const audience = str(fd.get("audience"));
  if (!title) done(back, "Enter the event name.", "error");
  if (!(EVENT_TYPES as readonly string[]).includes(type)) done(back, "Choose an event type.", "error");
  if (!DATE.test(startDate)) done(back, "Choose a start date.", "error");
  if (endDate && (!DATE.test(endDate) || endDate < startDate)) done(back, "The end date must be on or after the start date.", "error");
  if (visibility === "private" && !(AUDIENCES as readonly string[]).includes(audience)) done(back, "Choose who can see this private event.", "error");

  await db.insert(schema.events).values({
    title,
    type,
    startDate,
    endDate: endDate && endDate !== startDate ? endDate : null,
    time: str(fd.get("time")) || null,
    location: str(fd.get("location")) || null,
    visibility,
    audience: visibility === "private" ? audience : null,
  });
  await logActivity(u.name, `added the event “${title}”`);
  done(back, `“${title}” added to the calendar.`);
}

export async function deleteEvent(fd: FormData) {
  const u = await requireUser();
  const id = Number(fd.get("id"));
  const [e] = await db.delete(schema.events).where(eq(schema.events.id, id)).returning();
  if (!e) done(back, "That event was already deleted.", "error");
  await logActivity(u.name, `deleted the event “${e.title}”`);
  done(back, `“${e.title}” deleted from the calendar.`);
}

export async function saveTermDates(fd: FormData) {
  const u = await requireAdmin();
  const terms: TermDate[] = [1, 2, 3, 4].map((t) => ({ term: t, start: str(fd.get(`t${t}_start`)), end: str(fd.get(`t${t}_end`)) }));
  for (const t of terms) {
    if ((t.start && !DATE.test(t.start)) || (t.end && !DATE.test(t.end))) done(back, `Check the dates for Term ${t.term}.`, "error");
    if (t.start && t.end && t.end < t.start) done(back, `Term ${t.term} ends before it starts.`, "error");
  }
  await db.update(schema.settings).set({ termDates: terms }).where(eq(schema.settings.id, 1));
  await logActivity(u.name, "updated the term dates");
  done(back, "Term dates saved.");
}
