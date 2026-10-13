import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { FormField, TermDate } from "@/db/schema";
import { DEFAULT_ACCENT, DEFAULT_PRIMARY } from "./colors";

/* ------------------------------------------------------------------ */
/* Page content shapes                                                 */
/* ------------------------------------------------------------------ */

export type Badge = { name: string; year: string; logoUrl: string };

export type HomeContent = {
  hero: { label: string; headline: string; intro: string; imageUrl: string; imageAlt: string };
  stats: { passRate: string; learners: string; teachers: string; grades: string; foundingYear: string };
  why: { heading: string; body: string };
  testimonial: { quote: string; name: string; grade: string };
  badges: [Badge, Badge, Badge];
  footer: { address: string; city: string; phone: string; facebook: string; instagram: string; youtube: string };
};

export type Leader = { role: string; name: string; qualifications: string; photoUrl: string };
export type PolicyDoc = { name: string; url: string };

export type AboutContent = {
  intro: string;
  story: { text: string; imageUrl: string; imageAlt: string };
  mission: string;
  vision: string;
  values: string;
  leaders: [Leader, Leader, Leader];
  staffDirectoryUrl: string;
  documents: PolicyDoc[];
};

export type Department = { name: string; email: string; phone: string };

export type ContactContent = {
  phone: string;
  officeHours: string;
  email: string;
  replyTime: string;
  address: string;
  directionsUrl: string;
  mapEmbedUrl: string;
  departments: Department[];
};

export type PageKey = "home" | "about" | "contact";
export type PageMap = { home: HomeContent; about: AboutContent; contact: ContactContent };

/* ------------------------------------------------------------------ */
/* Defaults (placeholders an admin replaces in the dashboard)          */
/* ------------------------------------------------------------------ */

const emptyBadge = (): Badge => ({ name: "", year: "", logoUrl: "" });

export function defaultHome(schoolName = "[School Name]"): HomeContent {
  return {
    hero: {
      label: "Admissions now open",
      headline: `Where every learner at ${schoolName} is known by name`,
      intro: "A caring, high-achieving school community that prepares children for the world ahead.",
      imageUrl: "",
      imageAlt: "Learners on the school field",
    },
    stats: { passRate: "", learners: "", teachers: "", grades: "R–7", foundingYear: "" },
    why: {
      heading: "Why families choose us",
      body: "Small classes, dedicated teachers and a strong sense of belonging. We balance academic excellence with sport, culture and character.",
    },
    testimonial: { quote: "", name: "", grade: "" },
    badges: [emptyBadge(), emptyBadge(), emptyBadge()],
    footer: { address: "", city: "", phone: "", facebook: "", instagram: "", youtube: "" },
  };
}

export function defaultAbout(): AboutContent {
  return {
    intro: "Get to know our school, our people and what we stand for.",
    story: { text: "", imageUrl: "", imageAlt: "Our school campus" },
    mission: "",
    vision: "",
    values: "",
    leaders: [
      { role: "Principal", name: "", qualifications: "", photoUrl: "" },
      { role: "Deputy principal", name: "", qualifications: "", photoUrl: "" },
      { role: "Chair of the governing body", name: "", qualifications: "", photoUrl: "" },
    ],
    staffDirectoryUrl: "/contact",
    documents: [],
  };
}

export function defaultContact(): ContactContent {
  return {
    phone: "",
    officeHours: "Mon–Fri, 07:30–15:30",
    email: "",
    replyTime: "We reply within 1 working day",
    address: "",
    directionsUrl: "",
    mapEmbedUrl: "",
    departments: [
      { name: "Admissions", email: "", phone: "" },
      { name: "Accounts & fees", email: "", phone: "" },
      { name: "Sport coordinator", email: "", phone: "" },
      { name: "Learner support", email: "", phone: "" },
    ],
  };
}

