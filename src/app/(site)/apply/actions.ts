"use server";

import { db, schema } from "@/db";
import { getSiteSettings } from "@/lib/content";
import { str } from "@/lib/utils";

export type ApplyState = { ok: boolean; errors: Record<string, string>; values: Record<string, string>; closed?: boolean };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitEnquiry(_prev: ApplyState, fd: FormData): Promise<ApplyState> {
  const s = await getSiteSettings();
  if (!s.admissionPeriod) return { ok: false, errors: {}, values: {}, closed: true };
  if (str(fd.get("website"))) return { ok: true, errors: {}, values: {} }; // honeypot

  const values: Record<string, string> = {};
  const errors: Record<string, string> = {};
  for (const f of s.formFields) {
    const v = str(fd.get(f.key)).slice(0, 5000);
    values[f.key] = v;
    if (f.required && !v) errors[f.key] = `Enter ${f.label.toLowerCase()}.`;
    else if (v && f.type === "email" && !EMAIL.test(v)) errors[f.key] = "Enter a valid email address, like name@example.com.";
    else if (v && f.type === "tel" && !/^[+\d][\d\s()-]{6,}$/.test(v)) errors[f.key] = "Enter a valid phone number.";
  }
  if (Object.keys(errors).length) return { ok: false, errors, values };

  const labelled: Record<string, string> = {};
  for (const f of s.formFields) if (values[f.key]) labelled[f.label] = values[f.key];
  await db.insert(schema.enquiries).values({ data: labelled });
  return { ok: true, errors: {}, values: {} };
}
