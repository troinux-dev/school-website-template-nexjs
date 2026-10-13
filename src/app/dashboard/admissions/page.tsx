import { desc } from "drizzle-orm";
import { Lock } from "lucide-react";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/session";
import { ALL_GRADES, MAX_FORM_FIELDS, getSiteSettings } from "@/lib/content";
import { AdmissionSwitch } from "@/components/dashboard/admission-switch";
import { PageTitle, Panel } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { addFormField, saveAdmissionSettings } from "../_actions/admissions";

export default async function AdmissionsDashboard() {
  const u = await requireUser();
  const s = await getSiteSettings();
  const isAdmin = u.role === "admin";
  const enquiries = await db.select().from(schema.enquiries).orderBy(desc(schema.enquiries.createdAt)).limit(20);

  return (
    <>
      <PageTitle title="Admissions" intro="Open or close admissions and manage the enquiry form." />
      <div className="space-y-6">
        <Panel title="Admission period" id="switch">
          <AdmissionSwitch on={s.admissionPeriod} back="/dashboard/admissions" />
        </Panel>

        {isAdmin ? (
          <>
            <form action={saveAdmissionSettings} className="space-y-6">
              <Panel title="Dates and grades" id="dates">
                <div className="grid gap-5 md:grid-cols-4">
                  <Field label="Admissions year" htmlFor="admissionsYear" required>
                    <Input id="admissionsYear" name="admissionsYear" type="number" inputMode="numeric" defaultValue={s.admissionsYear} required />
                  </Field>
                  <Field label="Applications open" htmlFor="openDate">
                    <Input id="openDate" name="openDate" type="date" defaultValue={s.admissionsOpenDate ?? ""} />
                  </Field>
                  <Field label="Applications close" htmlFor="closeDate">
                    <Input id="closeDate" name="closeDate" type="date" defaultValue={s.admissionsCloseDate ?? ""} />
                  </Field>
                  <Field label="Reply within (working days)" htmlFor="replyDays" required>
                    <Input id="replyDays" name="replyDays" type="number" inputMode="numeric" min={1} max={30} defaultValue={s.replyDays} required />
                  </Field>
                </div>
                <fieldset className="mt-6">
                  <legend className="font-semibold">Grades open for applications</legend>
                  <p className="text-sm text-slate-600">None ticked shows Grade R–7.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ALL_GRADES.map((g) => (
                      <label key={g} className="inline-flex min-h-12 min-w-16 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 font-semibold has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                        <input type="checkbox" name="grades" value={g} defaultChecked={s.openGrades.includes(g)} className="size-5" />
                        {g === "R" ? "Grade R" : `Grade ${g}`}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </Panel>

              <Panel title={`Application form fields (${s.formFields.length} of ${MAX_FORM_FIELDS})`} id="fields">
                <ul className="divide-y divide-slate-100">
                  {s.formFields.map((f) => (
                    <li key={f.key} className="grid gap-3 py-3 sm:grid-cols-[1fr_12rem_auto] sm:items-center">
                      {f.builtin ? (
                        <p className="font-semibold">{f.label}</p>
                      ) : (
                        <div>
                          <label htmlFor={`label_${f.key}`} className="sr-only">Label</label>
                          <Input id={`label_${f.key}`} name={`label_${f.key}`} defaultValue={f.label} />
                        </div>
                      )}
                      <div>
                        <label htmlFor={`req_${f.key}`} className="sr-only">{f.label}: required or optional</label>
                        <Select id={`req_${f.key}`} name={`req_${f.key}`} defaultValue={f.required ? "required" : "optional"}>
                          <option value="required">Required</option>
                          <option value="optional">Optional</option>
                        </Select>
                      </div>
                      {!f.builtin ? (
                        <label className="inline-flex min-h-12 items-center gap-2 font-semibold text-red-700">
                          <input type="checkbox" name="remove" value={f.key} className="size-5" /> Remove
                        </label>
                      ) : (
                        <span />
                      )}
                    </li>
                  ))}
                </ul>
              </Panel>
              <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
                <Button type="submit">Save admissions settings</Button>
              </div>
            </form>

            <Panel title="Add a field" id="add-field">
              {s.formFields.length >= MAX_FORM_FIELDS ? (
                <p className="text-slate-700">The form has the maximum of {MAX_FORM_FIELDS} fields. Remove a custom field to add another — shorter forms get more enquiries.</p>
              ) : (
                <form action={addFormField} className="grid gap-4 md:grid-cols-[1fr_12rem_auto_auto] md:items-end">
                  <Field label="Label" htmlFor="newLabel" required>
                    <Input id="newLabel" name="label" required />
                  </Field>
                  <Field label="Type" htmlFor="newType" required>
                    <Select id="newType" name="type" defaultValue="text">
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="tel">Phone</option>
                      <option value="number">Number</option>
                      <option value="textarea">Long text</option>
                    </Select>
                  </Field>
                  <label className="inline-flex min-h-12 items-center gap-2 font-semibold">
                    <input type="checkbox" name="required" className="size-5" /> Required
                  </label>
                  <Button type="submit" variant="outline">Add a field</Button>
                </form>
              )}
            </Panel>
          </>
        ) : (
          <p className="flex items-center gap-2 rounded-xl bg-slate-100 p-4 text-slate-800">
            <Lock className="size-5" aria-hidden /> Admissions dates, open grades and form fields can only be changed by an Admin.
          </p>
        )}

        <Panel title="Recent enquiries" id="enquiries">
          {enquiries.length ? (
            <ul className="divide-y divide-slate-100">
              {enquiries.map((e) => (
                <li key={e.id} className="py-3">
                  <p className="text-sm text-slate-600">{new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeStyle: "short" }).format(e.createdAt)}</p>
                  <dl className="mt-1 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                    {Object.entries(e.data).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <dt className="font-semibold">{k}:</dt>
                        <dd className="break-words text-slate-800">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600">No enquiries yet.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
