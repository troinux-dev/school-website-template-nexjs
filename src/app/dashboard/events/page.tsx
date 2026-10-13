import { asc, desc, gte, lt, sql } from "drizzle-orm";
import { Trash2 } from "lucide-react";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/session";
import { getSiteSettings } from "@/lib/content";
import { AUDIENCES, EVENT_TYPES } from "@/lib/event-types";
import { eventWhen } from "@/lib/events";
import { todayISO } from "@/lib/dates";
import { PageTitle, Panel } from "@/components/dashboard/ui";
import { DateBlock, PrivateTag, TypePill } from "@/components/site/bits";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { addEvent, deleteEvent, saveTermDates } from "../_actions/events";

function EventRow({ e }: { e: typeof schema.events.$inferSelect }) {
  return (
    <li className="flex flex-wrap items-center gap-4 py-3">
      <DateBlock date={e.startDate} type={e.type} />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-semibold">{e.title}</p>
        <p className="text-sm text-slate-700">
          {eventWhen(e)}
          {e.location ? ` · ${e.location}` : ""}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <TypePill type={e.type} />
          {e.visibility === "private" ? <PrivateTag audience={e.audience} /> : <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-semibold text-green-900">Public</span>}
        </div>
      </div>
      <form action={deleteEvent}>
        <input type="hidden" name="id" value={e.id} />
        <Button type="submit" variant="dangerGhost" size="sm">
          <Trash2 aria-hidden /> Delete <span className="sr-only">{e.title}</span>
        </Button>
      </form>
    </li>
  );
}

export default async function EventsDashboard() {
  const u = await requireUser();
  const s = await getSiteSettings();
  const today = todayISO();
  const end = sql`coalesce(${schema.events.endDate}, ${schema.events.startDate})`;
  const [upcoming, past] = await Promise.all([
    db.select().from(schema.events).where(gte(end, today)).orderBy(asc(schema.events.startDate)).limit(100),
    db.select().from(schema.events).where(lt(end, today)).orderBy(desc(schema.events.startDate)).limit(20),
  ]);
  const term = (n: number) => s.termDates.find((t) => t.term === n);

  return (
    <>
      <PageTitle title="Calendar events" intro="Public events show on the Calendar and the homepage. Private events only show to signed-in users." />
      <div className="space-y-6">
        <Panel title="Add an event" id="add">
          <form action={addEvent} className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Event name" htmlFor="title" required className="md:col-span-2 xl:col-span-1">
              <Input id="title" name="title" required />
            </Field>
            <Field label="Type" htmlFor="type" required>
              <Select id="type" name="type" defaultValue="" required>
                <option value="" disabled>Choose a type</option>
                {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Start date" htmlFor="startDate" required>
              <Input id="startDate" name="startDate" type="date" required />
            </Field>
            <Field label="End date" htmlFor="endDate" hint="For events longer than a day.">
              <Input id="endDate" name="endDate" type="date" />
            </Field>
            <Field label="Time" htmlFor="time" hint="e.g. 08:00 or 14:00–16:00">
              <Input id="time" name="time" />
            </Field>
            <Field label="Location" htmlFor="location">
              <Input id="location" name="location" />
            </Field>
            <Field label="Visibility" htmlFor="visibility" required>
              <Select id="visibility" name="visibility" defaultValue="public">
                <option value="public">Public — everyone</option>
                <option value="private">Private — signed-in users</option>
              </Select>
            </Field>
            <Field label="Audience" htmlFor="audience" hint="Only used for private events.">
              <Select id="audience" name="audience" defaultValue="">
                <option value="">—</option>
                {AUDIENCES.map((a) => <option key={a}>{a}</option>)}
              </Select>
            </Field>
            <div className="flex items-end">
              <Button type="submit">Add event</Button>
            </div>
          </form>
        </Panel>

        <Panel title={`Upcoming (${upcoming.length})`} id="upcoming">
          {upcoming.length ? <ul className="divide-y divide-slate-100">{upcoming.map((e) => <EventRow key={e.id} e={e} />)}</ul> : <p className="text-slate-600">No upcoming events.</p>}
        </Panel>

        {u.role === "admin" && (
          <Panel title="Term dates" id="terms">
            <form action={saveTermDates} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((n) => (
                  <fieldset key={n} className="rounded-xl border border-slate-200 p-4">
                    <legend className="px-1 font-semibold">Term {n}</legend>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Starts" htmlFor={`t${n}_start`}>
                        <Input id={`t${n}_start`} name={`t${n}_start`} type="date" defaultValue={term(n)?.start ?? ""} />
                      </Field>
                      <Field label="Ends" htmlFor={`t${n}_end`}>
                        <Input id={`t${n}_end`} name={`t${n}_end`} type="date" defaultValue={term(n)?.end ?? ""} />
                      </Field>
                    </div>
                  </fieldset>
                ))}
              </div>
              <Button type="submit" variant="outline">Save term dates</Button>
            </form>
          </Panel>
        )}

        {past.length > 0 && (
          <Panel title="Recent past events" id="past">
            <ul className="divide-y divide-slate-100">{past.map((e) => <EventRow key={e.id} e={e} />)}</ul>
          </Panel>
        )}
      </div>
    </>
  );
}
