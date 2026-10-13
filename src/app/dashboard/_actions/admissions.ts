"use server";

import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin, requireUser } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { done } from "@/lib/flash";
import { str } from "@/lib/utils";
import { ALL_GRADES, MAX_FORM_FIELDS, getSiteSettings } from "@/lib/content";
import type { FormField } from "@/db/schema";

/** DB-07.1 — both roles may switch admissions on or off. */
export async function setAdmissionPeriod(fd: FormData) {
  const u = await requireUser();
  const on = fd.get("on") === "1";
  const back = str(fd.get("back")) || "/dashboard/admissions";
  await db.update(schema.settings).set({ admissionPeriod: on, updatedAt: new Date() }).where(eq(schema.settings.id, 1));
  await logActivity(u.name, on ? "opened admissions" : "closed admissions");
  done(back, on ? "Admissions are now open. Apply Now is showing on the website." : "Admissions are now closed. Apply Now is hidden on the website.");
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** DB-07.2 — admin-only settings. */
export async function saveAdmissionSettings(fd: FormData) {
  const u = await requireAdmin();
  const year = Number(str(fd.get("admissionsYear")));
  const open = str(fd.get("openDate"));
  const close = str(fd.get("closeDate"));
  const replyDays = Math.min(30, Math.max(1, Number(str(fd.get("replyDays"))) || 2));
  if (!Number.isInteger(year) || year < 2000 || year > 2100) done("/dashboard/admissions", "Enter a valid admissions year.", "error");
  if ((open && !DATE.test(open)) || (close && !DATE.test(close))) done("/dashboard/admissions", "Enter valid dates.", "error");
  if (open && close && close < open) done("/dashboard/admissions", "The close date must be after the open date.", "error");
  const grades = fd.getAll("grades").map(String).filter((g) => ALL_GRADES.includes(g));

  const current = await getSiteSettings();
  const fields: FormField[] = current.formFields.map((f) => ({
    ...f,
    required: fd.get(`req_${f.key}`) === "required",
    label: f.builtin ? f.label : str(fd.get(`label_${f.key}`)) || f.label,
  }));
  const removed = new Set(fd.getAll("remove").map(String));
  const kept = fields.filter((f) => f.builtin || !removed.has(f.key));

  await db
    .update(schema.settings)
    .set({
      admissionsYear: year,
      admissionsOpenDate: open || null,
      admissionsCloseDate: close || null,
      openGrades: grades,
      formFields: kept,
      replyDays,
      updatedAt: new Date(),
    })
    .where(eq(schema.settings.id, 1));
  await logActivity(u.name, "updated admissions settings");
  done("/dashboard/admissions", "Admissions settings saved.");
}

export async function addFormField(fd: FormData) {
  const u = await requireAdmin();
  const label = str(fd.get("label"));
  const type = str(fd.get("type")) as FormField["type"];
  if (!label) done("/dashboard/admissions", "Give the new field a label.", "error");
  if (!["text", "email", "tel", "number", "textarea"].includes(type)) done("/dashboard/admissions", "Choose a field type.", "error");
  const s = await getSiteSettings();
  if (s.formFields.length >= MAX_FORM_FIELDS) {
    done("/dashboard/admissions", `The form already has ${MAX_FORM_FIELDS} fields — remove one before adding another.`, "error");
  }
  const field: FormField = { key: `custom_${Date.now().toString(36)}`, label, type, required: fd.get("required") === "on", builtin: false };
  await db.update(schema.settings).set({ formFields: [...s.formFields, field] }).where(eq(schema.settings.id, 1));
  await logActivity(u.name, `added "${label}" to the admissions form`);
  done("/dashboard/admissions", `"${label}" added to the form.`);
}
