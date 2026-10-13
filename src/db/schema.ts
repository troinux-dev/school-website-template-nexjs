import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/** One row (id = 1). Site-wide settings chosen at onboarding and in Admissions. */
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  schoolName: text("school_name").notNull(),
  primaryColor: text("primary_color").notNull().default("#0B1F3A"),
  accentColor: text("accent_color").notNull().default("#D4A62A"),
  logoUrl: text("logo_url"),
  admissionPeriod: boolean("admission_period").notNull().default(false),
  admissionsYear: integer("admissions_year"),
  admissionsOpenDate: date("admissions_open_date"),
  admissionsCloseDate: date("admissions_close_date"),
  openGrades: jsonb("open_grades").$type<string[]>().notNull().default([]),
  formFields: jsonb("form_fields").$type<FormField[]>().notNull().default([]),
  termDates: jsonb("term_dates").$type<TermDate[]>().notNull().default([]),
  replyDays: integer("reply_days").notNull().default(2),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FormField = {
  key: string;
  label: string;
  type: "text" | "email" | "tel" | "select" | "number" | "textarea";
  required: boolean;
  builtin: boolean;
};

export type TermDate = { term: number; start: string; end: string };

/** Draft and published JSON content for the Home, About and Contact Us pages. */
export const pageContent = pgTable("page_content", {
  page: text("page").primaryKey(), // "home" | "about" | "contact"
  draft: jsonb("draft"),
  published: jsonb("published"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

export const photoSets = pgTable("photo_sets", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // Sports | Cultural | Academics | Events
  title: text("title").notNull(),
  eventDate: date("event_date").notNull(),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  setId: integer("set_id")
    .notNull()
    .references(() => photoSets.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: text("alt").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // see EVENT_TYPES
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  time: text("time"),
  location: text("location"),
  visibility: text("visibility").notNull().default("public"), // public | private
  audience: text("audience"), // Parents | Learners | Staff
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(), // Sports | Activities | Announcement
  coverUrl: text("cover_url"),
  body: text("body").notNull().default(""),
  status: text("status").notNull().default("draft"), // draft | published
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: text("role").notNull().default("staff"), // admin | staff
  status: text("status").notNull().default("invited"), // invited | active | disabled
  invitedAt: timestamp("invited_at", { withTimezone: true }).notNull().defaultNow(),
  lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }),
});

export const activity = pgTable("activity", {
  id: serial("id").primaryKey(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  department: text("department"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const enquiries = pgTable("enquiries", {
  id: serial("id").primaryKey(),
  data: jsonb("data").$type<Record<string, string>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
