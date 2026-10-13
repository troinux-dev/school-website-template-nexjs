import { and, asc, eq, gte } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSiteSettings } from "@/lib/content";
import { addDays, todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** CA-08: public events only, as an iCalendar feed. */
export async function GET(req: Request) {
  const s = await getSiteSettings();
  const since = addDays(todayISO(), -180);
  const rows = await db
    .select()
    .from(schema.events)
    .where(and(eq(schema.events.visibility, "public"), gte(schema.events.startDate, since)))
    .orderBy(asc(schema.events.startDate));
  const host = process.env.AUTH_URL ? new URL(process.env.AUTH_URL).host : new URL(req.url).hostname;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${esc(s.schoolName)}//School Calendar//EN`,
    `X-WR-CALNAME:${esc(s.schoolName)}`,
    "CALSCALE:GREGORIAN",
    ...rows.flatMap((e) => [
      "BEGIN:VEVENT",
      `UID:event-${e.id}@${host}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${e.startDate.replace(/-/g, "")}`,
      `DTEND;VALUE=DATE:${addDays(e.endDate ?? e.startDate, 1).replace(/-/g, "")}`,
      `SUMMARY:${esc(e.title)}`,
      `CATEGORIES:${esc(e.type)}`,
      ...(e.location ? [`LOCATION:${esc(e.location)}`] : []),
      ...(e.time ? [`DESCRIPTION:${esc("Time: " + e.time)}`] : []),
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  const download = new URL(req.url).searchParams.has("download");
  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      ...(download ? { "Content-Disposition": 'attachment; filename="school-calendar.ics"' } : {}),
      "Cache-Control": "public, max-age=300",
    },
  });
}