export const DEFAULT_FORM_FIELDS: FormField[] = [
  { key: "parentName", label: "Parent/guardian name", type: "text", required: true, builtin: true },
  { key: "email", label: "Email", type: "email", required: true, builtin: true },
  { key: "phone", label: "Phone", type: "tel", required: true, builtin: true },
  { key: "learnerName", label: "Learner's full name", type: "text", required: true, builtin: true },
  { key: "grade", label: "Grade applying for", type: "select", required: true, builtin: true },
  { key: "startYear", label: "Start year", type: "select", required: true, builtin: true },
  { key: "notes", label: "Anything we should know?", type: "textarea", required: false, builtin: true },
];

export const MAX_FORM_FIELDS = 7;

export const ALL_GRADES = ["R", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

/* ------------------------------------------------------------------ */
/* Readers                                                             */
/* ------------------------------------------------------------------ */

export type Settings = typeof schema.settings.$inferSelect;

export const getSettings = cache(async (): Promise<Settings | null> => {
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.id, 1)).limit(1);
  return row ?? null;
});

/** Settings with safe fallbacks, for rendering. */
export const getSiteSettings = cache(async () => {
  const s = await getSettings();
  return {
    schoolName: s?.schoolName ?? "[School Name]",
    primaryColor: s?.primaryColor ?? DEFAULT_PRIMARY,
    accentColor: s?.accentColor ?? DEFAULT_ACCENT,
    logoUrl: s?.logoUrl ?? "",
    admissionPeriod: s?.admissionPeriod ?? false,
    admissionsYear: s?.admissionsYear ?? new Date().getFullYear() + 1,
    admissionsOpenDate: s?.admissionsOpenDate ?? null,
    admissionsCloseDate: s?.admissionsCloseDate ?? null,
    openGrades: s?.openGrades ?? [],
    formFields: s?.formFields?.length ? s.formFields : DEFAULT_FORM_FIELDS,
    termDates: (s?.termDates ?? []) as TermDate[],
    replyDays: s?.replyDays ?? 2,
    onboarded: Boolean(s?.onboardedAt),
  };
});

export type SiteSettings = Awaited<ReturnType<typeof getSiteSettings>>;

function merge<T>(base: T, over: unknown): T {
  if (Array.isArray(base)) {
    if (!Array.isArray(over)) return base;
    // Fixed-length tuples (badges, leaders) keep their length; open lists (documents) take the stored list.
    return (base.length && over.length <= base.length
      ? base.map((b, i) => (i < over.length ? merge(b, over[i]) : b))
      : over) as T;
  }
  if (base && typeof base === "object") {
    if (!over || typeof over !== "object") return base;
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const k of Object.keys(over as object)) {
      const bv = (base as Record<string, unknown>)[k];
      const ov = (over as Record<string, unknown>)[k];
      out[k] = bv === undefined ? ov : merge(bv, ov);
    }
    return out as T;
  }
  return (over === undefined || over === null ? base : over) as T;
}

function defaults(page: PageKey, schoolName: string) {
  return page === "home" ? defaultHome(schoolName) : page === "about" ? defaultAbout() : defaultContact();
}

/** Published content for the public site; draft content when `preview` is true. */
export const getPage = cache(async <K extends PageKey>(page: K, preview = false): Promise<PageMap[K]> => {
  const { schoolName } = await getSiteSettings();
  const [row] = await db.select().from(schema.pageContent).where(eq(schema.pageContent.page, page)).limit(1);
  const stored = preview ? (row?.draft ?? row?.published) : row?.published;
  return merge(defaults(page, schoolName), stored) as PageMap[K];
});

/** For the editor: the working draft (falls back to published). */
export async function getDraft<K extends PageKey>(page: K) {
  const { schoolName } = await getSiteSettings();
  const [row] = await db.select().from(schema.pageContent).where(eq(schema.pageContent.page, page)).limit(1);
  return {
    content: merge(defaults(page, schoolName), row?.draft ?? row?.published) as PageMap[K],
    hasUnpublished: Boolean(row?.draft),
    publishedAt: row?.publishedAt ?? null,
  };
}
