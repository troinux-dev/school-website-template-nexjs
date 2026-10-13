"use server";

import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { db, schema } from "@/db";
import { getSettings, DEFAULT_FORM_FIELDS } from "@/lib/content";
import { isHex, normalizeHex, DEFAULT_ACCENT, DEFAULT_PRIMARY } from "@/lib/colors";
import { str } from "@/lib/utils";
import { logActivity } from "@/lib/activity";
import { currentYear } from "@/lib/dates";

export type OnboardingState = { errors: Record<string, string>; values: Record<string, string> };

const schemaIn = z.object({
  schoolName: z.string().min(2, "Enter the school's name.").max(120),
  primaryColor: z.string().refine(isHex, "Choose a primary colour (e.g. #0B1F3A)."),
  accentColor: z.string().refine(isHex, "Choose a highlight colour (e.g. #D4A62A)."),
  adminName: z.string().min(2, "Enter your full name."),
  adminEmail: z.string().email("Enter your school email address."),
});

function tokenOk(given: string) {
  const expected = process.env.SETUP_TOKEN;
  if (!expected) return true;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function completeOnboarding(_prev: OnboardingState, fd: FormData): Promise<OnboardingState> {
  const values = {
    schoolName: str(fd.get("schoolName")),
    primaryColor: normalizeHex(str(fd.get("primaryColor")), ""),
    accentColor: normalizeHex(str(fd.get("accentColor")), ""),
    adminName: str(fd.get("adminName")),
    adminEmail: str(fd.get("adminEmail")).toLowerCase(),
  };
  const existing = await getSettings();
  if (existing?.onboardedAt) redirect("/");

  const errors: Record<string, string> = {};
  if (!tokenOk(str(fd.get("setupToken")))) errors.setupToken = "That setup code is not correct.";
  const parsed = schemaIn.safeParse(values);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
  }
  if (Object.keys(errors).length) {
    return { errors, values: { ...values, primaryColor: values.primaryColor || DEFAULT_PRIMARY, accentColor: values.accentColor || DEFAULT_ACCENT } };
  }

  const v = parsed.data!;
  await db.transaction(async (tx) => {
    await tx
      .insert(schema.settings)
      .values({
        id: 1,
        schoolName: v.schoolName,
        primaryColor: v.primaryColor,
        accentColor: v.accentColor,
        formFields: DEFAULT_FORM_FIELDS,
        admissionsYear: currentYear() + 1,
        onboardedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.settings.id,
        set: { schoolName: v.schoolName, primaryColor: v.primaryColor, accentColor: v.accentColor, onboardedAt: new Date() },
      });
    await tx
      .insert(schema.users)
      .values({ email: v.adminEmail, name: v.adminName, role: "admin", status: "invited" })
      .onConflictDoUpdate({ target: schema.users.email, set: { role: "admin", name: v.adminName } });
  });
  await logActivity(v.adminName, `set up the website for ${v.schoolName}`);
  redirect("/portal?welcome=1");
}
